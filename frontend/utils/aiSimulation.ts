export interface ExtractedVaccineData {
    type?: string;
    brand?: string;
    lotNumber?: string;
    date?: string;
}

export const simulateVaccineExtraction = (file: File): Promise<ExtractedVaccineData> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Mock AI Extraction logic
            // In a real app, this would send 'file' to an OCR API.

            // Randomly succeed or fail to simulate real conditions, or just return static data for now.
            // For this demo, let's look at the file name or just return a default success case.

            console.log("AI Extraction analyzing:", file.name);

            // Mock Success
            resolve({
                type: "RABIES", // Matching one of our types if possible, or string
                brand: "Defensor 3",
                lotNumber: "LOT-" + Math.floor(Math.random() * 10000),
                date: new Date().toISOString().split('T')[0] // Defaults to today
            });

        }, 1500); // 1.5s delay to feel "real"
    });
};
