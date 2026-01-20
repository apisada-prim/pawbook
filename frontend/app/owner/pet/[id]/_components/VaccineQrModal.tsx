"use client";

import { useEffect, useState } from "react";
import { gql, useMutation, useQuery } from "@apollo/client";
import QRCode from "react-qr-code";

const GENERATE_VACCINE_QR = gql`
    mutation GenerateVaccineQr($petId: String!) {
        generateVaccineQr(petId: $petId) {
            token
            expiresAt
        }
    }
`;

const CHECK_QR_STATUS = gql`
    query CheckQrStatus($token: String!) {
        checkVaccineQrStatus(token: $token)
    }
`;

interface VaccineQrModalProps {
    petId: string;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function VaccineQrModal({ petId, onClose, onSuccess }: VaccineQrModalProps) {
    const [generateQr, { data, loading, error }] = useMutation(GENERATE_VACCINE_QR);
    const [timeLeft, setTimeLeft] = useState<string>("");

    // Polling Status
    const token = data?.generateVaccineQr?.token;

    const { data: statusData, startPolling, stopPolling } = useQuery(CHECK_QR_STATUS, {
        variables: { token },
        skip: !token,
        pollInterval: 2000,
        fetchPolicy: 'network-only'
    });

    useEffect(() => {
        generateQr({ variables: { petId } });
    }, []);

    // Ensure polling starts when token is available
    useEffect(() => {
        if (token) {
            startPolling(2000);
        }
    }, [token, startPolling]);

    useEffect(() => {
        if (!data?.generateVaccineQr?.expiresAt) return;

        const interval = setInterval(() => {
            const expires = new Date(data.generateVaccineQr.expiresAt).getTime();
            const now = new Date().getTime();
            const distance = expires - now;

            if (distance < 0) {
                setTimeLeft("EXPIRED");
                clearInterval(interval);
            } else {
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                setTimeLeft(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [data]);

    // Handle Status Changes
    useEffect(() => {
        console.log("[VaccineQrModal] Polling Status Data:", statusData);
        if (statusData?.checkVaccineQrStatus === 'USED') {
            stopPolling();
            // Optional: Show success state briefly before closing, or just close
            // For now, let's just close immediately or after a split second
            if (onSuccess) onSuccess();
            onClose();
        } else if (statusData?.checkVaccineQrStatus === 'EXPIRED') {
            setTimeLeft("EXPIRED");
            stopPolling();
        }
    }, [statusData, stopPolling, onClose, onSuccess]);

    // Stop polling if token changes or unmount
    useEffect(() => {
        return () => stopPolling();
    }, [token]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-[24px] p-6 shadow-xl relative animate-scale-up">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <i className="fas fa-times text-xl"></i>
                </button>

                <div className="text-center">
                    <h3 className="text-xl font-bold text-[#4A5568] mb-2">Digital Vaccine QR</h3>
                    <p className="text-sm text-gray-500 mb-6">Show this to your veterinarian to verify or add records.</p>

                    {loading && (
                        <div className="h-64 flex items-center justify-center">
                            <i className="fas fa-spinner fa-spin text-3xl text-[#8AD6C6]"></i>
                        </div>
                    )}

                    {error && (
                        <div className="h-64 flex flex-col items-center justify-center text-red-500">
                            <i className="fas fa-exclamation-triangle text-3xl mb-2"></i>
                            <p>Failed to generate QR</p>
                            <button onClick={() => generateQr({ variables: { petId } })} className="mt-4 text-sm underline">Retry</button>
                        </div>
                    )}

                    {data && (
                        <>
                            <div className="bg-white p-4 rounded-xl border-2 border-dashed border-gray-200 inline-block mb-4">
                                <QRCode
                                    value={data.generateVaccineQr.token}
                                    size={200}
                                    fgColor="#4A5568"
                                />
                            </div>

                            <div className={`text-lg font-mono font-bold ${timeLeft === "EXPIRED" ? "text-red-500" : "text-[#8AD6C6]"}`}>
                                {timeLeft === "EXPIRED" ? "Code Expired" : `Valid for ${timeLeft}`}
                            </div>

                            {timeLeft === "EXPIRED" && (
                                <button
                                    onClick={() => generateQr({ variables: { petId } })}
                                    className="mt-4 px-4 py-2 bg-gray-100 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-200"
                                >
                                    <i className="fas fa-redo mr-2"></i> Regenerate
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
