"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function VetDashboard() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const token = Cookies.get("token");
        if (!token) {
            router.push("/auth/login");
        }
    }, [router]);

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Vet Dashboard</h1>
                    <button
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-500"
                        onClick={() => {
                            Cookies.remove("token");
                            router.push("/auth/login");
                        }}
                    >
                        Logout
                    </button>
                </div>

                <div className="bg-white p-12 rounded-xl shadow-sm text-center">
                    <p className="text-xl text-gray-600 mb-6">Ready to vaccinate?</p>
                    <Link href="/vet/scanner" className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-md hover:bg-indigo-500 font-medium text-lg shadow-md transition-all hover:shadow-lg">
                        📷 Open Scanner
                    </Link>
                </div>
            </div>
        </div>
    );
}
