"use client";

import { gql, useQuery, useMutation } from "@apollo/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { Nunito } from "next/font/google";

// Font Configuration
const nunito = Nunito({ subsets: ["latin"], weight: ["400", "600", "700", "800"] });

import { calculateAge } from "../../../utils/dateUtils";

const GET_PET_QUERY = gql`
  query GetPet($id: String!) {
    pet: findOne(id: $id) {
      id
      name
      species
      breed
      gender
      microchipNo
      image
      ownerId
      birthDate
      isSterilized
      chronicDiseases
      vaccinations {
        id
        vaccine {
           name
           brand
           type
        }
        dateAdministered
        nextDueDate
        isVerified
        stickerImage
        vet {
            licenseNumber
            user {
                fullName
            }
            clinic {
                name
            }
        }
        clinic {
            name
        }
      }
    }
  }
`;

const UPLOAD_LEGACY = gql`
  mutation UploadLegacy($input: CreateLegacyRecordInput!) {
    createLegacyRecord(input: $input) {
        id
    }
}
`;

const GET_VACCINES = gql`
  query GetVaccines {
    vaccines {
        id
        name
        brand
    }
}
`;

const WHO_AM_I = gql`
  query WhoAmI {
    whoAmI {
        id
    }
}
`;

const DELETE_PET = gql`
  mutation DeletePet($id: String!) {
    removePet(id: $id) {
        id
    }
}
`;

