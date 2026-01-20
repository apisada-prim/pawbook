"use client";

import { gql, useQuery, useMutation } from "@apollo/client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import Link from "next/link";
import { calculateNextVaccineDate, calculateAge, getDaysLeft } from "../../../utils/dateUtils";
import { extractVaccineData } from "@/app/actions/extractVaccine";
import { cropToSquare } from "../../../utils/imageUtils";

const GET_DATA_QUERY = gql`
  query GetData($petId: String!) {
    pet: findOne(id: $petId) {
        id
        name
        species
        gender
        birthDate
        isSterilized
        image
        chronicDiseases
      vaccinations {
            id
            dateAdministered
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
    vaccines {
        id
        name
        brand
        type
        species
    }
    me: whoAmI {
        id
        fullName
        role
        vetProfile {
            licenseNumber
            clinic {
                name
            }
        }
    }
}
`;


const VERIFY_QR_QUERY = gql`
    query VerifyQr($token: String!) {
        pet: verifyVaccineQr(token: $token) {
            id
            name
            species
            gender
            birthDate
            isSterilized
            image
            chronicDiseases
            vaccinations {
                id
                dateAdministered
                vaccine {
                    name
                    brand
                    type
                    typeTH
                }
                vet {
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
                nextDueDate
                isVerified
                stickerImage
                lotNumber
            }
        }
        vaccines {
            id
            name
            brand
            type
            species
        }
        me: whoAmI {
            id
            fullName
            role
            vetProfile {
                licenseNumber
                clinic {
                    name
                }
            }
        }
    }
`;


const STAMP_MUTATION = gql`
  mutation Stamp($input: CreateVaccineRecordInput!) {
    createVaccineRecord(input: $input) {
      id
      dateAdministered
      nextDueDate
    }
  }
`;

