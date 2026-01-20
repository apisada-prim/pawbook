"use client";

import { useState } from "react";
import { extractVaccineData } from "@/app/actions/extractVaccine";
import { calculateNextVaccineDate } from "../../../../utils/dateUtils";
import { cropToSquare } from "../../../../utils/imageUtils";

interface AddVaccineModalProps {
    onClose: () => void;
    onUpload: (data: any) => Promise<void>;
    pet: any;
    vaccineOptions: any[];
}

export default function AddVaccineModal({ onClose, onUpload, pet, vaccineOptions }: AddVaccineModalProps) {
    const [step, setStep] = useState<"UPLOAD" | "FORM">("UPLOAD");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>("");

    // Form State
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [formData, setFormData] = useState({
        type: "",
        vaccineId: "",
        brand: "",
        lotNumber: "",
        dateAdministered: "",
        nextDueDate: "",
    });

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const originalFile = e.target.files?.[0];
        if (!originalFile) return;

        try {
            const file = await cropToSquare(originalFile);
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));

            // Auto-trigger AI simulation
            setIsLoadingAI(true);

            const formDataAI = new FormData();
            formDataAI.append("file", file);

            // Call Server Action
            const extracted = await extractVaccineData(formDataAI);

            if (extracted.error) {
                // Determine if we should show an alert (e.g. missing key)
                console.warn("AI Extraction Warning:", extracted.error);
                if (extracted.error.includes("Missing API Key")) {
                    alert("⚠️ Demo Mode: Glue Gemini API Key in .env.local for real AI.");
                }
            }

            // Auto-fill logic
            let matchedVaccineId = "";
            let matchedType = extracted.type || "";

            // Try to find a matching vaccine ID from options
            if (extracted.vaccineName) {
                // 1. Exact or fuzzy match on name
                const vMatch = vaccineOptions.find((v: any) =>
                    v.name.toLowerCase() === extracted.vaccineName?.toLowerCase() ||
                    v.name.toLowerCase().includes(extracted.vaccineName?.toLowerCase() || "") ||
                    (extracted.vaccineName?.toLowerCase() || "").includes(v.name.toLowerCase())
                );

                if (vMatch) {
                    matchedVaccineId = vMatch.id;
                    matchedType = vMatch.type; // Trust our DB type over AI type if we match a vaccine
                }
            }

            setFormData(prev => ({
                ...prev,
                type: matchedType || prev.type,
                vaccineId: matchedVaccineId,
                brand: extracted.brand || prev.brand,
                lotNumber: extracted.lotNumber || "",
                // dateAdministered: extracted.date || prev.dateAdministered 
            }));

            setStep("FORM");
        } catch (error) {
            console.error("AI Extraction failed", error);
            alert("Failed to analyze image. Please try again.");
        } finally {
            setIsLoadingAI(false);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!imagePreview) {
            alert("Please take a photo first");
            return;
        }

        // We need to upload the file first to get a URL (simulating legacy logic)
        // In a real refactor, we might want to move this upload logic to the parent or a custom hook
        // For consistency with existing page, we'll assume the parent handles the actual mutation
        // but needs the image URL. 
        // We'll upload the image here first to get the URL.

        try {
            const uploadData = new FormData();
            // @ts-ignore
            uploadData.append("file", imageFile);

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/uploads`, {
                method: "POST",
                body: uploadData,
            });
            const data = await res.json();
            const imageUrl = data.url;

            await onUpload({
                ...formData,
                stickerImage: imageUrl
            });

            onClose();
        } catch (err) {
            alert("Error uploading image/record: " + err);
        }
    };

    // 1. Filter all options by species first
    const speciesVaccines = vaccineOptions.filter((v: any) => v.species === pet.species);

    // 2. Filter by selected type for the second dropdown
    const availableVaccines = speciesVaccines.filter((v: any) =>
        formData.type ? v.type === formData.type : true
    );

    // 3. Get unique types for the first dropdown from species-specific list
    const uniqueTypes = Array.from(new Set(speciesVaccines.map((v: any) => v.type)));
    // Helper to get Thai name for type
    const getThaiType = (t: string) => {
        const found = vaccineOptions.find((v: any) => v.type === t);
        return found?.typeTH || t;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4 transition-all duration-300">
            <div className="bg-white w-full max-w-lg rounded-t-[24px] sm:rounded-[24px] p-6 animate-slide-up shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-[#4A5568]">Add Vaccine Record</h3>
                    <button onClick={onClose} className="text-gray-400 font-bold p-2 hover:text-gray-600 transition-colors">✕</button>
                </div>

                {step === "UPLOAD" && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <p className="text-gray-500 text-sm px-6">Take a photo of the vaccine sticker. We'll try to extract the details for you!</p>
                        </div>

                        <label className={`block w-full border-2 border-dashed ${isLoadingAI ? 'border-[#8AD6C6] bg-[#E6FFFA]' : 'border-gray-300 hover:border-[#8AD6C6]'} rounded-[20px] p-10 text-center cursor-pointer transition-all relative group`}>
                            <input
                                type="file"
                                accept="image/*;capture=camera"
                                capture="environment"
                                className="hidden"
                                onChange={handleFileSelect}
                                disabled={isLoadingAI}
                            />
                            {isLoadingAI ? (
                                <div className="flex flex-col items-center animate-pulse">
                                    <i className="fas fa-robot text-4xl mb-3 text-[#8AD6C6]"></i>
                                    <p className="text-[#8AD6C6] font-bold">Analyzing Image...</p>
                                </div>
                            ) : (
                                <div className="text-gray-400 group-hover:text-[#8AD6C6] transition-colors">
                                    <i className="fas fa-camera text-4xl mb-3"></i>
                                    <p className="font-bold">Tap to Take Photo</p>
                                </div>
                            )}
                        </label>

                        <div className="border-t border-gray-100 pt-4 text-center">
                            <button
                                onClick={() => setStep("FORM")}
                                className="text-gray-400 text-sm font-bold hover:text-gray-600 underline"
                            >
                                Skip to Manual Entry
                            </button>
                        </div>
                    </div>
                )}

                {step === "FORM" && (
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        {/* Image Preview & Retake */}
                        <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                            {imagePreview ? (
                                <img src={imagePreview} className="w-16 h-16 rounded-lg object-cover border" />
                            ) : (
                                <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400">
                                    <i className="fas fa-image"></i>
                                </div>
                            )}
                            <div className="flex-1">
                                {imagePreview ? (
                                    <p className="text-xs font-bold text-green-600 mb-1"><i className="fas fa-check-circle"></i> Image Analyzed</p>
                                ) : (
                                    <p className="text-xs font-bold text-red-500 mb-1"><i className="fas fa-exclamation-circle"></i> Image Required</p>
                                )}
                                <label className="text-xs text-[#8AD6C6] font-bold cursor-pointer hover:underline">
                                    {imagePreview ? "Retake Photo" : "Upload Photo"}
                                    <input type="file" accept="image/*;capture=camera" capture="environment" className="hidden" onChange={handleFileSelect} />
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                                <select
                                    required
                                    className="w-full rounded-[12px] border-gray-200 p-3 bg-gray-50 focus:ring-2 focus:ring-[#8AD6C6] outline-none text-gray-900 text-sm"
                                    value={formData.type}
                                    onChange={(e) => {
                                        const newType = e.target.value;

                                        // Check for single option
                                        const possibleVaccines = vaccineOptions.filter((v: any) =>
                                            v.species === pet.species && v.type === newType
                                        );

                                        let nextVaccineId = "";
                                        let nextBrand = formData.brand;
                                        let nextDueDate = formData.nextDueDate;

                                        if (possibleVaccines.length === 1) {
                                            const v = possibleVaccines[0];
                                            nextVaccineId = v.id;
                                            nextBrand = v.brand;

                                            // Auto-calc date if date exists
                                            if (formData.dateAdministered && pet.birthDate) {
                                                const birth = new Date(pet.birthDate);
                                                const adminDate = new Date(formData.dateAdministered);
                                                const ageInWeeks = Math.floor((adminDate.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 7));
                                                nextDueDate = calculateNextVaccineDate(pet.species, v.type, formData.dateAdministered, ageInWeeks);
                                            }
                                        }

                                        setFormData({
                                            ...formData,
                                            type: newType,
                                            vaccineId: nextVaccineId,
                                            brand: nextBrand,
                                            nextDueDate: nextDueDate
                                        });
                                    }}
                                >
                                    <option value="">Select Type</option>
                                    {uniqueTypes.map((t: any) => <option key={t} value={t}>{getThaiType(t)}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Vaccine Name</label>
                                <select
                                    required
                                    disabled={!formData.type}
                                    className={`w-full rounded-[12px] border-gray-200 p-3 bg-gray-50 focus:ring-2 focus:ring-[#8AD6C6] outline-none text-gray-900 text-sm ${!formData.type ? 'opacity-50' : ''}`}
                                    value={formData.vaccineId}
                                    onChange={(e) => {
                                        const vId = e.target.value;
                                        const v = vaccineOptions.find(opt => opt.id === vId);
                                        setFormData({
                                            ...formData,
                                            vaccineId: vId,
                                            brand: v?.brand || formData.brand
                                        });

                                        // Auto Calc Next Date
                                        if (vId && formData.dateAdministered && pet.birthDate) {
                                            const birth = new Date(pet.birthDate);
                                            const adminDate = new Date(formData.dateAdministered);
                                            const ageInWeeks = Math.floor((adminDate.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 7));
                                            const next = calculateNextVaccineDate(pet.species, v.type, formData.dateAdministered, ageInWeeks);
                                            setFormData(prev => ({ ...prev, nextDueDate: next }));
                                        }

                                    }}
                                >
                                    <option value="">Select Name</option>
                                    {availableVaccines.map((v: any) => (
                                        <option key={v.id} value={v.id}>{v.name} ({v.brand})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Lot Number */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Lot Number</label>
                            <input
                                type="text"
                                className="w-full rounded-[12px] border-gray-200 p-3 bg-gray-50 focus:ring-2 focus:ring-[#8AD6C6] outline-none text-gray-900 text-sm"
                                value={formData.lotNumber}
                                onChange={e => setFormData({ ...formData, lotNumber: e.target.value })}
                                placeholder="e.g. A1234567"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date Given</label>
                                <input
                                    type="date"
                                    required
                                    max={new Date().toISOString().split("T")[0]}
                                    className="w-full rounded-[12px] border-gray-200 p-3 bg-gray-50 focus:ring-2 focus:ring-[#8AD6C6] outline-none text-gray-900 text-sm"
                                    value={formData.dateAdministered}
                                    onChange={e => {
                                        const d = e.target.value;
                                        setFormData(prev => ({ ...prev, dateAdministered: d }));
                                        // Recalc next date if vaccine selected
                                        if (formData.vaccineId && d && pet.birthDate) {
                                            const v = vaccineOptions.find(opt => opt.id === formData.vaccineId);
                                            if (v) {
                                                const birth = new Date(pet.birthDate);
                                                const adminDate = new Date(d);
                                                const ageInWeeks = Math.floor((adminDate.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 7));
                                                const next = calculateNextVaccineDate(pet.species, v.type, d, ageInWeeks);
                                                setFormData(prev => ({ ...prev, nextDueDate: next }));
                                            }
                                        }
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Next Due</label>
                                <input
                                    type="date"
                                    min={formData.dateAdministered}
                                    className="w-full rounded-[12px] border-gray-200 p-3 bg-gray-50 focus:ring-2 focus:ring-[#8AD6C6] outline-none text-gray-900 text-sm"
                                    value={formData.nextDueDate}
                                    onChange={e => setFormData(prev => ({ ...prev, nextDueDate: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button type="submit" className="w-full bg-[#8AD6C6] text-white font-bold p-4 rounded-[16px] shadow-lg hover:bg-[#76BDB0] transition-transform active:scale-[0.98]">
                                <i className="fas fa-check mr-2"></i> Save Record
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