export default function PetDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;

    const [showQR, setShowQR] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Legacy Upload State
    const [showLegacyForm, setShowLegacyForm] = useState(false);
    const [legacyDate, setLegacyDate] = useState("");
    const [legacyImage, setLegacyImage] = useState("");
    const [legacyVaccineId, setLegacyVaccineId] = useState("");

    const [selectedVaccineRecord, setSelectedVaccineRecord] = useState<any>(null);
    const [filterType, setFilterType] = useState("ALL");
    const [showFilterMenu, setShowFilterMenu] = useState(false);


    const { data, loading, error, refetch } = useQuery(GET_PET_QUERY, {
        variables: { id },
        skip: !id
    });

    const { data: vaccineData } = useQuery(GET_VACCINES);

    const [uploadLegacy] = useMutation(UPLOAD_LEGACY);
    const [deletePet] = useMutation(DELETE_PET);

    const { data: meData } = useQuery(WHO_AM_I);
    const me = meData?.whoAmI;

    useEffect(() => {
        const token = Cookies.get("token");
        if (!token) router.push("/auth/login");
    }, [router]);

    const handleLegacyUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await uploadLegacy({
                variables: {
                    input: {
                        petId: id,
                        vaccineMasterId: legacyVaccineId,
                        dateAdministered: new Date(legacyDate).toISOString(),
                        stickerImage: legacyImage
                    }
                }
            });
            alert("Legacy record uploaded!");
            setShowLegacyForm(false);
            refetch();
        } catch (e: any) {
            alert("Error uploading: " + e.message);
        }
    };

    if (loading) return <div className="p-8 text-center bg-[#FFF9F4] min-h-screen">Loading...</div>;
    if (error) return <div className="p-8 text-center text-red-500 bg-[#FFF9F4] min-h-screen">Error: {error.message}</div>;
    if (!data?.pet) return <div className="p-8 text-center bg-[#FFF9F4] min-h-screen">Pet not found</div>;

    const { pet } = data;
    const isOwner = me?.id === pet?.ownerId;

    const handleDeletePet = async () => {
        if (!confirm("Are you sure? This will delete the pet for EVERYONE.")) return;
        try {
            await deletePet({ variables: { id } });
            router.push("/owner/dashboard");
        } catch (e: any) {
            alert("Error deleting pet: " + e.message);
        }
    };

    // Derived State for Filtering
    const uniqueTypes = Array.from(new Set(pet.vaccinations?.map((v: any) => v.vaccine.type).filter(Boolean))) as string[];

    const filteredRecords = pet.vaccinations?.filter((record: any) => {
        if (filterType === "ALL") return true;
        return record.vaccine.type === filterType;
    });

    return (
        <div className={`min-h-screen bg-[#FFF9F4] ${nunito.className}`}>
            {/* Font Awesome CDN */}
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

            <div className="w-full max-w-5xl mx-auto bg-[#FFF9F4] min-h-screen relative pb-24">
                {/* Header */}
                <header className="flex justify-between items-center p-5 sticky top-0 z-10 bg-[#FFF9F4]/90 backdrop-blur-sm">
                    <Link href="/owner/dashboard" className="text-lg text-[#4A5568] hover:text-[#8AD6C6] transition-colors">
                        <i className="fas fa-arrow-left"></i> Back
                    </Link>
                    <h1 className="text-lg font-bold text-[#4A5568] hidden sm:block">Pet Health Record</h1>
                    <button
                        onClick={() => setShowQR(!showQR)}
                        className="bg-[#8AD6C6] text-white border-none py-2 px-4 rounded-[20px] text-sm font-bold flex items-center gap-1 shadow-[0_4px_10px_rgba(138,214,198,0.4)] hover:bg-[#76BDB0] transition-colors"
                    >
                        <i className="fas fa-qrcode"></i> {showQR ? "Hide" : "Show QR"}
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 px-5 pb-5 pt-0 md:p-5 items-start">
                    {/* Hero Section (Left on Desktop) */}
                    <section className={`md:col-span-5 lg:col-span-4 sticky top-[68px] md:top-24 z-20 transition-all duration-300`}>
                        <div className={`rounded-[24px] p-6 text-white shadow-[0_10px_20px_rgba(138,214,198,0.3)] transition-all duration-300 relative ${isCollapsed ? 'py-4 bg-[#8AD6C6]/80 backdrop-blur-md' : 'p-6 bg-gradient-to-br from-[#8AD6C6] to-[#76BDB0]'}`}>

                            {/* Toggle Button (Mobile Only) */}
                            <button
                                onClick={() => setIsCollapsed(!isCollapsed)}
                                className="absolute top-4 right-4 md:hidden text-white/80 hover:text-white transition-colors p-2"
                            >
                                <i className={`fas fa-chevron-${isCollapsed ? 'down' : 'up'}`}></i>
                            </button>

                            <div className="flex gap-4 items-start mb-0">
                                <div className="flex flex-col items-center gap-2">
                                    {pet.image ? (
                                        <img
                                            src={pet.image}
                                            alt={pet.name}
                                            className={`rounded-full border-[3px] border-white/50 object-cover transition-all duration-300 ${isCollapsed ? 'w-12 h-12' : 'w-20 h-20'}`}
                                        />
                                    ) : (
                                        <div className={`rounded-full border-[3px] border-white/50 bg-white/20 flex items-center justify-center transition-all duration-300 ${isCollapsed ? 'w-12 h-12 conversation-id' : 'w-20 h-20'}`}>
                                            <i className={`fas fa-${pet.species === 'CAT' ? 'cat' : 'dog'} text-white/80 ${isCollapsed ? 'text-lg' : 'text-3xl'}`}></i>
                                        </div>
                                    )}
                                    {!isCollapsed && (
                                        <div className="flex flex-col gap-2 mt-2 w-full px-2">
                                            {isOwner && (
                                                <Link href={`/owner/pet/${pet.id}/edit`} className="text-white/80 hover:text-white text-xs bg-white/20 px-3 py-1 rounded-full transition-colors whitespace-nowrap w-full text-center">
                                                    <i className="fas fa-edit mr-1"></i> Edit
                                                </Link>
                                            )}
                                        </div>
                                    )}
                                </div >
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h2 className={`font-bold leading-tight ml-2 transition-all duration-300 ${isCollapsed ? 'text-lg mb-0' : 'text-[28px] mb-2'}`}>{pet.name}</h2>
                                    </div>

                                    <div className={`transition-all duration-300 overflow-hidden ${isCollapsed ? 'max-h-0 opacity-0 md:max-h-[500px] md:opacity-100' : 'max-h-[500px] opacity-100'}`}>
                                        <div className="flex items-center gap-2 text-sm mb-1 opacity-90 ml-2">
                                            <i className="fas fa-paw w-4"></i> {pet.species === "CAT" ? "Cat" : "Dog"} • {pet.breed || "Mixed"}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm mb-1 opacity-90 ml-2">
                                            <i className="fas fa-mars w-4"></i> {pet.gender} • {pet.isSterilized ? "Sterilized" : "Not Sterilized"}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm mb-1 opacity-90 ml-2">
                                            <i className="fas fa-birthday-cake w-4"></i> {new Date(pet.birthDate).toLocaleDateString()} ({calculateAge(pet.birthDate)})
                                        </div>
                                    </div>

                                    {/* Chronic Disease Label - Always Visible if Exists, but styled compactly when scrolled */}
                                    {pet.chronicDiseases && (
                                        <div className={`flex items-center gap-2 text-sm mt-2 opacity-100 bg-white/20 p-2 rounded-lg transition-all duration-300 ${isCollapsed && !pet.chronicDiseases ? 'hidden md:flex' : 'flex'}`}>
                                            <i className="fas fa-heartbeat w-4 text-red-100"></i>
                                            <span className="font-bold text-red-50">⚠️ {pet.chronicDiseases}</span>
                                        </div>
                                    )}
                                </div>
                            </div >

                        </div>

                        {/* Desktop Only Upload Button (Hidden on Mobile) */}
                        <div className="hidden md:block mt-6">
                            <button
                                onClick={() => setShowLegacyForm(true)}
                                className="w-full bg-[#8AD6C6] text-white border-none p-4 rounded-[20px] text-base font-bold flex justify-center items-center gap-2 shadow-[0_8px_20px_rgba(138,214,198,0.4)] hover:bg-[#76BDB0] transition-colors"
                            >
                                <i className="fas fa-plus"></i> Upload Past Record
                            </button>
                        </div>
                    </section>

                    {/* History Section (Right on Desktop) */}
                    <section className="md:col-span-7 lg:col-span-8">
                        <div className="flex justify-between items-center mb-4 relative">
                            <div className="text-lg font-bold text-[#4A5568]">Vaccination History</div>

                            {/* Filter Button & Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all ${filterType === 'ALL' ? 'bg-white text-[#4A5568]' : 'bg-[#8AD6C6] text-white'}`}
                                >
                                    <i className="fas fa-filter text-sm"></i>
                                </button>

                                {showFilterMenu && (
                                    <div className="absolute right-0 top-10 bg-white rounded-xl shadow-xl border border-gray-100 p-2 w-48 animate-pop-in z-50">
                                        <div className="text-xs font-bold text-gray-400 px-3 py-2 uppercase tracking-wider">Filter by Type</div>
                                        <button
                                            onClick={() => { setFilterType("ALL"); setShowFilterMenu(false); }}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold mb-1 transition-colors ${filterType === 'ALL' ? 'bg-[#E6FFFA] text-[#8AD6C6]' : 'text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            All Types
                                        </button>
                                        {uniqueTypes.map(type => (
                                            <button
                                                key={type}
                                                onClick={() => { setFilterType(type); setShowFilterMenu(false); }}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold mb-1 transition-colors ${filterType === type ? 'bg-[#E6FFFA] text-[#8AD6C6]' : 'text-gray-600 hover:bg-gray-50'}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {filteredRecords && filteredRecords.length > 0 ? (
                                filteredRecords.map((record: any) => (
                                    <div
                                        key={record.id}
                                        onClick={() => setSelectedVaccineRecord(record)}
                                        className="bg-white rounded-[20px] p-4 shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow cursor-pointer relative"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="text-base font-bold text-[#4A5568] mb-1">{record.vaccine.name}</div>
                                                <div className="text-[13px] text-[#999]">{new Date(record.dateAdministered).toLocaleDateString()}</div>
                                            </div>
                                            {record.isVerified ? (
                                                <div className="flex items-center gap-1 text-[#8AD6C6] text-xs font-bold">
                                                    <i className="fas fa-check-circle"></i> Verified
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-[#F6AD55] text-xs font-bold">
                                                    <i className="fas fa-clock"></i> Pending
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center mt-3">
                                            <div className="flex gap-2">
                                                {record.vaccine.type && (
                                                    <span className="px-3 py-1 rounded-[12px] text-[11px] font-bold bg-[#F6A6A6] text-white">
                                                        {record.vaccine.type}
                                                    </span>
                                                )}
                                                <span className="px-3 py-1 rounded-[12px] text-[11px] font-bold bg-[#E2E8F0] text-[#777]">
                                                    {record.vaccine.brand || "Vaccine"}
                                                </span>
                                            </div>
                                            <i className="fas fa-chevron-right text-[#CCC]"></i>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-gray-400 py-10 col-span-full">
                                    <i className="fas fa-search text-3xl mb-3 opacity-50"></i>
                                    <p>No records found for this filter.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Footer Button (Mobile Only) */}
                <div className="fixed bottom-5 left-0 w-full flex justify-center px-5 pointer-events-none mb-4 md:hidden">
                    <button
                        onClick={() => setShowLegacyForm(true)}
                        className="pointer-events-auto w-full max-w-[440px] bg-[#8AD6C6] text-white border-none p-4 rounded-[20px] text-base font-bold flex justify-center items-center gap-2 shadow-[0_8px_20px_rgba(138,214,198,0.4)]"
                    >
                        <i className="fas fa-plus"></i> Upload Past Record
                    </button>
                </div>

                {/* Modals (Legacy Form & Details) */}
                {/* QR Code Modal */}
                {
                    showQR && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm" onClick={() => setShowQR(false)}>
                            <div className="bg-white rounded-[24px] p-6 shadow-2xl animate-pop-in flex flex-col items-center relative" onClick={e => e.stopPropagation()}>
                                <button onClick={() => setShowQR(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                                    <i className="fas fa-times text-xl"></i>
                                </button>
                                <h3 className="text-lg font-bold text-[#4A5568] mb-4">Pet QR Code</h3>
                                <div className="bg-white p-2 rounded-xl mb-2">
                                    <QRCode value={pet.id} size={250} />
                                </div>
                                <p className="mt-2 text-sm text-gray-500 font-mono bg-gray-100 px-3 py-1 rounded-full">{pet.id}</p>
                                <p className="text-xs text-gray-400 mt-2">Scan to access health records</p>
                            </div>
                        </div>
                    )
                }

                {/* Legacy Upload Form Modal */}
                {
                    showLegacyForm && (
                        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
                            <div className="bg-white w-full max-w-md rounded-t-[24px] sm:rounded-[24px] p-6 animate-slide-up">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-[#4A5568]">Upload Past Record</h3>
                                    <button onClick={() => setShowLegacyForm(false)} className="text-gray-400 font-bold p-2">✕</button>
                                </div>
                                <form onSubmit={handleLegacyUpload} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Vaccine Type</label>
                                        <select
                                            required
                                            className="w-full rounded-[12px] border-gray-200 p-3 bg-gray-50 focus:ring-2 focus:ring-[#8AD6C6] outline-none text-gray-900"
                                            value={legacyVaccineId}
                                            onChange={(e) => setLegacyVaccineId(e.target.value)}
                                        >
                                            <option value="">Select Vaccine</option>
                                            {vaccineData?.vaccines?.map((v: any) => (
                                                <option key={v.id} value={v.id}>{v.name} ({v.brand})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Date Administered</label>
                                        <input
                                            type="date"
                                            required
                                            max={new Date().toISOString().split("T")[0]}
                                            className="w-full rounded-[12px] border-gray-200 p-3 bg-gray-50 focus:ring-2 focus:ring-[#8AD6C6] outline-none text-gray-900"
                                            value={legacyDate}
                                            onChange={(e) => setLegacyDate(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Photo Evidence / Sticker</label>
                                        <label className="block w-full border-2 border-dashed border-gray-300 rounded-[12px] p-6 text-center cursor-pointer hover:border-[#8AD6C6] transition-colors relative">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    const formData = new FormData();
                                                    formData.append("file", file);
                                                    try {
                                                        // Quick upload logic inline for simplicity/speed
                                                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/uploads`, {
                                                            method: "POST",
                                                            body: formData,
                                                        });
                                                        const data = await res.json();
                                                        setLegacyImage(data.url);
                                                    } catch (err) { alert("Upload failed"); }
                                                }}
                                            />
                                            {legacyImage ? (
                                                <img src={legacyImage} alt="Preview" className="h-32 mx-auto object-contain" />
                                            ) : (
                                                <div className="text-gray-400">
                                                    <i className="fas fa-camera text-2xl mb-2"></i>
                                                    <p className="text-sm">Tap to upload image</p>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                    <button type="submit" className="w-full bg-[#8AD6C6] text-white font-bold p-4 rounded-[16px] mt-4 shadow-lg">
                                        Submit Record
                                    </button>
                                </form>
                            </div>
                        </div>
                    )
                }

                {/* Details Modal */}
                {
                    selectedVaccineRecord && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm" onClick={() => setSelectedVaccineRecord(null)}>
                            <div className="bg-white w-full max-w-sm rounded-[24px] overflow-hidden shadow-2xl animate-pop-in" onClick={e => e.stopPropagation()}>
                                <div className="bg-[#8AD6C6] p-4 text-white flex justify-between items-center">
                                    <span className="font-bold text-lg">Vaccine Details</span>
                                    <button onClick={() => setSelectedVaccineRecord(null)} className="text-white/80 hover:text-white">✕</button>
                                </div>
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-[#4A5568] mb-1">{selectedVaccineRecord.vaccine.name}</h3>
                                    <div className="flex gap-2 mb-4">
                                        <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-500">{selectedVaccineRecord.vaccine.brand}</span>
                                        <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-500">{selectedVaccineRecord.vaccine.type}</span>
                                    </div>

                                    <div className="space-y-3 text-sm text-gray-600">
                                        <div className="flex justify-between border-b border-gray-100 pb-2">
                                            <span>Date</span>
                                            <span className="font-bold">{new Date(selectedVaccineRecord.dateAdministered).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-100 pb-2">
                                            <span>Vet</span>
                                            <span className="font-bold">{selectedVaccineRecord.vet?.user?.fullName || "Owner Upload"}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-100 pb-2">
                                            <span>Clinic</span>
                                            <span className="font-bold">{selectedVaccineRecord.vet?.clinic?.name || selectedVaccineRecord.clinic?.name || "-"}</span>
                                        </div>
                                    </div>

                                    {/* Veterinarian Information Section */}
                                    {selectedVaccineRecord.vet && (
                                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Veterinarian Information</h3>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-xs text-gray-400 mb-1">Veterinarian Name</label>
                                                    <div className="text-sm font-bold text-gray-700">{selectedVaccineRecord.vet.user.fullName}</div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs text-gray-400 mb-1">License No.</label>
                                                        <div className="text-sm font-bold text-gray-700">{selectedVaccineRecord.vet.licenseNumber}</div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-400 mb-1">Clinic</label>
                                                        <div className="text-sm font-bold text-gray-700">{selectedVaccineRecord.vet.clinic?.name || "-"}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {selectedVaccineRecord.stickerImage && (
                                        <div className="mt-4">
                                            <p className="text-xs font-bold text-gray-400 mb-2 uppercase">Proof / Sticker</p>
                                            <img src={selectedVaccineRecord.stickerImage} className="w-full rounded-lg border" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                }

            </div>
        </div>
    );
}
