"use client";

import { gql, useQuery, useMutation } from "@apollo/client";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Nunito } from "next/font/google";

const nunito = Nunito({ subsets: ["latin"], weight: ["400", "600", "700", "800"] });

const GET_PROFILE_QUERY = gql`
  query GetProfile {
    whoAmI {
      id
      email
      fullName
      image
      address
      phoneNumber
    }
  }
`;

const UPDATE_USER_MUTATION = gql`
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(updateUserInput: $input) {
      id
      fullName
      image
      address
      phoneNumber
    }
  }
`;

export default function AccountPage() {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "",
        address: "",
        phoneNumber: "",
        image: ""
    });
    const [uploading, setUploading] = useState(false);

    // Queries
    const { data, loading, error, refetch } = useQuery(GET_PROFILE_QUERY, {
        onCompleted: (data) => {
            if (data?.whoAmI) {
                setFormData({
                    fullName: data.whoAmI.fullName || "",
                    address: data.whoAmI.address || "",
                    phoneNumber: data.whoAmI.phoneNumber || "",
                    image: data.whoAmI.image || ""
                });
            }
        }
    });

    const [updateUser, { loading: saving }] = useMutation(UPDATE_USER_MUTATION);

    useEffect(() => {
        const token = Cookies.get("token");
        if (!token) router.push("/auth/login");
    }, [router]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);

        setUploading(true);
        try {
            const token = Cookies.get("token");
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/uploads`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: uploadFormData,
            });

            if (!response.ok) {
                throw new Error("Upload failed");
            }
            const data = await response.json();
            setFormData(prev => ({ ...prev, image: data.url }));
        } catch (error) {
            console.error("Upload error:", error);
            alert("Failed to upload profile image");
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateUser({
                variables: {
                    input: {
                        image: formData.image,
                        address: formData.address,
                        phoneNumber: formData.phoneNumber
                    }
                }
            });
            setIsEditing(false);
            refetch();
            alert("Profile updated successfully!");
        } catch (err: any) {
            alert("Failed to update profile: " + err.message);
        }
    };

    const handleLogout = () => {
        Cookies.remove("token");
        router.push("/auth/login");
    };

    if (loading) return <div className="p-10 text-center font-bold text-gray-400">Loading profile...</div>;
    if (error) return <div className="p-10 text-center text-red-500">Error: {error.message}</div>;

    const user = data?.whoAmI;

    return (
        <div className={`min-h-screen bg-[#FFF9F4] ${nunito.className} p-4 md:p-8 flex items-center justify-center`}>
            {/* Font Awesome CDN */}
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

            <div className="w-full max-w-md mx-auto bg-white rounded-[24px] shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden">
                <div className="bg-white px-6 py-4 flex items-center gap-3 border-b border-gray-100 relative">
                    <Link href="/owner/dashboard" className="text-[#4A5568] hover:text-[#8AD6C6] transition-colors relative z-10">
                        <i className="fas fa-arrow-left text-lg"></i>
                    </Link>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <h1 className="text-xl font-bold text-[#4A5568]">My Account</h1>
                    </div>
                    <div className="flex-1"></div>
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`text-sm font-bold px-3 py-1 rounded-full transition-colors relative z-10 ${isEditing ? 'text-[#8AD6C6] bg-[#E6FFFA]' : 'text-gray-400 hover:text-[#8AD6C6]'}`}
                    >
                        {isEditing ? "Cancel" : "Edit"}
                    </button>
                </div>

                <div className="p-6">
                    <div className="flex flex-col items-center mb-6">
                        <div className="relative group">
                            {formData.image ? (
                                <img src={formData.image} alt="Profile" className="w-24 h-24 rounded-full object-cover border-[4px] border-[#8AD6C6] shadow-md" />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-[#E6FFFA] flex items-center justify-center text-[#8AD6C6] text-3xl font-bold border-[4px] border-[#8AD6C6]">
                                    {user?.fullName?.charAt(0) || "U"}
                                </div>
                            )}
                            {isEditing && (
                                <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer border border-gray-100 hover:bg-gray-50 transition-colors">
                                    <i className="fas fa-camera text-[#8AD6C6]"></i>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                </label>
                            )}
                        </div>
                        {uploading && <p className="text-xs text-[#8AD6C6] mt-2 font-bold animate-pulse">Uploading...</p>}

                        {!isEditing && (
                            <div className="mt-4 text-center">
                                <h2 className="text-xl font-bold text-[#4A5568]">{user?.fullName}</h2>
                                <p className="text-gray-400 text-sm">{user?.email}</p>
                            </div>
                        )}
                    </div>

                    {isEditing ? (
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-[#4A5568] mb-2">Phone Number</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <i className="fas fa-phone"></i>
                                    </div>
                                    <input
                                        type="tel"
                                        className="block w-full rounded-[16px] border border-gray-200 py-3 pl-10 pr-4 text-gray-700 focus:border-[#8AD6C6] focus:ring focus:ring-[#8AD6C6]/20 outline-none transition-all placeholder:text-gray-300 bg-gray-50/50"
                                        value={formData.phoneNumber}
                                        onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                                        placeholder="081-234-5678"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-[#4A5568] mb-2">Address</label>
                                <div className="relative">
                                    <div className="absolute top-3 left-3 pointer-events-none text-gray-400">
                                        <i className="fas fa-map-marker-alt"></i>
                                    </div>
                                    <textarea
                                        className="block w-full rounded-[16px] border border-gray-200 py-3 pl-10 pr-4 text-gray-700 focus:border-[#8AD6C6] focus:ring focus:ring-[#8AD6C6]/20 outline-none transition-all placeholder:text-gray-300 bg-gray-50/50 text-sm"
                                        rows={3}
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Enter your address..."
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-[#8AD6C6] text-white py-3 px-4 rounded-[16px] font-bold hover:bg-[#76BDB0] transition-colors shadow-[0_8px_20px_rgba(138,214,198,0.4)] mt-4"
                            >
                                {saving ? <i className="fas fa-spinner fa-spin"></i> : "Save Changes"}
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-start gap-4 p-4 bg-[#FFF9F4] rounded-[16px] border border-[#ffecd9]">
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#8AD6C6] shadow-sm">
                                    <i className="fas fa-phone"></i>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Phone</p>
                                    <p className="font-bold text-[#4A5568]">{user?.phoneNumber || "-"}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 bg-[#FFF9F4] rounded-[16px] border border-[#ffecd9]">
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#8AD6C6] shadow-sm">
                                    <i className="fas fa-map-marker-alt"></i>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Address</p>
                                    <p className="font-bold text-[#4A5568]">{user?.address || "-"}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-8 border-t border-gray-100 pt-6">
                        <button
                            onClick={handleLogout}
                            className="w-full text-red-500 bg-red-50 py-3 rounded-[16px] font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                        >
                            <i className="fas fa-sign-out-alt"></i> Log Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
