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

import { calculateAge, calculateNextVaccineDate, getDaysLeft } from "../../../utils/dateUtils";
import EditPublicProfileModal from "./_components/EditPublicProfileModal";
import AddVaccineModal from "./_components/AddVaccineModal";
import VaccineQrModal from "./_components/VaccineQrModal";

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
      isLost
      socialTags
      powerStats {
        label
        value
      }
      favoriteThings
      secretHabits
      vaccinations {
        id
        vaccine {
           name
           brand
           type
           typeTH
        }
        dateAdministered
        nextDueDate
        isVerified
        stickerImage
        lotNumber
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
        type
        typeTH
        species
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

const UPDATE_PET = gql`
  mutation UpdatePet($input: UpdatePetInput!) {
    updatePet(updatePetInput: $input) {
      id
      isLost
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
    const [showActionSheet, setShowActionSheet] = useState(false);
    const [showNewQrModal, setShowNewQrModal] = useState(false);
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [showSosModal, setShowSosModal] = useState(false);

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
    const [updatePet] = useMutation(UPDATE_PET);

    const { data: meData } = useQuery(WHO_AM_I);
    const me = meData?.whoAmI;

    useEffect(() => {
        const token = Cookies.get("token");
        if (!token) router.push("/auth/login");
    }, [router]);

    const handleLegacyUpload = async (modalData: any) => {
        try {
            await uploadLegacy({
                variables: {
                    input: {
                        petId: id,
                        vaccineMasterId: modalData.vaccineId,
                        dateAdministered: new Date(modalData.dateAdministered).toISOString(),
                        nextDueDate: modalData.nextDueDate ? new Date(modalData.nextDueDate).toISOString() : undefined,
                        stickerImage: modalData.stickerImage,
                        lotNumber: modalData.lotNumber
                    }
                }
            });
            alert("Vaccine record added successfully!");
            // No need to close modal here as it's handled by prop usually,
            // but we call refetch
            refetch();
        } catch (e: any) {
            console.error(e);
            alert("Error uploading: " + e.message);
        }
    };

    // Helper for Countdown Badge


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

    const handleToggleSos = async () => {
        try {
            await updatePet({
                variables: {
                    input: {
                        id,
                        isLost: !pet.isLost
                    }
                }
            });
            setShowSosModal(false);
            refetch();
        } catch (e: any) {
            alert("Error updating SOS status: " + e.message);
        }
    };

    // Derived State for Filtering
    const uniqueTypes = Array.from(new Set(pet.vaccinations?.map((v: any) => v.vaccine.type).filter(Boolean))) as string[];

    const filteredRecords = pet.vaccinations?.filter((record: any) => {
        if (filterType === "ALL") return true;
        return record.vaccine.type === filterType;
    }).sort((a: any, b: any) => new Date(b.dateAdministered).getTime() - new Date(a.dateAdministered).getTime());



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
                        <i className="fas fa-qrcode"></i> {showQR ? "Hide" : "Pet Card QR"}
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
                                                <div className="flex flex-col gap-2 w-full">
                                                    <Link href={`/owner/pet/${pet.id}/edit`} className="text-white/80 hover:text-white text-xs bg-white/20 px-3 py-1 rounded-full transition-colors whitespace-nowrap w-full text-center">
                                                        <i className="fas fa-edit mr-1"></i> Edit
                                                    </Link>
                                                    <button
                                                        onClick={() => setShowSosModal(true)}
                                                        className={`text-white text-xs px-3 py-1 rounded-full transition-colors whitespace-nowrap w-full text-center border-none cursor-pointer ${pet.isLost ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-white/20 hover:bg-white/30'}`}
                                                    >
                                                        <i className={`fas fa-exclamation-triangle mr-1 ${pet.isLost ? 'animate-pulse' : ''}`}></i> {pet.isLost ? 'SOS ACTIVE' : 'SOS'}
                                                    </button>
                                                </div>
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
                                            <i className="fas fa-mars w-4"></i> {pet.gender}{pet.isSterilized && ' • Sterilized'}
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
                                onClick={() => setShowActionSheet(true)}
                                className="w-full bg-[#8AD6C6] text-white border-none p-4 rounded-[20px] text-base font-bold flex justify-center items-center gap-2 shadow-[0_8px_20px_rgba(138,214,198,0.4)] hover:bg-[#76BDB0] transition-colors"
                            >
                                <i className="fas fa-plus"></i> Add Vaccine Record
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
                                        {uniqueTypes.map((type: string) => (
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
                                filteredRecords.map((record: any) => {
                                    const daysLeft = getDaysLeft(record.nextDueDate);
                                    return (
                                        <div
                                            key={record.id}
                                            onClick={() => setSelectedVaccineRecord(record)}
                                            className="bg-white rounded-[20px] p-4 shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow cursor-pointer relative"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>

                                                    <div className="text-base font-bold text-[#4A5568]">{record.vaccine.name} <span className="text-sm font-normal text-gray-400">({record.vaccine.brand})</span></div>
                                                    {record.vaccine.typeTH && <div className="text-xs text-gray-400 mb-1">{record.vaccine.typeTH}</div>}
                                                    <div className="text-[13px] text-[#999] mt-1 flex items-center gap-2">
                                                        <span>Next Due: <span className="font-bold text-[#F6A6A6]">{record.nextDueDate ? new Date(record.nextDueDate).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' }) : "-"}</span></span>
                                                        {daysLeft && (
                                                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 ${daysLeft.color}`}>
                                                                <i className="fas fa-clock"></i> {daysLeft.days} d
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {record.isVerified ? (
                                                    <div className="flex items-center gap-1 text-[#8AD6C6] text-xs font-bold">
                                                        <i className="fas fa-check-circle"></i> Verified
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 text-[#F6AD55] text-xs font-bold">
                                                        <i className="fas fa-clock"></i> Owner Upload
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center mt-3">
                                                <div className="flex gap-2">
                                                    {record.vaccine.type && (
                                                        <span className="px-3 py-1 rounded-[12px] text-[10px] font-bold bg-gray-300 text-white">
                                                            {record.vaccine.type}
                                                        </span>
                                                    )}
                                                </div>
                                                <i className="fas fa-chevron-right text-[#CCC]"></i>
                                            </div>
                                        </div>
                                    )
                                })
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
                        onClick={() => setShowActionSheet(true)}
                        className="pointer-events-auto w-full max-w-[440px] bg-[#8AD6C6] text-white border-none p-4 rounded-[20px] text-base font-bold flex justify-center items-center gap-2 shadow-[0_8px_20px_rgba(138,214,198,0.4)]"
                    >
                        <i className="fas fa-plus"></i> Add Vaccine Record
                    </button>
                </div>

                {/* Modals (Legacy Form & Details) */}
                {/* Action Sheet */}
                {showActionSheet && (
                    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowActionSheet(false)}>
                        <div className="bg-white w-full max-w-lg rounded-t-[24px] md:rounded-[24px] p-6 animate-slide-up md:animate-scale-up space-y-4 pb-10 md:pb-6" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-lg font-bold text-gray-700">Add Vaccine Record</h3>
                                <button onClick={() => setShowActionSheet(false)} className="text-gray-400 font-bold p-2">✕</button>
                            </div>

                            <button
                                onClick={() => {
                                    setShowActionSheet(false);
                                    setShowLegacyForm(true);
                                }}
                                className="w-full bg-[#8AD6C6] text-white font-bold p-4 rounded-[16px] flex items-center justify-center gap-3 shadow-sm hover:opacity-90 transition-opacity"
                            >
                                <i className="fas fa-camera text-xl"></i>
                                Upload Past Record (Photo)
                            </button>

                            <button
                                onClick={() => {
                                    setShowActionSheet(false);
                                    setShowNewQrModal(true);
                                }}
                                className="w-full bg-white border-2 border-[#8AD6C6] text-[#8AD6C6] font-bold p-4 rounded-[16px] flex items-center justify-center gap-3 hover:bg-green-50 transition-colors"
                            >
                                <i className="fas fa-qrcode text-xl"></i>
                                New Vaccine (Gen QR)
                            </button>
                        </div>
                    </div>
                )}

                {/* Generate New Vaccine QR Modal */}
                {showNewQrModal && (
                    <VaccineQrModal
                        petId={pet.id}
                        onClose={() => setShowNewQrModal(false)}
                        onSuccess={() => {
                            // alert("Vaccine Confirmed by Vet!"); // Optional to show alert or just silent refresh
                            refetch();
                        }}
                    />
                )}

                {/* QR Code Modal (Pet ID) */}
                {
                    showQR && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm" onClick={() => setShowQR(false)}>
                            <div className="bg-white rounded-[24px] p-6 shadow-2xl animate-pop-in flex flex-col items-center relative" onClick={e => e.stopPropagation()}>
                                <button onClick={() => setShowQR(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                                    <i className="fas fa-times text-xl"></i>
                                </button>
                                {/* <h3 className="text-lg font-bold text-[#4A5568] mb-1">Pet QR Code</h3> */}
                                <p className="text-lg font-bold text-[#8AD6C6] mb-2">{pet.name}</p>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600 font-bold">
                                        <i className={`fas fa-${pet.species === 'CAT' ? 'cat' : 'dog'} mr-2`}></i>
                                        {pet.species === "CAT" ? "Cat" : "Dog"}
                                    </span>
                                    <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600 font-bold">
                                        <i className="fas fa-venus-mars mr-2"></i>
                                        {pet.gender}
                                    </span>
                                </div>
                                <div className="bg-white p-2 rounded-xl mb-2">
                                    <QRCode value={pet.id} size={250} />
                                </div>

                                <div className="grid grid-cols-2 gap-3 w-full">
                                    <button
                                        onClick={() => {
                                            window.open(`/public/pet/${pet.id}`, '_blank');
                                        }}
                                        className="bg-white border-2 border-[#8AD6C6] text-[#8AD6C6] py-3 rounded-xl font-bold hover:bg-[#E6FFFA] transition-colors flex items-center justify-center gap-2"
                                    >
                                        <i className="fas fa-external-link-alt"></i> View Card
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowQR(false);
                                            setShowEditProfile(true);
                                        }}
                                        className="bg-[#8AD6C6] text-white py-3 rounded-xl font-bold hover:bg-[#76BDB0] transition-colors flex items-center justify-center gap-2"
                                    >
                                        <i className="fas fa-edit"></i> Edit Card
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Edit Public Profile Modal */}
                {showEditProfile && (
                    <EditPublicProfileModal
                        pet={pet}
                        onClose={() => setShowEditProfile(false)}
                        onSuccess={() => {
                            refetch();
                        }}
                    />
                )}

                {/* New Smart Add Vaccine Modal */}
                {
                    showLegacyForm && (
                        <AddVaccineModal
                            onClose={() => setShowLegacyForm(false)}
                            onUpload={handleLegacyUpload}
                            pet={pet}
                            vaccineOptions={vaccineData?.vaccines || []}
                        />
                    )
                }

                {/* Details Modal */}
                {/* Vaccine Details Modal */}
                {selectedVaccineRecord && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm" onClick={() => setSelectedVaccineRecord(null)}>
                        <div className="bg-white w-full max-w-sm rounded-[24px] overflow-hidden shadow-2xl animate-pop-in" onClick={e => e.stopPropagation()}>
                            <div className="bg-[#8AD6C6] p-4 text-white flex justify-between items-center">
                                <span className="font-bold text-lg">Vaccine Details</span>
                                <button onClick={() => setSelectedVaccineRecord(null)} className="text-white/80 hover:text-white">✕</button>
                            </div>
                            <div className="p-6 relative overflow-hidden">
                                {selectedVaccineRecord.isVerified && (
                                    <div className="absolute bottom-0 right-0 opacity-15 pointer-events-none z-0 -rotate-[25deg]">
                                        <img src="/logo.png" className="w-45 h-45" alt="Verified Watermark" />
                                    </div>
                                )}
                                <div className="relative z-10">
                                    <h3 className="text-xl font-bold text-[#4A5568] mb-1">{selectedVaccineRecord.vaccine.name} ({selectedVaccineRecord.vaccine.brand})</h3>
                                    <div className="flex justify-between items-center mb-4">
                                        {selectedVaccineRecord.vaccine.typeTH ?
                                            <p className="text-gray-400 text-sm">{selectedVaccineRecord.vaccine.typeTH}</p> : <span></span>
                                        }
                                        <span className="px-3 py-1 rounded-[12px] text-[10px] font-bold bg-gray-300 text-white">{selectedVaccineRecord.vaccine.type}</span>
                                    </div>
                                    <hr className="border-gray-100 mb-4" />

                                    <div className="mt-[20px] mb-6">
                                        {selectedVaccineRecord.stickerImage && (
                                            <div>
                                                <p className="text-xs font-bold text-gray-400 mb-2 uppercase">Proof / Sticker</p>
                                                <img src={selectedVaccineRecord.stickerImage} className="w-full rounded-lg border object-cover max-h-48" alt="Sticker" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3 text-sm text-gray-600">
                                        {selectedVaccineRecord.lotNumber && (<div className="flex justify-between pb-2 border-b border-gray-50">
                                            <span>Lot Number</span>
                                            <span className="font-bold text-gray-800">{selectedVaccineRecord.lotNumber}</span>
                                        </div>)}
                                        <div className="flex justify-between pb-2">
                                            <span>Next Due Date</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-[#F6A6A6]">
                                                    {selectedVaccineRecord.nextDueDate ? new Date(selectedVaccineRecord.nextDueDate).toLocaleDateString("en-GB", {
                                                        day: 'numeric', month: 'short', year: 'numeric'
                                                    }) : "-"}
                                                </span>
                                                {getDaysLeft(selectedVaccineRecord.nextDueDate) && (
                                                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 ${getDaysLeft(selectedVaccineRecord.nextDueDate)?.color}`}>
                                                        <i className="fas fa-clock"></i> {getDaysLeft(selectedVaccineRecord.nextDueDate)?.days} d
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex justify-between pb-2">
                                            <span>Date Administered</span>
                                            <span className="font-bold">{new Date(selectedVaccineRecord.dateAdministered).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                        <div className="flex justify-between pb-2">
                                            <span>Vet</span>
                                            <span className="font-bold">{selectedVaccineRecord.vet?.user?.fullName || "Owner Upload"}</span>
                                        </div>
                                        <div className="flex justify-between pb-2">
                                            <span>Clinic</span>
                                            <span className="font-bold">{selectedVaccineRecord.clinic?.name || selectedVaccineRecord.vet?.clinic?.name || "-"}</span>
                                        </div>
                                    </div>


                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* SOS Confirmation Modal */}
                {showSosModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm" onClick={() => setShowSosModal(false)}>
                        <div className="bg-white w-full max-w-sm rounded-[24px] overflow-hidden shadow-2xl animate-pop-in" onClick={e => e.stopPropagation()}>
                            <div className={`${pet.isLost ? 'bg-green-500' : 'bg-red-500'} p-4 text-white flex justify-between items-center`}>
                                <span className="font-bold text-lg">{pet.isLost ? 'เย้! เจอน้อง ' + pet.name + ' แล้วใช่ไหม? 🎉' : 'น้อง ' + pet.name + ' หายตัวไปใช่ไหม?'}</span>
                                <button onClick={() => setShowSosModal(false)} className="text-white/80 hover:text-white bg-transparent border-none text-xl p-0">✕</button>
                            </div>
                            <div className="p-6">
                                <p className="text-gray-600 mb-6 leading-relaxed">
                                    {pet.isLost
                                        ? `ดีใจด้วยมากๆ เลย! ระบบจะเปลี่ยนสถานะน้องกลับเป็น "ปลอดภัย" และ ซ่อนเบอร์โทรศัพท์ ของคุณกลับไปเป็นส่วนตัวเหมือนเดิม`
                                        : `ไม่ต้องตกใจนะ! เมื่อกดยืนยัน ระบบจะเปลี่ยนสถานะเป็น "MISSING" และ แสดงเบอร์โทรศัพท์ของคุณ บนหน้า Profile เมื่อมีคนสแกน QR Code เพื่อให้คนที่เจอน้องติดต่อหาคุณได้ไวที่สุด`
                                    }
                                </p>
                                <div className="space-y-3">
                                    <button
                                        onClick={handleToggleSos}
                                        className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 border-none cursor-pointer ${pet.isLost ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
                                    >
                                        {pet.isLost ? 'ใช่ เจอตัวแล้ว!' : '📢 ใช่ ประกาศตามหา'}
                                    </button>
                                    <button
                                        onClick={() => setShowSosModal(false)}
                                        className="w-full py-4 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all border-none cursor-pointer"
                                    >
                                        ยกเลิก
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
