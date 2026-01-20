"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import path from "path";

interface ExtractedData {
    type?: string;
    vaccineName?: string;
    brand?: string;
    lotNumber?: string;
    date?: string;
    error?: string;
}

export async function extractVaccineData(formData: FormData): Promise<ExtractedData> {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn("GEMINI_API_KEY not found. Falling back to mock data.");
            return {
                error: "Missing API Key. Please add GEMINI_API_KEY to .env.local",
                type: "RABIES",
                vaccineName: "Defensor 3",
                brand: "Zoetis",
                lotNumber: "MOCK-123456",
                date: new Date().toISOString().split("T")[0],
            };
        }

        const file = formData.get("file") as File;
        if (!file) {
            return { error: "No file uploaded" };
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const base64Image = buffer.toString("base64");

        // Load knowledge base
        const promptPath = path.join(process.cwd(), "../prompt/vaccine-list.md");
        let vaccineKnowledge = "";
        try {
            vaccineKnowledge = await fs.readFile(promptPath, "utf-8");
        } catch (e) {
            console.error("Could not read vaccine list prompt:", e);
            // Fallback if file not found, but we should try to find it
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
    You are an AI assistant for a veterinary app. Your task is to extract information from a photo of a vaccine sticker.
    
    Here is a reference list of common vaccines in Thailand:
    ${vaccineKnowledge}

    Please extract the following fields from the image:
    1. **Type**: One of 'RABIES', 'COMBINED_5', 'FLU', 'KENNEL_COUGH', 'LEUKEMIA', 'FIP', 'FVRCP', 'FVRCP_C'. 
       Map the vaccine name found to the most appropriate type based on the list above.
    2. **Vaccine Name**: The trade name (e.g., Defensor 3, Vanguard HTLP 5/L).
    3. **Brand**: The manufacturer (e.g., Zoetis, MSD).
    4. **Lot Number**: The Lot No. / Batch No. usually found on the sticker.
    5. **Date**: If a handwritten date is visible on the sticker or book, extract it in YYYY-MM-DD format. If not found, return empty.

    Return the result strictly as valid JSON in this format:
    {
      "type": "...",
      "vaccineName": "...",
      "brand": "...",
      "lotNumber": "...",
      "date": "..."
    }
    
    If you cannot read a value, leave it as an empty string. Do not hallucinate.
    `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: file.type || "image/jpeg",
                },
            },
        ]);

        const response = await result.response;
        const text = response.text();

        // Clean up markdown code blocks if present
        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();

        try {
            const data = JSON.parse(cleanText);
            return {
                type: data.type,
                vaccineName: data.vaccineName,
                brand: data.brand,
                lotNumber: data.lotNumber,
                date: data.date,
            };
        } catch (e) {
            console.error("Failed to parse JSON from Gemini:", text);
            return { error: "Failed to parse AI response" };
        }

    } catch (error: unknown) {
        console.error("AI Extraction Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error during extraction";
        return { error: errorMessage };
    }
}
