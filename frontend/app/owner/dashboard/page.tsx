"use client";

import { gql, useQuery } from "@apollo/client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { Nunito } from "next/font/google";

const nunito = Nunito({ subsets: ["latin"], weight: ["400", "600", "700", "800"] });

const MY_PETS_QUERY = gql`
  query MyPets {
    myPets {
      id
      name
      species
      breed
      gender
      birthDate
      image
    }
  }
`;

function calculateAge(birthDate: string) {
    const today = new Date();
    const birth = new Date(birthDate);

    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();

    if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
        years--;
        months += 12;
    }

    if (today.getDate() < birth.getDate()) {
        months--;
    }

    if (months < 0) {
        months += 12;
        years--; // Adjust logic for safe calculation, though diff in years is usually enough
    }

    // Simplified robust logic:
    const m = new Date(today.valueOf() - birth.valueOf());
    const yearDiff = m.getUTCFullYear() - 1970;
    // However, exact months is tricky with simple timestamp subtraction due to days.
    // Let's stick to the strict Y M calculation:

    let y = today.getFullYear() - birth.getFullYear();
    let mth = today.getMonth() - birth.getMonth();
    if (today.getDate() < birth.getDate()) {
        mth--;
    }
    if (mth < 0) {
        y--;
        mth += 12;
    }
    return `${y}Y ${mth}M`;
}

export default function OwnerDashboard() {
    const router = useRouter();
    const { data, loading, error } = useQuery(MY_PETS_QUERY);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const token = Cookies.get("token");
        if (!token) {
            router.push("/auth/login");
        }
    }, [router]);

    const { data: userData } = useQuery(gql`
        query WhoAmI {
            whoAmI {
                id
                fullName
                image
            }
        }
    `);

    if (!mounted) return null;
    if (loading) return <div className="p-8 text-center">Loading pets...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error.message}</div>;

    return (
        <div className={`min-h-screen bg-[#FFF9F4] ${nunito.className} pb-20`}>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

            <div className="max-w-7xl mx-auto p-5 md:p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 md:mb-8 bg-white/60 backdrop-blur-md p-4 md:rounded-[24px] rounded-b-[24px] sticky top-0 z-50 shadow-sm -mx-5 md:mx-0 px-9 md:px-4">
                    <h1 className="text-2xl md:text-3xl font-bold text-[#4A5568] flex items-center gap-2">
                        <i className="fas fa-paw text-[#8AD6C6]"></i> My Pets
                    </h1>
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Add New Pet Card - Placed First for convenience on mobile */}
                    <Link href="/owner/add-pet">
                        <div className="h-auto md:h-full md:min-h-[220px] bg-white border-2 border-dashed border-[#8AD6C6] rounded-[24px] p-4 md:p-6 flex flex-row md:flex-col items-center justify-start md:justify-center gap-4 text-[#8AD6C6] hover:bg-[#F0FDF9] transition-all cursor-pointer group shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_rgba(138,214,198,0.3)]">
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-[#E6FFFA] rounded-full flex items-center justify-center md:mb-3 group-hover:scale-110 transition-transform flex-shrink-0">
                                <i className="fas fa-plus text-xl md:text-2xl"></i>
                            </div>
                            <span className="font-bold text-lg">Add New Pet</span>
                        </div>
                    </Link>

                    {data?.myPets.map((pet: any) => (
                        <Link href={`/owner/pet/${pet.id}`} key={pet.id} className="contents">
                            <div className="bg-white p-6 rounded-[24px] shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.05)] transition-all border border-gray-100 flex flex-col relative overflow-hidden group cursor-pointer">
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
                                        <span className="capitalize">{pet.gender.toLowerCase()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <i className="fas fa-birthday-cake w-5 text-center text-[#8AD6C6]"></i>
                                        <span>
                                            {new Date(pet.birthDate).toLocaleDateString()}
                                            <span className="text-[#4A5568] ml-2">({calculateAge(pet.birthDate)})</span>
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-gray-50 flex justify-end z-10">
                                    <span className="text-[#8AD6C6] group-hover:text-[#76BDB0] text-sm font-bold flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                        View Details <i className="fas fa-arrow-right"></i>
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
