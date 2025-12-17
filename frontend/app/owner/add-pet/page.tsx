"use client";

import { useState, useEffect } from "react";
import { gql, useMutation } from "@apollo/client";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Link from "next/link";
import { Nunito } from "next/font/google";

const nunito = Nunito({ subsets: ["latin"], weight: ["400", "600", "700", "800"] });

const CREATE_PET_MUTATION = gql`
  mutation CreatePet($input: CreatePetInput!) {
    createPet(createPetInput: $input) {
      id
      name
      isSterilized
      chronicDiseases
    }
  }
`;

export default function AddPetPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [species, setSpecies] = useState("DOG");
    const [breed, setBreed] = useState("");
    const [gender, setGender] = useState("MALE");
    const [birthDate, setBirthDate] = useState("");
    const [isSterilized, setIsSterilized] = useState(false);
    const [chronicDiseases, setChronicDiseases] = useState("");
    const [image, setImage] = useState("");
    const [uploading, setUploading] = useState(false);

    const [createPet, { loading, error }] = useMutation(CREATE_PET_MUTATION, {
        refetchQueries: ["MyPets"]
    });

    useEffect(() => {
        const token = Cookies.get("token");
        if (!token) {
            router.push("/auth/login");
        }
    }, [router]);

    // Breeds Data
    const dogBreeds = [
        "Chihuahua", "Pomeranian", "Shih Tzu", "Yorkshire Terrier", "Beagle", "Pug", "French Bulldog",
        "Golden Retriever", "Labrador Retriever", "Siberian Husky", "Corgi", "Poodle", "Maltese", "Shiba Inu",
        "Bulldog", "Jack Russell Terrier", "Schnauzer", "Dachshund", "Thai Ridgeback", "Thai Bangkaew",
        "Mixed Breed", "German Shepherd", "Rottweiler", "Doberman", "Pitbull", "Alaskan Malamute", "Chow Chow", "Saint Bernard", "Other"
    ];

    const catBreeds = [
        "American Shorthair", "British Shorthair", "Scottish Fold", "Exotic Shorthair", "Russian Blue",
        "Bengal", "Sphynx", "Munchkin", "Persian", "Maine Coon", "Ragdoll", "Norwegian Forest",
        "Siamese (Wichien Maat)", "Korat (Si Sawat)", "Khao Manee", "Suphalak", "Konja",
        "Domestic Shorthair / Mixed", "Calico", "Tabby", "Other"
    ];

    const currentBreeds = species === "DOG" ? dogBreeds : catBreeds;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append("file", file);

        setUploading(true);
        try {
            const token = Cookies.get("token");
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/uploads`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Upload failed details:", response.status, response.statusText, errorText);
                throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();
            setImage(data.url);
        } catch (error: any) {
            console.error("Error uploading file:", error);
            alert(`Failed to upload image: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createPet({
                variables: {
                    input: {
                        name,
                        species,
                        breed,
                        gender,
                        birthDate: new Date(birthDate).toISOString(),
                        isSterilized,
                        chronicDiseases: chronicDiseases || null,
                        image: image || null
                    },
                },
            });
            router.push("/owner/dashboard");
        } catch (err) {
            console.error(err);
        }
    };

    // Custom Theme Colors (for reference)
    // Primary: #8AD6C6
    // Text: #4A5568
    // Bg: #FFF9F4

    return (
        <div className={`min-h-screen bg-[#FFF9F4] ${nunito.className}`}>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

            <div className="w-full max-w-md mx-auto min-h-screen bg-[#FFF9F4] pb-10">
                {/* Header */}
                <header className="flex items-center p-5 sticky top-0 z-10 bg-[#FFF9F4]/90 backdrop-blur-sm">
                    <Link href="/owner/dashboard" className="text-lg text-[#4A5568] hover:text-[#8AD6C6] transition-colors mr-4">
                        <i className="fas fa-arrow-left"></i>
                    </Link>
                    <h1 className="text-xl font-bold text-[#4A5568]">Add New Pet</h1>
                </header>

                <div className="px-5">
                    <form onSubmit={handleSubmit} className="bg-white rounded-[24px] p-6 shadow-[0_4px_15px_rgba(0,0,0,0.03)] space-y-6">
                        {/* Image Upload */}
                        <div className="flex flex-col items-center justify-center">
                            <label className="relative cursor-pointer group">
                                {image ? (
                                    <img
                                        src={image}
                                        alt="Pet Preview"
                                        className="h-32 w-32 rounded-full object-cover border-[4px] border-[#8AD6C6]"
                                    />
                                ) : (
                                    <div className="h-32 w-32 rounded-full bg-[#F0FDF9] flex items-center justify-center border-2 border-dashed border-[#8AD6C6] group-hover:bg-[#E6FFFA] transition-colors">
                                        <div className="text-center">
                                            <i className="fas fa-camera text-2xl text-[#8AD6C6] mb-1"></i>
                                            <span className="text-xs text-[#8AD6C6] block font-bold">Add Photo</span>
                                        </div>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                {uploading && (
                                    <div className="absolute inset-0 bg-white/50 rounded-full flex items-center justify-center">
                                        <i className="fas fa-spinner fa-spin text-[#8AD6C6]"></i>
                                    </div>
                                )}
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-[#4A5568] mb-2">Pet Name</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Mamon"
                                className="block w-full rounded-[16px] border border-gray-200 py-3 px-4 text-gray-900 focus:border-[#8AD6C6] focus:ring focus:ring-[#8AD6C6]/20 outline-none transition-all placeholder:text-gray-300 bg-gray-50/50"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-[#4A5568] mb-2">Species</label>
                                <div className="relative">
                                    <select
                                        className="block w-full rounded-[16px] border border-gray-200 py-3 px-4 text-gray-900 focus:border-[#8AD6C6] focus:ring focus:ring-[#8AD6C6]/20 outline-none appearance-none bg-gray-50/50"
                                        value={species}
                                        onChange={(e) => {
                                            setSpecies(e.target.value);
                                            setBreed("");
                                        }}
                                    >
                                        <option value="DOG">Dog</option>
                                        <option value="CAT">Cat</option>
                                    </select>
                                    <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-[#4A5568] mb-2">Gender</label>
                                <div className="relative">
                                    <select
                                        className="block w-full rounded-[16px] border border-gray-200 py-3 px-4 text-gray-900 focus:border-[#8AD6C6] focus:ring focus:ring-[#8AD6C6]/20 outline-none appearance-none bg-gray-50/50"
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value)}
                                    >
                                        <option value="MALE">Male</option>
                                        <option value="FEMALE">Female</option>
                                    </select>
                                    <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-[#4A5568] mb-2">Breed</label>
                            <div className="relative">
                                <select
                                    className="block w-full rounded-[16px] border border-gray-200 py-3 px-4 text-gray-900 focus:border-[#8AD6C6] focus:ring focus:ring-[#8AD6C6]/20 outline-none appearance-none bg-gray-50/50"
                                    value={breed}
                                    onChange={(e) => setBreed(e.target.value)}
                                >
                                    <option value="">Select Breed</option>
                                    {currentBreeds.map((b) => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </select>
                                <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-[#4A5568] mb-2">Birth Date</label>
                            <input
                                type="date"
                                required
                                max={new Date().toLocaleDateString('en-CA')}
                                className="block w-full rounded-[16px] border border-gray-200 py-3 px-4 text-gray-900 focus:border-[#8AD6C6] focus:ring focus:ring-[#8AD6C6]/20 outline-none transition-all bg-gray-50/50"
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center p-3 bg-gray-50 rounded-[16px] border border-gray-100">
                            <input
                                id="sterilized"
                                type="checkbox"
                                className="h-5 w-5 rounded border-gray-300 text-[#8AD6C6] focus:ring-[#8AD6C6]"
                                checked={isSterilized}
                                onChange={(e) => setIsSterilized(e.target.checked)}
                            />
                            <label htmlFor="sterilized" className="ml-3 block text-sm font-bold text-[#4A5568]">
                                Sterilized <span className="text-xs font-normal text-gray-500">(ทำหมันแล้ว)</span>
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-[#4A5568] mb-2">Chronic Diseases</label>
                            <input
                                type="text"
                                className="block w-full rounded-[16px] border border-gray-200 py-3 px-4 text-gray-900 focus:border-[#8AD6C6] focus:ring focus:ring-[#8AD6C6]/20 outline-none placeholder:text-gray-300 bg-gray-50/50"
                                placeholder="e.g. Allergy (Optional)"
                                value={chronicDiseases}
                                onChange={(e) => setChronicDiseases(e.target.value)}
                            />
                        </div>

                        {error && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{error.message}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#8AD6C6] text-white border-none py-4 px-4 rounded-[20px] text-base font-bold shadow-[0_8px_20px_rgba(138,214,198,0.4)] hover:bg-[#76BDB0] transition-colors flex justify-center items-center gap-2 mt-8"
                        >
                            {loading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i> Saving...
                                </>
                            ) : (
                                "Add Pet"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
