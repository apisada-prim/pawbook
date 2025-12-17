"use client";

import { useState, useEffect } from "react";
import { gql, useQuery, useMutation } from "@apollo/client";
import { useRouter, useParams } from "next/navigation";
import Cookies from "js-cookie";
import Link from "next/link";
import { Nunito } from "next/font/google";

const nunito = Nunito({ subsets: ["latin"], weight: ["400", "600", "700", "800"] });

const GET_PET_QUERY = gql`
  query GetPet($id: String!) {
    pet: findOne(id: $id) {
      id
      name
      species
      breed
      gender
      birthDate
      isSterilized
      chronicDiseases
      image
    }
  }
`;

const UPDATE_PET_MUTATION = gql`
  mutation UpdatePet($input: UpdatePetInput!) {
    updatePet(updatePetInput: $input) {
      id
      name
      image
    }
  }
`;

const DELETE_PET_MUTATION = gql`
  mutation DeletePet($id: String!) {
    removePet(id: $id) {
      id
    }
  }
`;

export default function EditPetPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;

    // Form State
    const [name, setName] = useState("");
    const [species, setSpecies] = useState("DOG");
    const [breed, setBreed] = useState("");
    const [gender, setGender] = useState("MALE");
    const [birthDate, setBirthDate] = useState("");
    const [isSterilized, setIsSterilized] = useState(false);
    const [chronicDiseases, setChronicDiseases] = useState("");
    const [image, setImage] = useState("");
    const [uploading, setUploading] = useState(false);

    // State populated via useEffect instead of onCompleted to avoid React warnings
    const { data, loading: queryLoading, error: queryError } = useQuery(GET_PET_QUERY, {
        variables: { id },
        skip: !id
    });

    useEffect(() => {
        if (data?.pet) {
            setName(data.pet.name);
            setSpecies(data.pet.species);
            setBreed(data.pet.breed || "");
            setGender(data.pet.gender);
            setBirthDate(new Date(data.pet.birthDate).toISOString().split('T')[0]);
            setIsSterilized(data.pet.isSterilized);
            setChronicDiseases(data.pet.chronicDiseases || "");
            setImage(data.pet.image || "");
        }
    }, [data]);

    const [updatePet, { loading: mutationLoading }] = useMutation(UPDATE_PET_MUTATION);
    const [deletePet, { loading: deleteLoading }] = useMutation(DELETE_PET_MUTATION);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        const token = Cookies.get("token");
        if (!token) {
            router.push("/auth/login");
        }
    }, [router]);

    // Breeds Data (Same as Add Page - could be refactored to shared constant)
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
            await updatePet({
                variables: {
                    input: {
                        id,
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
            alert("Pet Updated Successfully!");
            router.push(`/owner/pet/${id}`);
        } catch (err) {
            console.error(err);
            alert("Failed to update pet.");
        }
    };

    const handleDelete = async () => {
        try {
            await deletePet({ variables: { id } });
            router.push("/owner/dashboard");
        } catch (err) {
            console.error(err);
            alert("Failed to delete pet.");
        }
    };

    if (queryLoading) return <div className="p-10 text-center font-bold text-gray-400">Loading pet data...</div>;
    if (queryError) return <div className="p-10 text-center text-red-500">Error: {queryError.message}</div>;

    return (
        <div className={`min-h-screen bg-[#FFF9F4] ${nunito.className}`}>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

            <div className="w-full max-w-md mx-auto min-h-screen bg-[#FFF9F4] pb-10">
                {/* Header */}
                <header className="flex items-center p-5 sticky top-0 z-10 bg-[#FFF9F4]/90 backdrop-blur-sm">
                    <Link href={`/owner/pet/${id}`} className="text-lg text-[#4A5568] hover:text-[#8AD6C6] transition-colors mr-4">
                        <i className="fas fa-arrow-left"></i>
                    </Link>
                    <h1 className="text-xl font-bold text-[#4A5568]">Edit Pet</h1>
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
                                            <span className="text-xs text-[#8AD6C6] block font-bold">Change Photo</span>
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
                                        disabled
                                        onChange={(e) => setSpecies(e.target.value)}
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
                                placeholder="e.g. Allergy, Kidney Disease (Optional)"
                                value={chronicDiseases}
                                onChange={(e) => setChronicDiseases(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={mutationLoading}
                            className="w-full bg-[#8AD6C6] text-white border-none py-4 px-4 rounded-[20px] text-base font-bold shadow-[0_8px_20px_rgba(138,214,198,0.4)] hover:bg-[#76BDB0] transition-colors flex justify-center items-center gap-2 mt-8"
                        >
                            {mutationLoading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i> Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowDeleteModal(true)}
                            className="w-full bg-red-50 text-red-500 border border-red-100 py-3 px-4 rounded-[20px] text-base font-bold hover:bg-red-100 transition-colors flex justify-center items-center gap-2 mt-4"
                        >
                            <i className="fas fa-trash"></i> Delete Pet
                        </button>
                    </form>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}>
                    <div className="bg-white rounded-[24px] p-6 shadow-2xl animate-pop-in max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-exclamation-triangle text-2xl text-red-500"></i>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Delete {name}?</h3>
                        <p className="text-gray-500 mb-6 text-sm">
                            Are you sure you want to delete this pet? This action cannot be undone and all data will be lost.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="py-3 px-4 rounded-[16px] bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleteLoading}
                                className="py-3 px-4 rounded-[16px] bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30 flex justify-center items-center gap-2"
                            >
                                {deleteLoading ? <i className="fas fa-spinner fa-spin"></i> : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
