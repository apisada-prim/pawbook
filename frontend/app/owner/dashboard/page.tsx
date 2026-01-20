"use client";

import { gql, useQuery, useMutation } from "@apollo/client";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { Nunito } from "next/font/google";

const nunito = Nunito({ subsets: ["latin"], weight: ["400", "600", "700", "800"] });

const MY_FAMILIES_QUERY = gql`
  query MyFamilies {
    myFamilies {
      id
      name
      ownerId
      owner {
        id
        fullName
        image
      }
    }
  }
`;

const MY_PETS_QUERY = gql`
  query MyPets($familyId: String) {
    myPets(familyId: $familyId) {
      id
      name
      species
      breed
      gender
      birthDate
      image
      ownerId
      isSterilized
    }
  }
`;

const UPDATE_FAMILY_NAME = gql`
  mutation UpdateFamilyName($name: String!) {
    updateFamilyName(name: $name) {
      id
      name
    }
  }
`;

const GENERATE_TRANSFER_CODE = gql`
  mutation GenerateTransferCode($petId: String!) {
    generateTransferCode(petId: $petId) {
      id
      transferCode
      transferExpiresAt
    }
  }
`;

import { calculateAge } from "../../utils/dateUtils";

export default function OwnerDashboard() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [selectedFamily, setSelectedFamily] = useState<any>(null);
    const [isRenaming, setIsRenaming] = useState(false);
    const [newFamilyName, setNewFamilyName] = useState("");
    const [transferModal, setTransferModal] = useState<{ petId: string, name: string, code?: string } | null>(null);

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Queries
    const { data: userData } = useQuery(gql`
        query WhoAmI {
            whoAmI {
                id
                fullName
                image
                defaultFamilyId
            }
        }
    `);

    const { data: familiesData, loading: familiesLoading, refetch: refetchFamilies } = useQuery(MY_FAMILIES_QUERY);

    const { data: petsData, loading: petsLoading, refetch: refetchPets } = useQuery(MY_PETS_QUERY, {
        variables: { familyId: selectedFamily?.id },
        skip: !selectedFamily,
        fetchPolicy: "cache-and-network"
    });

    // Mutations
    const [updateFamilyName] = useMutation(UPDATE_FAMILY_NAME);
    const [generateTransferCode] = useMutation(GENERATE_TRANSFER_CODE);

    useEffect(() => {
        setMounted(true);
        const token = Cookies.get("token");
        if (!token) {
            router.push("/auth/login");
        }

        // Click outside handler for dropdown
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [router]);

    // Initial Family Selection Logic
    useEffect(() => {
        if (userData?.whoAmI && familiesData?.myFamilies?.length > 0 && !selectedFamily) {
            let targetFamily = null;

            // 1. Try Default Family
            if (userData.whoAmI.defaultFamilyId) {
                targetFamily = familiesData.myFamilies.find((f: any) => f.id === userData.whoAmI.defaultFamilyId);
            }

            // 2. Fallback to Owned Family
            if (!targetFamily) {
                targetFamily = familiesData.myFamilies.find((f: any) => f.ownerId === userData.whoAmI.id);
            }

            // 3. Fallback to First Available
            if (!targetFamily) {
                targetFamily = familiesData.myFamilies[0];
            }

            if (targetFamily) {
                setSelectedFamily(targetFamily);
            }
        }
    }, [userData, familiesData, selectedFamily]);


    const handleRenameFamily = async () => {
        if (!newFamilyName.trim() || !selectedFamily) return;
        try {
            await updateFamilyName({ variables: { name: newFamilyName } });
            setIsRenaming(false);
            refetchFamilies();
        } catch (e: any) {
            alert("Error renaming family: " + e.message);
        }
    };

    const handleGenerateTransfer = async () => {
        if (!transferModal) return;
        try {
            const res = await generateTransferCode({ variables: { petId: transferModal.petId } });
            setTransferModal({ ...transferModal, code: res.data.generateTransferCode.transferCode });
        } catch (e: any) {
            alert("Error generating code: " + e.message);
        }
    };

    if (!mounted) return null;
    const isOwnerOfFamily = userData?.whoAmI?.id === selectedFamily?.ownerId;

    return (
        <div className={`min-h-screen bg-[#FFF9F4] ${nunito.className} pb-20`}>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

            <div className="max-w-7xl mx-auto p-5 md:p-8">
                {/* Header */}
                <div className="flex flex-row justify-between items-center mb-6 md:mb-8 bg-white/80 backdrop-blur-xl p-4 md:rounded-[24px] rounded-b-[24px] sticky top-0 z-40 shadow-sm border border-white/50 -mx-5 md:mx-0 px-5 md:px-6 transition-all duration-300">
                    <div className="flex items-center gap-4">
                        {/* Family Switcher */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-2 text-2xl md:text-3xl font-bold text-[#4A5568] hover:text-[#8AD6C6] transition-colors"
                            >
                                <i className="fas fa-paw text-[#8AD6C6]"></i>
                                <span>{selectedFamily?.name || "My Pets"}</span>
                                <i className={`fas fa-chevron-down text-sm transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}></i>
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                                    <div className="p-2 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wide">Switch Family</div>
                                    {familiesData?.myFamilies.map((f: any) => (
                                        <button
                                            key={f.id}
                                            onClick={() => { setSelectedFamily(f); setIsDropdownOpen(false); }}
                                            className={`w-full text-left px-4 py-3 text-sm font-bold flex items-center justify-between hover:bg-[#E6FFFA] transition-colors ${selectedFamily?.id === f.id ? 'text-[#8AD6C6] bg-[#F0FDF9]' : 'text-gray-600'}`}
                                        >
                                            <span>{f.name}</span>
                                            {f.ownerId === userData?.whoAmI?.id && <span className="text-[10px] bg-[#8AD6C6] text-white px-1.5 py-0.5 rounded">OWNER</span>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="h-8 w-[1px] bg-gray-200 mx-2 hidden md:block"></div>
                        <Link href="/owner/account" className="flex items-center gap-3 group">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-[#4A5568] group-hover:text-[#8AD6C6] transition-colors">{userData?.whoAmI?.fullName}</p>
                                <p className="text-xs text-gray-400">View Profile</p>
                            </div>
                            {userData?.whoAmI?.image ? (
                                <img
                                    src={userData.whoAmI.image}
                                    alt="Profile"
                                    className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-md group-hover:border-[#8AD6C6] transition-colors"
                                />
                            ) : (
                                <div className="h-10 w-10 rounded-full bg-[#E6FFFA] flex items-center justify-center text-[#8AD6C6] font-bold border-2 border-white shadow-md group-hover:border-[#8AD6C6] transition-colors">
                                    {userData?.whoAmI?.fullName?.charAt(0) || "U"}
                                </div>
                            )}
                        </Link>
                    </div>
                </div>

                {/* Main Content */}
                <div className="space-y-6">
                    {/* Family Info / Owner Badge */}
                    {!isOwnerOfFamily && selectedFamily && (
                        <div className="bg-[#E6FFFA] border border-[#8AD6C6] rounded-xl p-4 flex items-center gap-3 text-[#4A5568] text-sm font-bold animate-in slide-in-from-top-2">
                            <i className="fas fa-info-circle text-[#8AD6C6] text-xl"></i>
                            <span>Viewing family owned by <span className="text-[#8AD6C6] underline">{selectedFamily.owner.fullName}</span></span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Add New Pet Card (Only for Owner) */}
                        {isOwnerOfFamily && (
                            <Link href="/owner/add-pet" className="col-span-1">
                                <div className="h-auto md:h-full md:min-h-[220px] bg-white border-2 border-dashed border-[#8AD6C6] rounded-[20px] md:rounded-[24px] p-4 md:p-6 flex flex-row md:flex-col items-center justify-center gap-3 md:gap-4 text-[#8AD6C6] hover:bg-[#F0FDF9] transition-all cursor-pointer group shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_rgba(138,214,198,0.3)]">
                                    <div className="w-10 h-10 md:w-16 md:h-16 bg-[#E6FFFA] rounded-full flex items-center justify-center md:mb-3 group-hover:scale-110 transition-transform">
                                        <i className="fas fa-plus text-lg md:text-2xl"></i>
                                    </div>
                                    <span className="font-bold text-base md:text-lg">Add New Pet</span>
                                </div>
                            </Link>
                        )}

                        {petsLoading ? <div className="col-span-full text-center py-10 font-bold text-gray-300">Loading pets...</div> : petsData?.myPets.map((pet: any) => (
                            <div key={pet.id} className="relative group">
                                <Link href={`/owner/pet/${pet.id}`} className="contents">
                                    <div className="bg-white p-6 rounded-[24px] shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.05)] transition-all border border-gray-100 flex flex-col relative overflow-hidden h-full">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#FFF9F4] rounded-bl-[100px] -mr-6 -mt-6 transition-transform group-hover:scale-110"></div>

                                        <div className="flex items-start gap-4 z-10">
                                            <div className="w-16 h-16 rounded-full bg-gray-100 border-[3px] border-white shadow-sm overflow-hidden flex-shrink-0">
                                                {pet.image ? (
                                                    <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-[#E6FFFA] flex items-center justify-center text-[#8AD6C6]">
                                                        <i className={`fas fa-${pet.species === 'CAT' ? 'cat' : 'dog'} text-2xl`}></i>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h2 className="text-xl font-bold text-[#4A5568] leading-tight mb-1">{pet.name}</h2>
                                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${pet.species === 'DOG' ? 'bg-blue-50 text-blue-400' : 'bg-orange-50 text-orange-400'}`}>
                                                    {pet.species}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-6 space-y-2 text-sm text-gray-500 z-10 flex-1">
                                            <div className="flex items-center gap-2">
                                                <i className="fas fa-paw w-5 text-center text-[#8AD6C6]"></i>
                                                <span>{pet.breed || "Mixed Breed"}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <i className="fas fa-venus-mars w-5 text-center text-[#8AD6C6]"></i>
                                                <span className="capitalize">{pet.gender.toLowerCase()} {pet.isSterilized && '• Sterilized'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <i className="fas fa-birthday-cake w-5 text-center text-[#8AD6C6]"></i>
                                                <span>{new Date(pet.birthDate).toLocaleDateString()} ({calculateAge(pet.birthDate)})</span>
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center z-10">
                                            <span className="text-gray-400 text-xs font-bold uppercase tracking-wide">
                                                Details
                                            </span>
                                            <span className="text-[#8AD6C6] group-hover:translate-x-1 transition-transform">
                                                <i className="fas fa-arrow-right"></i>
                                            </span>
                                        </div>
                                    </div>
                                </Link>

                                {/* Transfer Button - Overlay on hover only for owner */}
                                {isOwnerOfFamily && (
                                    <button
                                        onClick={(e) => { e.preventDefault(); setTransferModal({ petId: pet.id, name: pet.name }); }}
                                        className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur text-gray-400 hover:text-[#8AD6C6] p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                                        title="Create Transfer Code"
                                    >
                                        <i className="fas fa-suitcase"></i>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {/* Transfer Modal */}
            {transferModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-[24px] p-8 max-w-sm w-full shadow-xl">
                        {!transferModal.code ? (
                            <>
                                <h3 className="text-xl font-bold text-[#4A5568] mb-2"><i className="fas fa-suitcase text-[#8AD6C6] mr-2"></i>Create Transfer Code?</h3>
                                <p className="text-gray-500 text-sm mb-6">This creates a moving pass for the new owner. <b>Don't worry, {transferModal.name} stays with you until the code is used.</b></p>
                                <div className="flex gap-3">
                                    <button onClick={() => setTransferModal(null)} className="flex-1 py-3 rounded-xl font-bold text-gray-400 hover:bg-gray-50">Cancel</button>
                                    <button onClick={handleGenerateTransfer} className="flex-1 py-3 rounded-xl font-bold bg-[#8AD6C6] text-white hover:bg-[#76BDB0] shadow-lg shadow-[#8AD6C6]/20">Generate Code</button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h3 className="text-xl font-bold text-[#4A5568] mb-4 text-center">Ready for Handover!</h3>
                                <div className="bg-[#E6FFFA] p-6 rounded-xl border-dashed border-2 border-[#8AD6C6] text-center mb-6">
                                    <p className="text-xs text-[#8AD6C6] font-bold uppercase tracking-wide mb-2">Adoption Code</p>
                                    <p className="text-3xl font-mono font-black text-[#4A5568] tracking-widest">{transferModal.code}</p>
                                </div>
                                <p className="text-xs text-gray-400 text-center mb-6">Share this code with the new owner. It expires in 24 hours.</p>
                                <button onClick={() => setTransferModal(null)} className="w-full py-3 rounded-xl font-bold bg-gray-100 text-gray-600 hover:bg-gray-200">Close</button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