export default function VetStampPage() {
    const params = useParams();
    const router = useRouter();
    const { petId } = params;

    // Form State
    const [selectedVaccineType, setSelectedVaccineType] = useState("");
    const [selectedVaccineId, setSelectedVaccineId] = useState("");
    // Default to today
    const [dateAdministered] = useState(new Date().toISOString().split('T')[0]);
    const [nextDueDate, setNextDueDate] = useState("");

    // UI State
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
    const [errorModal, setErrorModal] = useState({ show: false, message: "" });
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Photo Logic State
    const [hasPhoto, setHasPhoto] = useState(false);
    const [stickerImageUrl, setStickerImageUrl] = useState("");
    const [selectedVaccineRecord, setSelectedVaccineRecord] = useState<any>(null);

    // Helper to close modal and redirect
    const handleErrorModalClose = () => {
        setErrorModal({ show: false, message: "" });
        router.push("/vet/scanner");
    };

    // Check if petId is a UUID or a JWT Token
    // UUID (v4) length is 36. JWT is usually much longer.
    const isQrToken = !!(petId && petId.length > 36);

    const { data: uuidData, loading: uuidLoading, error: uuidError } = useQuery(GET_DATA_QUERY, {
        variables: { petId },
        skip: !petId || isQrToken
    });

    const { data: qrData, loading: qrLoading, error: qrError } = useQuery(VERIFY_QR_QUERY, {
        variables: { token: petId },
        skip: !petId || !isQrToken
    });

    const loading = uuidLoading || qrLoading;
    const error = uuidError || qrError;
    const data = isQrToken ? qrData : uuidData;


    const [stamp, { loading: stamping, error: stampError }] = useMutation(STAMP_MUTATION);

    useEffect(() => {
        const token = Cookies.get("token");
        if (!token) router.push("/auth/login");
    }, [router]);

    // Handle Stale Token / User Not Found
    useEffect(() => {
        if (!loading && data && !data.me) {
            Cookies.remove("token");
            router.push("/auth/login");
        }
    }, [loading, data, router]);

    // Handle QR Query Error specifically
    useEffect(() => {
        if (qrError) {
            setErrorModal({ show: true, message: qrError.message });
        }
    }, [qrError]);

    const pet = data?.pet;
    const vaccines = data?.vaccines || [];
    const me = data?.me;

    const vetName = me?.fullName || "Unknown Vet";
    const clinicName = me?.vetProfile?.clinic?.name || "Independent / Unknown Clinic (Not Linked)";

    // Filter vaccines by species (Robust Match)
    const availableVaccines = pet ? vaccines.filter((v: any) => v.species?.toUpperCase() === pet.species?.toUpperCase()) : [];

    // Get unique types for this species
    const uniqueTypes = Array.from(new Set(availableVaccines.map((v: any) => v.type)));

    // Filter vaccines by selected type
    const vaccinesByType = selectedVaccineType
        ? availableVaccines.filter((v: any) => v.type === selectedVaccineType)
        : [];

    // Sort Vaccination History (Newest First)
    const sortedHistory = pet?.vaccinations ? [...pet.vaccinations].sort((a: any, b: any) => new Date(b.dateAdministered).getTime() - new Date(a.dateAdministered).getTime()) : [];

    // Auto-select vaccine if only one option exists
    useEffect(() => {
        if (loading || !pet) return; // Guard against loading state in effect

        if (vaccinesByType.length === 1 && !selectedVaccineId) {
            const v = vaccinesByType[0];
            setSelectedVaccineId(v.id);
            // Trigger auto date calc logic
            if (dateAdministered && pet.birthDate) {
                const birth = new Date(pet.birthDate);
                const adminDate = new Date(dateAdministered);
                const ageInWeeks = Math.floor((adminDate.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 7));
                const nextDate = calculateNextVaccineDate(pet.species, v.type, dateAdministered, ageInWeeks);
                setNextDueDate(nextDate);
            }
        }
    }, [vaccinesByType, selectedVaccineId, dateAdministered, pet, loading]);

    // Handle Loading/Error/Modal Render Logic MOVED BELOW HOOKS
    // We cannot return early above if we have hooks below.
    // However, availableVaccines/vaccinesByType are derived state that depend on 'data'.
    // If 'data' is undefined (loading), these will crash if computed top-level.
    // So we must handle derived state safely or use empty defaults.


    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const originalFile = e.target.files?.[0];
        if (!originalFile) return;

        setIsAnalyzing(true);
        try {
            const file = await cropToSquare(originalFile);

            // 1. Upload Image First
            const uploadData = new FormData();
            uploadData.append("file", file);

            // Use the same upload endpoint as Owner side
            const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/uploads`, {
                method: "POST",
                body: uploadData,
            });

            if (!uploadRes.ok) throw new Error("Failed to upload image");

            const uploadJson = await uploadRes.json();
            const imageUrl = uploadJson.url;

            setStickerImageUrl(imageUrl);
            setHasPhoto(true);

            // 2. Run OCR Analysis
            const result = await extractVaccineData(uploadData); // Server Action handles FormData directly

            if (result.vaccineName) {
                // Fuzzy match vaccine
                // Filter by species first
                const speciesVaccines = vaccines.filter((v: any) => v.species?.toUpperCase() === pet.species?.toUpperCase());

                // Find match
                const match = speciesVaccines.find((v: any) =>
                    v.name.toLowerCase().includes((result.vaccineName || "").toLowerCase()) ||
                    (result.vaccineName || "").toLowerCase().includes(v.name.toLowerCase())
                );

                if (match) {
                    setSelectedVaccineType(match.type);
                    setSelectedVaccineId(match.id);

                    // Auto Next Due Calculation
                    if (dateAdministered && pet.birthDate) {
                        const birth = new Date(pet.birthDate);
                        const adminDate = new Date(dateAdministered);
                        const ageInWeeks = Math.floor((adminDate.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 7));
                        const nextDate = calculateNextVaccineDate(pet.species, match.type, dateAdministered, ageInWeeks);
                        setNextDueDate(nextDate);
                    }

                    alert(`Detected: ${match.name} (${match.type})`);
                } else {
                    // Silent failure: just unlock form
                    // alert(`Saved photo. Could not find a matching vaccine in database for "${result.vaccineName}", but you can now select manually.`);
                }
            } else {
                // Silent failure: just unlock form
                // alert("Saved photo. Could not detect vaccine name text, but you can now select manually.");
            }

        } catch (err) {
            console.error("OCR/Upload Error", err);
            alert("Failed to upload/analyze image. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleStamp = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await stamp({
                variables: {
                    input: {
                        petId: pet.id,
                        vaccineMasterId: selectedVaccineId,
                        dateAdministered: new Date(dateAdministered).toISOString(),
                        nextDueDate: nextDueDate ? new Date(nextDueDate).toISOString() : undefined,
                        qrToken: isQrToken ? (petId as string) : undefined,
                        stickerImage: stickerImageUrl // Pass the image
                    }
                }
            });
            alert("Vaccine Stamped Successfully!");
            router.push("/vet/dashboard");
        } catch (err: any) {
            console.error(err);
            setErrorModal({ show: true, message: err.message || "Failed to stamp vaccine." });
        }
    };

    // Handle Loading/Error/Modal Render Logic
    if (loading) return <div className="p-8 text-center min-h-screen bg-gray-50 flex items-center justify-center">Loading pet data...</div>;
    if (error) return <div className="p-8 text-center text-red-500 min-h-screen bg-gray-50 flex items-center justify-center">Error: {error.message}</div>;
    if (!pet) return <div className="p-8 text-center min-h-screen bg-gray-50 flex items-center justify-center">Pet not found</div>;

    // Error Modal Component
    if (errorModal.show) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
                <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center animate-scale-up">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fa-solid fa-xmark text-3xl text-red-500"></i>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Error</h3>
                    <p className="text-gray-500 mb-6">{errorModal.message}</p>
                    <button
                        onClick={handleErrorModalClose}
                        className="w-full bg-red-500 text-white font-bold py-3 px-4 rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                    >
                        Back to Scanner
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
            {/* Font Awesome CDN if not globally loaded */}
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-6 py-5">
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <i className="fas fa-certificate text-indigo-300"></i> Digital Vaccination Stamp
                    </h1>
                    <p className="text-indigo-100 text-sm ml-7">Validating for {pet.name}</p>
                </div>

                <div className="p-5 md:p-8">
                    {/* Pet Information Section */}
                    <div className="mb-8 p-6 bg-indigo-50 rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden">
                        {/* Background Icon */}
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <i className={`fas fa-${pet.species === 'CAT' ? 'cat' : 'dog'} text-9xl text-indigo-900`}></i>
                        </div>

                        <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-widest mb-4 border-b border-indigo-200 pb-2">Pet Information</h3>

                        <div className="flex flex-row gap-4 md:gap-6 items-start relative z-10">
                            {/* Pet Image */}
                            <div className="flex-shrink-0">
                                {pet.image ? (
                                    <img
                                        src={pet.image}
                                        alt={pet.name}
                                        className="w-16 h-16 md:w-32 md:h-32 rounded-full object-cover border-2 md:border-4 border-white shadow-md bg-white"
                                    />
                                ) : (
                                    <div className="w-16 h-16 md:w-32 md:h-32 rounded-full border-2 md:border-4 border-white shadow-md bg-indigo-200 flex items-center justify-center text-indigo-400">
                                        <i className={`fas fa-${pet.species === 'CAT' ? 'cat' : 'dog'} text-2xl md:text-5xl`}></i>
                                    </div>
                                )}
                            </div>

                            {/* Pet Details */}
                            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <div className="w-8 flex justify-center text-indigo-400 mr-2"><i className="fas fa-paw"></i></div>
                                        <div>
                                            <span className="block text-xs font-semibold text-gray-500 uppercase">Name</span>
                                            <div className="flex items-center gap-2">
                                                <span className="block text-lg font-bold text-gray-900">{pet.name}</span>
                                                <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                                                    {pet.species}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center">
                                        <div className="w-8 flex justify-center text-indigo-400 mr-2">
                                            <i className={`fas fa-${pet.gender === 'Female' ? 'venus' : 'mars'}`}></i>
                                        </div>
                                        <div>
                                            <span className="block text-xs font-semibold text-gray-500 uppercase">Gender</span>
                                            <span className="block font-medium text-gray-900">
                                                {pet.gender} {pet.isSterilized && <span className="text-gray-500 text-sm">• Sterilized</span>}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center">
                                    <div className="w-8 flex justify-center text-indigo-400 mr-2"><i className="fas fa-birthday-cake"></i></div>
                                    <div>
                                        <span className="block text-xs font-semibold text-gray-500 uppercase">Age / Birthday</span>
                                        <span className="block font-medium text-gray-900">
                                            {calculateAge(pet.birthDate)} <span className="text-gray-400 text-xs">({new Date(pet.birthDate).toLocaleDateString()})</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {pet.chronicDiseases && (
                        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-4 animate-pulse-slow">
                            <span className="text-2xl">⚠️</span>
                            <div>
                                <p className="text-red-800 font-bold text-xs uppercase mb-1 tracking-wide">Chronic Diseases (โรคประจำตัว)</p>
                                <p className="text-red-900 font-bold">{pet.chronicDiseases}</p>
                            </div>
                        </div>
                    )}

                    {/* Vaccination History Section - NEW LOGIC */}
                    <div className="mb-10 mt-10">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                                <i className="fas fa-history text-gray-400"></i> Vaccination History
                            </h3></div>

                        <div className="space-y-3">
                            {sortedHistory.length > 0 ? (
                                <>
                                    {(isHistoryExpanded ? sortedHistory : sortedHistory.slice(0, 1)).map((record: any) => (
                                        <div
                                            key={record.id}
                                            onClick={() => setSelectedVaccineRecord(record)}
                                            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group cursor-pointer"
                                        >
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-400 to-indigo-600"></div>
                                            <div className="flex justify-between items-start pl-3">
                                                <div>
                                                    <div className="font-bold text-gray-800 text-lg">{record.vaccine.name}</div>
                                                    <div className="text-xs text-gray-500 mt-1 flex gap-2 items-center">
                                                        <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded border border-indigo-100 uppercase text-[10px]">{record.vaccine.type}</span>
                                                        <span className="text-gray-400">|</span>
                                                        <span>{record.vaccine.brand}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[12px] font-bold text-indigo-600 font-mono bg-indigo-50 px-2 py-1 rounded">Date Administered: {new Date(record.dateAdministered).toLocaleDateString()}</div>
                                                    <div className="text-[10px] text-gray-400 mt-1">
                                                        {"by "}
                                                        {record.isVerified ? (record.clinic?.name || record.vet?.clinic?.name || 'Verified Clinic') : "Owner Upload"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Expand Button */}
                                    {sortedHistory.length > 3 && (
                                        <button
                                            onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                                            className="w-full py-3 text-sm text-gray-500 font-bold bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
                                        >
                                            {isHistoryExpanded ? (
                                                <>Show Less <i className="fas fa-chevron-up"></i></>
                                            ) : (
                                                <>View All History ({sortedHistory.length}) <i className="fas fa-chevron-down"></i></>
                                            )}
                                        </button>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                    <i className="fas fa-syringe text-gray-300 text-3xl mb-2"></i>
                                    <p className="text-gray-400 text-sm">No recent vaccinations recorded.</p>
                                </div>
                            )}
                        </div>
                    </div>


                    <div className="border-t-2 border-dashed border-gray-200 my-8"></div>

                    {/* VET INFO SECTION (Compact) */}
                    <div className="mb-8 p-5 bg-gray-50 rounded-xl border border-gray-200">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <i className="fas fa-user-md"></i> Verifying Veterinarian
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Name</label>
                                <div className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 shadow-sm">{vetName}</div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Clinic</label>
                                <div className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 shadow-sm">{clinicName}</div>
                            </div>
                        </div>
                    </div>

                    {/* STAMP FORM */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white text-sm"><i className="fas fa-plus"></i></span>
                            Add New Record
                        </h3>

                        {/* Large Scan Button & Preview Area */}
                        <div className="mb-6">
                            {!stickerImageUrl ? (
                                <label className={`block w-full border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50 hover:bg-indigo-100 rounded-2xl p-8 text-center cursor-pointer transition-all group ${isAnalyzing ? 'opacity-70 pointer-events-none' : ''}`}>
                                    {isAnalyzing ? (
                                        <div className="flex flex-col items-center">
                                            <i className="fas fa-spinner fa-spin text-3xl text-indigo-400 mb-2"></i>
                                            <span className="font-bold text-indigo-500">Analyzing Vaccine Sticker...</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <i className="fas fa-camera text-3xl text-indigo-500"></i>
                                            </div>
                                            <div>
                                                <span className="block text-lg font-bold text-indigo-900">Tap to Take Photo</span>
                                                <span className="text-indigo-400 text-sm">Upload vaccine label to auto-fill</span>
                                            </div>
                                        </div>
                                    )}
                                    <input type="file" accept="image/*;capture=camera" className="hidden" onChange={handleImageSelect} disabled={isAnalyzing} />
                                </label>
                            ) : (
                                <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                                    <div className="aspect-video w-full relative bg-black/5">
                                        <img src={stickerImageUrl} alt="Sticker Preview" className="w-full h-full object-contain" />
                                    </div>
                                    <div className="p-4 flex items-center justify-between bg-white">
                                        <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                                            <i className="fas fa-check-circle"></i> Photo Attached
                                        </div>
                                        <label className="text-indigo-600 font-bold text-sm cursor-pointer hover:underline">
                                            Retake Photo
                                            <input type="file" accept="image/*;capture=camera" className="hidden" onChange={handleImageSelect} disabled={isAnalyzing} />
                                        </label>
                                    </div>
                                    {isAnalyzing && (
                                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-sm z-10">
                                            <div className="flex flex-col items-center">
                                                <i className="fas fa-spinner fa-spin text-3xl text-indigo-500 mb-2"></i>
                                                <span className="font-bold text-indigo-600">Re-analyzing...</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {!hasPhoto && !stickerImageUrl && (
                            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm p-3 rounded-lg mb-6 flex items-start gap-3">
                                <i className="fas fa-info-circle mt-0.5 text-yellow-600"></i>
                                <span>You must take a photo of the vaccine label to unlock the form.</span>
                            </div>
                        )}

                        <form onSubmit={handleStamp} className="space-y-6 bg-white rounded-xl">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Type Selector */}
                                <div className={!hasPhoto ? 'opacity-50 pointer-events-none grayscale' : ''}>
                                    <label className="block text-sm font-bold leading-6 text-gray-900 mb-1">Vaccine Type</label>
                                    <div className="relative">
                                        <select
                                            required
                                            className="appearance-none block w-full rounded-xl border-0 py-3 pl-4 pr-10 text-gray-900 ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 shadow-sm"
                                            value={selectedVaccineType}
                                            onChange={(e) => {
                                                setSelectedVaccineType(e.target.value);
                                                setSelectedVaccineId("");
                                                setNextDueDate("");
                                            }}
                                        >
                                            <option value="">-- Select Type --</option>
                                            {uniqueTypes.map((type: any) => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                            <i className="fas fa-chevron-down text-xs"></i>
                                        </div>
                                    </div>
                                </div>

                                {/* Vaccine Selector */}
                                <div className={!hasPhoto ? 'opacity-50 pointer-events-none grayscale' : ''}>
                                    <label className="block text-sm font-bold leading-6 text-gray-900 mb-1">Vaccine Name / Brand</label>
                                    <div className="relative">
                                        <select
                                            required
                                            disabled={!selectedVaccineType}
                                            className={`appearance-none block w-full rounded-xl border-0 py-3 pl-4 pr-10 text-gray-900 ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 shadow-sm ${!selectedVaccineType ? 'bg-gray-100 cursor-not-allowed opacity-75' : ''}`}
                                            value={selectedVaccineId}
                                            onChange={(e) => {
                                                const newVaccineId = e.target.value;
                                                setSelectedVaccineId(newVaccineId);

                                                // Auto calc logic
                                                if (newVaccineId && dateAdministered && pet.birthDate) {
                                                    const vaccine = vaccines.find((v: any) => v.id === newVaccineId);
                                                    if (vaccine) {
                                                        const birth = new Date(pet.birthDate);
                                                        const adminDate = new Date(dateAdministered);
                                                        const ageInWeeks = Math.floor((adminDate.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 7));

                                                        const nextDate = calculateNextVaccineDate(pet.species, vaccine.type, dateAdministered, ageInWeeks);
                                                        setNextDueDate(nextDate);
                                                    }
                                                }
                                            }}
                                        >
                                            <option value="">-- Choose Vaccine --</option>
                                            {vaccinesByType.map((v: any) => (
                                                <option key={v.id} value={v.id}>
                                                    {v.name} ({v.brand})
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                            <i className="fas fa-chevron-down text-xs"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold leading-6 text-gray-900 mb-1">Date of Vaccination</label>
                                    <input
                                        type="date"
                                        required
                                        disabled
                                        className="block w-full rounded-xl border-0 py-3 text-gray-900 ring-1 ring-inset ring-gray-200 bg-gray-50 cursor-not-allowed sm:text-sm sm:leading-6 px-4"
                                        value={dateAdministered}
                                    />

                                </div>

                                <div>
                                    <label className="block text-sm font-bold leading-6 text-gray-900 mb-1">Next Vaccination Due</label>
                                    <input
                                        type="date"
                                        required
                                        min={dateAdministered}
                                        className="block w-full rounded-xl border-0 py-3 text-gray-900 ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-4 shadow-sm"
                                        value={nextDueDate}
                                        onChange={(e) => setNextDueDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            {stampError && (
                                <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100 flex items-center gap-2">
                                    <i className="fas fa-exclamation-circle"></i> {stampError.message}
                                </div>
                            )}

                            <div className="pt-4 flex gap-4">
                                <button
                                    type="submit"
                                    disabled={stamping}
                                    className="flex-1 rounded-xl bg-indigo-600 px-3.5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all transform active:scale-95"
                                >
                                    {stamping ? <span className="flex items-center justify-center gap-2"><i className="fas fa-spinner fa-spin"></i> Stamping...</span> : <span className="flex items-center justify-center gap-2"><i className="fas fa-check-circle"></i> Confirm & Stamp</span>}
                                </button>
                                <Link
                                    href="/vet/dashboard"
                                    className="flex-none rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-200 hover:bg-gray-50 transition-all flex items-center"
                                >
                                    Cancel
                                </Link>
                            </div>
                        </form>
                    </div>

                    {/* Vaccine Details Modal (Vet Theme) */}
                    {selectedVaccineRecord && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5 backdrop-blur-md" onClick={() => setSelectedVaccineRecord(null)}>
                            <div className="bg-white w-full max-w-lg rounded-[24px] overflow-hidden shadow-2xl animate-pop-in" onClick={e => e.stopPropagation()}>
                                <div className="bg-[#667EEA] p-5 text-white flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-xl">Vaccine Details</h3>
                                        <p className="text-indigo-100 text-xs mt-1">
                                            {selectedVaccineRecord.isVerified ?
                                                <span className="flex items-center gap-1"><i className="fas fa-check-circle"></i> {selectedVaccineRecord.vet?.clinic?.name || selectedVaccineRecord.clinic?.name || 'Verified Clinic'}</span> :
                                                <span className="flex items-center gap-1"><i className="fas fa-user"></i> Owner Upload</span>
                                            }
                                        </p>
                                    </div>
                                    <button onClick={() => setSelectedVaccineRecord(null)} className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-full hover:bg-white/30 transition-colors">✕</button>
                                </div>

                                <div className="p-6 relative overflow-y-auto max-h-[80vh]">
                                    {selectedVaccineRecord.isVerified && (
                                        <div className="absolute top-10 right-10 opacity-10 pointer-events-none z-0 -rotate-[15deg]">
                                            <img src="/logo.png" className="w-64 h-64" alt="Verified Watermark" />
                                        </div>
                                    )}

                                    <div className="relative z-10 space-y-6">
                                        {/* Header Info */}
                                        <div className="text-center">
                                            <h2 className="text-2xl font-bold text-gray-800">{selectedVaccineRecord.vaccine.name}</h2>
                                            <p className="text-gray-500 font-medium">{selectedVaccineRecord.vaccine.brand}</p>
                                            <div className="flex justify-center gap-2 mt-2">
                                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wide">
                                                    {selectedVaccineRecord.vaccine.type}
                                                </span>
                                                {selectedVaccineRecord.vaccine.typeTH && (
                                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                                                        {selectedVaccineRecord.vaccine.typeTH}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Proof Image */}
                                        {selectedVaccineRecord.stickerImage ? (
                                            <div className="bg-gray-50 p-2 rounded-2xl border border-gray-100">
                                                <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide ml-1">Evidence / Sticker</p>
                                                <div className="rounded-xl overflow-hidden shadow-sm aspect-video bg-white flex items-center justify-center">
                                                    <img
                                                        src={selectedVaccineRecord.stickerImage}
                                                        className="w-full h-full object-contain"
                                                        alt="Sticker Proof"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-200 text-center">
                                                <i className="fas fa-image text-gray-300 text-3xl mb-2"></i>
                                                <p className="text-gray-400 text-sm">No image proof available</p>
                                            </div>
                                        )}

                                        {/* Details Grid */}
                                        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                                            <div className="space-y-4 text-sm">
                                                {selectedVaccineRecord.lotNumber && (
                                                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                                                        <span className="text-gray-500">Lot Number</span>
                                                        <span className="font-mono font-bold text-gray-800 bg-white px-2 py-1 rounded border border-gray-200">
                                                            {selectedVaccineRecord.lotNumber}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                                                    <span className="text-gray-500">Date Administered</span>
                                                    <span className="font-bold text-gray-800">{new Date(selectedVaccineRecord.dateAdministered).toLocaleDateString("en-GB", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                                </div>

                                                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                                                    <span className="text-gray-500">Next Due Date</span>
                                                    <div className="text-right">
                                                        <div className="font-bold text-[#F6A6A6]">
                                                            {selectedVaccineRecord.nextDueDate ? new Date(selectedVaccineRecord.nextDueDate).toLocaleDateString("en-GB", {
                                                                day: 'numeric', month: 'long', year: 'numeric'
                                                            }) : "-"}
                                                        </div>
                                                        {getDaysLeft(selectedVaccineRecord.nextDueDate) && (
                                                            <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold mt-1 ${getDaysLeft(selectedVaccineRecord.nextDueDate)?.color}`}>
                                                                <i className="fas fa-clock text-[9px]"></i> {getDaysLeft(selectedVaccineRecord.nextDueDate)?.days} days left
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center pt-1">
                                                    <span className="text-gray-500">Source</span>
                                                    <span className="font-bold text-indigo-600">
                                                        {selectedVaccineRecord.isVerified
                                                            ? `By ${selectedVaccineRecord.clinic?.name || selectedVaccineRecord.vet?.clinic?.name || 'Verified Clinic'}`
                                                            : "By Owner Upload"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
