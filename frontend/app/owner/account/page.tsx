"use client";

import { gql, useQuery, useMutation, useApolloClient } from "@apollo/client";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Nunito } from "next/font/google";

import { cropToSquare } from "../../utils/imageUtils";

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
      defaultFamilyId
    }
    myFamily {
      id
      name
      ownerId
      updatedAt
      members {
        id
        fullName
        email
        image
      }
    }
     myFamilies {
      id
      name
      ownerId
      owner {
        fullName
      }
    }
  }
`;

const UPDATE_USER_MUTATION = gql`
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(updateUserInput: $input) {
      id
      fullName
      email
      image
      address
      phoneNumber
      defaultFamilyId
    }
  }
`;

const INVITE_MEMBER = gql`
  mutation InviteMember($email: String!) {
    inviteMember(email: $email) {
      id
      members {
        id
        email
      }
    }
  }
`;

const REMOVE_MEMBER = gql`
  mutation RemoveMember($memberId: String!) {
    removeMember(memberId: $memberId) {
      id
      members {
        id
      }
    }
  }
`;

const LEAVE_FAMILY = gql`
  mutation LeaveFamily($familyId: String!) {
    leaveFamily(familyId: $familyId) {
       id
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

const CLAIM_PET = gql`
  mutation ClaimPet($code: String!) {
    claimPet(code: $code) {
      id
      name
    }
  }
`;

export default function AccountPage() {
    const router = useRouter();
    const client = useApolloClient();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "",
        address: "",
        phoneNumber: "",
        image: "",
        defaultFamilyId: ""
    });
    const [uploading, setUploading] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");

    // Rename & Unpack states
    const [isRenaming, setIsRenaming] = useState(false);
    const [newFamilyName, setNewFamilyName] = useState("");
    const [claimCode, setClaimCode] = useState("");

    // Queries
    const { data, loading, error, refetch } = useQuery(GET_PROFILE_QUERY);
    const myFamilies = data?.myFamilies || [];
    const myFamily = data?.myFamily;
    const user = data?.whoAmI;

    useEffect(() => {
        if (data?.whoAmI) {
            setFormData({
                fullName: data.whoAmI.fullName || "",
                address: data.whoAmI.address || "",
                phoneNumber: data.whoAmI.phoneNumber || "",
                image: data.whoAmI.image || "",
                defaultFamilyId: data.whoAmI.defaultFamilyId || ""
            });
        }
    }, [data]);

    const [updateUser, { loading: saving }] = useMutation(UPDATE_USER_MUTATION);
    const [inviteMember] = useMutation(INVITE_MEMBER);
    const [removeMember] = useMutation(REMOVE_MEMBER);
    const [leaveFamily] = useMutation(LEAVE_FAMILY);
    const [updateFamilyName] = useMutation(UPDATE_FAMILY_NAME);
    const [claimPet] = useMutation(CLAIM_PET);

    useEffect(() => {
        const token = Cookies.get("token");
        if (!token) router.push("/auth/login");
    }, [router]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const originalFile = e.target.files[0];

        setUploading(true);
        try {
            const file = await cropToSquare(originalFile);
            const uploadFormData = new FormData();
            uploadFormData.append("file", file);
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
        if (formData.fullName.length > 10) {
            alert("Full Name must be 10 characters or less.");
            return;
        }
        try {
            await updateUser({
                variables: {
                    input: {
                        image: formData.image,
                        address: formData.address,
                        phoneNumber: formData.phoneNumber,
                        fullName: formData.fullName
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

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;
        try {
            await inviteMember({ variables: { email: inviteEmail } });
            alert("Member invited successfully!");
            setInviteEmail("");
            refetch();
        } catch (e: any) {
            alert("Error inviting member: " + e.message);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm("Are you sure you want to remove this member?")) return;
        try {
            await removeMember({ variables: { memberId } });
            refetch();
        } catch (e: any) {
            alert("Error removing member: " + e.message);
        }
    };

    const handleLeaveFamily = async (familyId: string) => {
        if (!confirm("Are you sure you want to leave this family?")) return;
        try {
            await leaveFamily({ variables: { familyId } });
            refetch();
        } catch (e: any) {
            alert("Error leaving family: " + e.message);
        }
    };

    const handleRenameFamily = async () => {
        if (!newFamilyName.trim()) return;
        if (newFamilyName.length > 10) {
            alert("Family name must be 10 characters or less.");
            return;
        }
        try {
            await updateFamilyName({ variables: { name: newFamilyName } });
            setIsRenaming(false);
            refetch();
        } catch (e: any) {
            alert("Error renaming family: " + e.message);
        }
    };

    const handleClaimPet = async () => {
        if (!claimCode.trim()) return;
        try {
            await claimPet({ variables: { code: claimCode } });
            alert("Pet claimed successfully! Check your Dashboard.");
            setClaimCode("");
        } catch (e: any) {
            alert("Error claiming pet: " + e.message);
        }
    };

    const handleLogout = async () => {
        try {
            await client.clearStore();
        } catch (e) {
            console.error("Error clearing store on logout:", e);
        }
        Cookies.remove("token");
        router.push("/auth/login");
    };

    if (loading) return <div className="p-10 text-center font-bold text-gray-400">Loading profile...</div>;
    if (error) return <div className="p-10 text-center text-red-500">Error: {error.message}</div>;

    const joinedFamilies = myFamilies.filter((f: any) => f.ownerId !== user?.id) || [];

    return (
        <div className={`min-h-screen bg-[#FFF9F4] ${nunito.className} p-4 md:p-8 flex items-center justify-center`}>
            {/* Font Awesome CDN */}
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

            <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

                {/* Profile Card */}
                <div className="bg-white rounded-[24px] shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden md:col-span-5 lg:col-span-4">
                    <div className="bg-white px-6 py-4 flex items-center gap-3 border-b border-gray-100 relative">
                        <Link href="/owner/dashboard" className="text-[#4A5568] hover:text-[#8AD6C6] transition-colors relative z-10">
                            <i className="fas fa-arrow-left text-lg"></i>
                        </Link>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <h1 className="text-xl font-bold text-[#4A5568]">My Account</h1>
                        </div>
                        <div className="flex-1"></div>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-sm font-bold px-3 py-1 rounded-full bg-[#E6FFFA] text-[#8AD6C6] hover:bg-[#d0fbf2] transition-colors relative z-10"
                        >
                            Edit
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="flex flex-col items-center mb-6">
                            <div className="relative group">
                                {user?.image ? (
                                    <img src={user.image} alt="Profile" className="w-24 h-24 rounded-full object-cover border-[4px] border-[#8AD6C6] shadow-md" />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-[#E6FFFA] flex items-center justify-center text-[#8AD6C6] text-3xl font-bold border-[4px] border-[#8AD6C6]">
                                        {user?.fullName?.charAt(0) || "U"}
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 text-center">
                                <h2 className="text-xl font-bold text-[#4A5568]">{user?.fullName}</h2>
                                <p className="text-gray-400 text-sm">{user?.email}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
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

                        <div className="mt-6">
                            <button
                                onClick={handleLogout}
                                className="w-full text-red-500 bg-red-50 py-3 rounded-[16px] font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                            >
                                <i className="fas fa-sign-out-alt"></i> Log Out
                            </button>
                        </div>
                    </div>
                </div>

                {/* Family Sharing Section */}
                <div className="space-y-6 md:col-span-7 lg:col-span-8">
                    <div className="bg-white rounded-[24px] shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-[#4A5568] mb-4 flex items-center gap-2">
                            <i className="fas fa-users text-[#8AD6C6]"></i> Family & Sharing
                        </h2>

                        {/* My Family Management */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">My Family</h3>
                            </div>

                            {/* Family Name & Rename */}
                            <div className="bg-[#E6FFFA] rounded-[16px] p-4 mb-4 flex items-center justify-between">
                                {isRenaming ? (
                                    <div className="flex gap-2 w-full">
                                        <input
                                            className="flex-1 bg-white border border-[#8AD6C6] rounded px-2 py-1 text-sm font-bold text-gray-900"
                                            value={newFamilyName}
                                            maxLength={10}
                                            onChange={(e) => setNewFamilyName(e.target.value)}
                                            placeholder="Family Name"
                                        />
                                        <button onClick={handleRenameFamily} className="text-[#8AD6C6] hover:scale-110"><i className="fas fa-check"></i></button>
                                        <button onClick={() => setIsRenaming(false)} className="text-red-400 hover:scale-110"><i className="fas fa-times"></i></button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                            <span className="font-bold text-[#4A5568]">{myFamily?.name || "My Pets"}</span>
                                            {formData.defaultFamilyId === myFamily?.id ? (
                                                <span className="text-[10px] bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full font-bold border border-yellow-200 w-fit">
                                                    <i className="fas fa-star mr-1"></i> Default
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => updateUser({ variables: { input: { defaultFamilyId: myFamily?.id } } }).then(() => refetch())}
                                                    className="text-[10px] text-gray-400 hover:text-yellow-500 transition-colors font-bold flex items-center w-fit"
                                                >
                                                    <i className="far fa-star mr-1"></i> Set Default
                                                </button>
                                            )}
                                        </div>
                                        <button onClick={() => { setIsRenaming(true); setNewFamilyName(myFamily?.name || ""); }} className="text-[#8AD6C6] text-sm font-bold hover:underline whitespace-nowrap ml-2">
                                            Rename
                                        </button>
                                    </>
                                )}
                            </div>

                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Members</h3>
                            {/* Invite Form */}
                            <form onSubmit={handleInvite} className="flex gap-2 mb-4">
                                <input
                                    className="flex-1 bg-gray-50 border border-gray-200 rounded-[12px] px-3 py-2 text-sm outline-none focus:border-[#8AD6C6] text-gray-900 placeholder:text-gray-300"
                                    placeholder="Invite by email..."
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                />
                                <button type="submit" className="bg-[#8AD6C6] text-white px-3 py-2 rounded-[12px] font-bold text-sm hover:bg-[#76BDB0]"><i className="fas fa-plus"></i></button>
                            </form>

                            {/* Members List */}
                            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
                                {myFamily?.members?.length === 0 && <div className="col-span-full text-sm text-gray-300 text-center italic">No members yet.</div>}
                                {myFamily?.members?.filter((m: any) => m.id !== user?.id).map((member: any) => (
                                    <div key={member.id} className="flex flex-col items-center group relative">
                                        <div className="relative">
                                            {member.image ? (
                                                <img src={member.image} alt={member.fullName} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-[#E6FFFA] flex items-center justify-center text-[#8AD6C6] font-bold text-lg border-2 border-white shadow-sm">
                                                    {member.fullName.charAt(0)}
                                                </div>
                                            )}

                                            {/* Remove Button (Owner Only) */}
                                            {user?.id === myFamily?.ownerId && member.id !== user.id && (
                                                <button
                                                    onClick={() => handleRemoveMember(member.id)}
                                                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-400 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-sm transition-transform hover:scale-110"
                                                    title="Remove Member"
                                                >
                                                    <i className="fas fa-times"></i>
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-500 mt-1 text-center truncate w-full" title={member.fullName}>
                                            {member.fullName.split(' ')[0]}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Joined Families */}
                        <div className="pt-4 border-t border-gray-100">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Joined Families</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {myFamilies?.filter((f: any) => f.ownerId !== user?.id).map((family: any) => (
                                    <div key={family.id} className="bg-white rounded-[20px] p-5 shadow-sm border border-gray-100 flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-[#4A5568]">{family.name}</h4>
                                            <p className="text-xs text-gray-400">Owner: {family.owner.fullName}</p>
                                        </div>
                                        <div className="flex flex-col gap-2 items-end">
                                            {formData.defaultFamilyId === family.id ? (
                                                <span className="text-[10px] bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full font-bold border border-yellow-200">
                                                    <i className="fas fa-star mr-1"></i> Default
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => updateUser({ variables: { input: { defaultFamilyId: family.id } } }).then(() => refetch())}
                                                    className="text-[10px] text-gray-300 hover:text-yellow-500 transition-colors font-bold"
                                                >
                                                    <i className="far fa-star mr-1"></i> Set Default
                                                </button>
                                            )}
                                            <button
                                                onClick={() => {
                                                    if (confirm(`Are you sure you want to leave ${family.name}?`)) {
                                                        leaveFamily({ variables: { familyId: family.id } })
                                                            .then(() => refetch())
                                                            .catch(err => alert(err.message));
                                                    }
                                                }}
                                                className="text-xs text-red-400 hover:text-red-600 font-bold bg-red-50 px-2 py-1 rounded-lg"
                                            >
                                                Leave
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {(!myFamilies || myFamilies.filter((f: any) => f.ownerId !== user?.id).length === 0) && (
                                    <p className="text-gray-400 text-sm col-span-full text-center py-4 bg-gray-50 rounded-[20px] border border-dashed border-gray-200">
                                        You haven't joined any other families yet.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Unpack / Claim Pet */}
                    <div className="bg-white rounded-[24px] shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-[#4A5568] mb-4 flex items-center gap-2">
                            <i className="fas fa-box-open text-[#8AD6C6]"></i> Unpack (Claim Pet)
                        </h2>
                        <div className="flex gap-2">
                            <input
                                className="flex-1 bg-gray-50 border border-gray-200 rounded-[12px] px-3 py-2 text-sm outline-none focus:border-[#8AD6C6] font-mono text-center uppercase text-gray-900 placeholder:text-gray-300"
                                placeholder="ENTER-CODE"
                                value={claimCode}
                                onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
                            />
                            <button
                                onClick={handleClaimPet}
                                className="bg-[#8AD6C6] text-white px-4 py-2 rounded-[12px] font-bold text-sm hover:bg-[#76BDB0]"
                            >
                                Claim
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* EDIT MODAL */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#FFF9F4]">
                            <h2 className="text-lg font-bold text-[#4A5568]">Edit Profile</h2>
                            <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600">
                                <i className="fas fa-times text-xl"></i>
                            </button>
                        </div>

                        <div className="p-6 max-h-[80vh] overflow-y-auto">
                            <form onSubmit={handleSave} className="space-y-5">
                                {/* Image Upload */}
                                <div className="flex justify-center mb-6">
                                    <div className="relative group">
                                        {formData.image ? (
                                            <img src={formData.image} alt="Profile" className="w-24 h-24 rounded-full object-cover border-[4px] border-[#8AD6C6] shadow-md" />
                                        ) : (
                                            <div className="w-24 h-24 rounded-full bg-[#E6FFFA] flex items-center justify-center text-[#8AD6C6] text-3xl font-bold border-[4px] border-[#8AD6C6]">
                                                {user?.fullName?.charAt(0) || "U"}
                                            </div>
                                        )}
                                        <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer border border-gray-100 hover:bg-gray-50 transition-colors">
                                            <i className="fas fa-camera text-[#8AD6C6]"></i>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                        </label>
                                    </div>
                                </div>
                                {uploading && <p className="text-xs text-center text-[#8AD6C6] font-bold animate-pulse -mt-4 mb-4">Uploading...</p>}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Full Name */}
                                    <div>
                                        <label className="block text-sm font-bold text-[#4A5568] mb-2">Full Name</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                                <i className="fas fa-user"></i>
                                            </div>
                                            <input
                                                type="text"
                                                className="block w-full rounded-[16px] border border-gray-200 py-3 pl-10 pr-4 text-gray-900 focus:border-[#8AD6C6] focus:ring focus:ring-[#8AD6C6]/20 outline-none transition-all placeholder:text-gray-300 bg-gray-50/50"
                                                value={formData.fullName}
                                                maxLength={10}
                                                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                                placeholder="Your Name"
                                            />
                                        </div>
                                    </div>

                                    {/* Email (Read Only) */}
                                    <div>
                                        <label className="block text-sm font-bold text-[#4A5568] mb-2">Email</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                                <i className="fas fa-envelope"></i>
                                            </div>
                                            <input
                                                type="email"
                                                disabled
                                                className="block w-full rounded-[16px] border border-gray-200 py-3 pl-10 pr-10 text-gray-500 bg-gray-100 cursor-not-allowed outline-none"
                                                value={user?.email || ""}
                                            />
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                                                <i className="fas fa-lock"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[#4A5568] mb-2">Phone Number</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <i className="fas fa-phone"></i>
                                        </div>
                                        <input
                                            type="tel"
                                            className="block w-full rounded-[16px] border border-gray-200 py-3 pl-10 pr-4 text-gray-900 focus:border-[#8AD6C6] focus:ring focus:ring-[#8AD6C6]/20 outline-none transition-all placeholder:text-gray-300 bg-gray-50/50"
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
                                            className="block w-full rounded-[16px] border border-gray-200 py-3 pl-10 pr-4 text-gray-900 focus:border-[#8AD6C6] focus:ring focus:ring-[#8AD6C6]/20 outline-none transition-all placeholder:text-gray-300 bg-gray-50/50 text-sm"
                                            rows={3}
                                            value={formData.address}
                                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                                            placeholder="Enter your address..."
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xl font-bold text-[#4A5568]">{myFamily?.name}</h3>
                                        <button
                                            onClick={() => setIsRenaming(true)}
                                            className="text-xs text-gray-400 hover:text-[#8AD6C6] transition-colors"
                                        >
                                            <i className="fas fa-pen"></i>
                                        </button>
                                    </div>
                                    {formData.defaultFamilyId === myFamily?.id ? (
                                        <span className="text-[10px] text-yellow-500 font-bold self-start flex items-center gap-1">
                                            <i className="fas fa-star"></i> Default Family
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => updateUser({ variables: { input: { defaultFamilyId: myFamily?.id } } }).then(() => refetch())}
                                            className="text-[10px] text-gray-300 hover:text-yellow-500 transition-colors font-bold self-start flex items-center gap-1"
                                        >
                                            <i className="far fa-star"></i> Set as Default
                                        </button>
                                    )}
                                </div>
                                <div className="flex gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="flex-1 py-3 px-4 rounded-[16px] font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-[2] bg-[#8AD6C6] text-white py-3 px-4 rounded-[16px] font-bold hover:bg-[#76BDB0] transition-colors shadow-[0_8px_20px_rgba(138,214,198,0.4)]"
                                    >
                                        {saving ? <i className="fas fa-spinner fa-spin"></i> : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
