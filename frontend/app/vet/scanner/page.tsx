"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Scanner } from '@yudiel/react-qr-scanner';

export default function VetScannerPage() {
    const [petId, setPetId] = useState("");
    const [isScanning, setIsScanning] = useState(true);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleScan = (result: any) => {
        if (result && result.length > 0) {
            const rawValue = result[0].rawValue;
            if (rawValue.length > 5) {
                router.push(`/vet/stamp/${rawValue}`);
            }
        }
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (petId) {
            router.push(`/vet/stamp/${petId}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-xl font-bold text-gray-900">
                        {isScanning ? "Scan QR Code" : "Enter Pet ID"}
                    </h1>
                    <button
                        onClick={() => setIsScanning(!isScanning)}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                        {isScanning ? "Switch to Manual Type" : "Switch to Camera"}
                    </button>
                </div>

                {isScanning ? (
                    <div className="overflow-hidden rounded-lg bg-black relative aspect-square">
                        <Scanner
                            onScan={handleScan}
                            onError={(error: any) => setError(error?.message || "Camera error")}
                            components={{
                                onOff: true,
                                torch: true,
                            }}
                        />
                        <div className="absolute inset-0 border-2 border-indigo-500 opacity-50 pointer-events-none"></div>
                        <p className="text-center text-xs text-white mt-2 absolute bottom-2 w-full">
                            Point camera at Pet QR Code
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleManualSubmit} className="space-y-4 py-8">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pet ID / UUID</label>
                            <input
                                type="text"
                                placeholder="e.g. 550e8400-e29b-..."
                                className="block w-full rounded-md border-0 py-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-4"
                                value={petId}
                                onChange={(e) => setPetId(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full rounded-md bg-indigo-600 px-3.5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                            Navigate to Pet Profile
                        </button>
                    </form>
                )}

                {error && <p className="text-red-500 text-xs mt-4 text-center">Error: {error}</p>}

                <div className="mt-6 text-center">
                    <Link href="/vet/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
                        Cancel & Return to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
