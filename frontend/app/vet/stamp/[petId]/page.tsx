"use client";

import { gql, useQuery, useMutation } from "@apollo/client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import Link from "next/link";

const GET_DATA_QUERY = gql`
  query GetData($petId: String!) {
    pet: findOne(id: $petId) {
      id
      name
      species
      ownerId
      chronicDiseases
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

    const handleStamp = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await stamp({
                variables: {
                    input: {
                        petId: pet.id,
                        vaccineMasterId: selectedVaccineId,
                        dateAdministered: new Date(dateAdministered).toISOString()
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
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-indigo-600 px-6 py-4">
                    <h1 className="text-xl font-bold text-white">Digital Vaccination Stamp</h1>
                    <p className="text-indigo-100 text-sm">Validating for {pet.name}</p>
                </div>

                <div className="p-8">
                    <div className="mb-8 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                        <h3 className="text-sm font-semibold text-indigo-900 uppercase tracking-wide mb-2">Pet Information</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500">Name:</span>
                                <span className="ml-2 font-medium text-gray-900">{pet.name}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Species:</span>
                                <span className="ml-2 font-medium text-gray-900">{pet.species}</span>
                            </div>
                            <div className="col-span-2">
                                <span className="text-gray-500">ID:</span>
                                <span className="ml-2 font-mono text-gray-600 text-xs">{pet.id}</span>
                            </div>
                        </div>
                    </div>
                    {pet.chronicDiseases && (
                        <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-md flex items-start gap-3">
                            <span className="text-xl">⚠️</span>
                            <div>
                                <p className="text-red-800 font-bold text-sm uppercase">Chronic Diseases (โรคประจำตัว)</p>
                                <p className="text-red-900 font-medium">{pet.chronicDiseases}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* VET INFO SECTION */}
            <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Veterinarian Information</h3>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500">Veterinarian Name</label>
                        <input
                            type="text"
                            value={vetName}
                            disabled
                            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-600 cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500">Clinic / Hospital</label>
                        <input
                            type="text"
                            value={clinicName}
                            disabled
                            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-600 cursor-not-allowed"
                        />
                    </div>
                </div>
            </div>

            <form onSubmit={handleStamp} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium leading-6 text-gray-900">Select Vaccine</label>
                    <select
                        required
                        className="mt-2 block w-full rounded-md border-0 py-2.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                        value={selectedVaccineId}
                        onChange={(e) => setSelectedVaccineId(e.target.value)}
                    >
                        <option value="">-- Choose Vaccine --</option>
                        {availableVaccines.map((v: any) => (
                            <option key={v.id} value={v.id}>
                                {v.name} ({v.brand}) - {v.type}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium leading-6 text-gray-900">Date Administered</label>
                    <input
                        type="date"
                        required
                        disabled
                        className="mt-2 block w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 bg-gray-100 cursor-not-allowed sm:text-sm sm:leading-6 px-3"
                        value={dateAdministered}
                    />
                    <p className="text-xs text-gray-500 mt-1">Date is automatically set to today for verification integrity.</p>
                </div>

                {stampError && <p className="text-red-500 text-sm">{stampError.message}</p>}

                <div className="pt-4 flex gap-4">
                    <button
                        type="submit"
                        disabled={stamping}
                        className="flex-1 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        {stamping ? "Stamping..." : "Confirm & Stamp Record"}
                    </button>
                    <Link href="/vet/dashboard" className="flex-none rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                        Cancel
                    </Link>
                </div>
            </form>
        </div>

    );
}
