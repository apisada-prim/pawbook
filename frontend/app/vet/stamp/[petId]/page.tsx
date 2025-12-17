"use client";

import { gql, useQuery, useMutation } from "@apollo/client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import Link from "next/link";
import { calculateNextVaccineDate, calculateAge } from "../../../utils/dateUtils";

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
            }
        vet {
            user {
                    fullName
                }
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
    const [selectedVaccineId, setSelectedVaccineId] = useState("");
    // Default to today
    const [dateAdministered] = useState(new Date().toISOString().split('T')[0]);
    const [nextDueDate, setNextDueDate] = useState("");

    // UI State
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

    const { data, loading, error } = useQuery(GET_DATA_QUERY, {
        variables: { petId },
        skip: !petId
    });

    const [stamp, { loading: stamping, error: stampError }] = useMutation(STAMP_MUTATION);

    useEffect(() => {
        const token = Cookies.get("token");
        if (!token) router.push("/auth/login");
    }, [router]);

    // Handle Loading/Error
    if (loading) return <div className="p-8 text-center min-h-screen bg-gray-50 flex items-center justify-center">Loading pet data...</div>;
    if (error) return <div className="p-8 text-center text-red-500 min-h-screen bg-gray-50 flex items-center justify-center">Error: {error.message}</div>;
    if (!data?.pet) return <div className="p-8 text-center min-h-screen bg-gray-50 flex items-center justify-center">Pet not found</div>;

    const { pet, vaccines, me } = data;
    const vetName = me?.fullName || "Unknown Vet";
    const clinicName = me?.vetProfile?.clinic?.name || "Independent / Unknown Clinic (Not Linked)";

    // Filter vaccines by species
    const availableVaccines = vaccines.filter((v: any) => v.species === pet.species);

    // Sort Vaccination History (Newest First)
    const sortedHistory = pet.vaccinations ? [...pet.vaccinations].sort((a: any, b: any) => new Date(b.dateAdministered).getTime() - new Date(a.dateAdministered).getTime()) : [];

    const handleStamp = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await stamp({
                variables: {
                    input: {
                        petId: pet.id,
                        vaccineMasterId: selectedVaccineId,
                        dateAdministered: new Date(dateAdministered).toISOString(),
                        nextDueDate: nextDueDate ? new Date(nextDueDate).toISOString() : undefined
                    }
                }
            });
            alert("Vaccine Stamped Successfully!");
            router.push("/vet/dashboard");
        } catch (err) {
            console.error(err);
        }
    };

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
                    </div>

                    {/* Vaccination History Section - NEW LOGIC */}
                    <div className="mb-10">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                                <i className="fas fa-history text-gray-400"></i> Vaccination History
                            </h3>
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{sortedHistory.length} Records</span>
                        </div>

                        <div className="space-y-3">
                            {sortedHistory.length > 0 ? (
                                sortedHistory.map((record: any, index: number) => (
                                    <div
                                        key={record.id}
                                        className={`bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group 
                                            ${index > 0 && !isHistoryExpanded ? 'hidden md:block' : 'block'}`}
                                    >
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-teal-400 to-teal-600"></div>
                                        <div className="flex justify-between items-start pl-3">
                                            <div>
                                                <div className="font-bold text-gray-800 text-lg">{record.vaccine.name}</div>
                                                <div className="text-xs text-gray-500 mt-1 flex gap-2 items-center">
                                                    <span className="bg-teal-50 text-teal-700 font-bold px-2 py-0.5 rounded border border-teal-100 uppercase text-[10px]">{record.vaccine.type}</span>
                                                    <span className="text-gray-400">|</span>
                                                    <span>{record.vaccine.brand}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-indigo-600 font-mono bg-indigo-50 px-2 py-1 rounded">{new Date(record.dateAdministered).toLocaleDateString()}</div>
                                                <div className="text-[10px] text-gray-400 mt-1">
                                                    By: {record.vet?.user?.fullName || 'External'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                    <i className="fas fa-syringe text-gray-300 text-3xl mb-2"></i>
                                    <p className="text-gray-400 text-sm">No recent vaccinations recorded.</p>
                                </div>
                            )}

                            {/* Mobile Expand Button */}
                            {sortedHistory.length > 1 && (
                                <button
                                    onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                                    className="md:hidden w-full py-3 text-sm text-indigo-600 font-bold bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
                                >
                                    {isHistoryExpanded ? (
                                        <>Show Less <i className="fas fa-chevron-up"></i></>
                                    ) : (
                                        <>View All History ({sortedHistory.length}) <i className="fas fa-chevron-down"></i></>
                                    )}
                                </button>
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
                        <form onSubmit={handleStamp} className="space-y-6 bg-white rounded-xl">
                            <div>
                                <label className="block text-sm font-bold leading-6 text-gray-900 mb-1">Select Vaccine</label>
                                <div className="relative">
                                    <select
                                        required
                                        className="appearance-none block w-full rounded-xl border-0 py-3 pl-4 pr-10 text-gray-900 ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 shadow-sm"
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
                                        {availableVaccines.map((v: any) => (
                                            <option key={v.id} value={v.id}>
                                                {v.name} ({v.brand}) - {v.type}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                        <i className="fas fa-chevron-down text-xs"></i>
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
                                    <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1"><i className="fas fa-lock text-gray-400"></i> Locked to current date for security</p>
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
                                    <p className="text-[10px] text-orange-500 mt-1"><i className="fas fa-magic"></i> Auto-calculated. Please verify.</p>
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
                </div>
            </div>
        </div>
    );
}
