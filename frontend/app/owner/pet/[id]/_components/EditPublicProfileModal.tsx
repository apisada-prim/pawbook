"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, gql } from "@apollo/client";

// MOCK OPTIONS for Selection
const TAG_OPTIONS = ["ท่านประธาน", "สายกิน", "ตลกคาเฟ่", "แมวส้ม", "ขี้อ้อน", "อินดี้", "นักล่า", "ขี้เซา"];

const FAVORITE_OPTIONS = [
    { label: "ปลาทู", icon: "fas fa-fish" },
    { label: "นอนกลางวัน", icon: "fas fa-bed" },
    { label: "ของหรูหรา", icon: "fas fa-gem" },
    { label: "ไม้ตกแมว", icon: "fas fa-feather" },
    { label: "กล่องกระดาษ", icon: "fas fa-box-open" },
    { label: "ดูนก", icon: "fas fa-dove" },
];

const UPDATE_PET_MUTATION = gql`
  mutation UpdatePetProfile($input: UpdatePetInput!) {
    updatePet(updatePetInput: $input) {
      id
      socialTags
      powerStats {
        label
        value
      }
      favoriteThings
      secretHabits
      socialLinks {
        facebook
        instagram
        tiktok
        youtube
      }
    }
  }
`;

interface EditPublicProfileModalProps {
    pet: any; // Using any for now, ideally strictly typed
    onClose: () => void;
    onSuccess: () => void;
}

export default function EditPublicProfileModal({ pet, onClose, onSuccess }: EditPublicProfileModalProps) {
    const [step, setStep] = useState(1);
    const [updatePet, { loading }] = useMutation(UPDATE_PET_MUTATION);

    // Helper to ensure 3 empty slots for habits
    const getInitialHabits = (current?: string[]) => {
        const h = current ? [...current] : [];
        while (h.length < 3) h.push("");
        return h.slice(0, 3);
    };

    // Form State
    // Title is stored in socialTags[0]
    const [customTitle, setCustomTitle] = useState(pet.socialTags?.[0] || "");
    // Tags are stored from index 1 onwards
    const [tags, setTags] = useState<string[]>(pet.socialTags?.slice(1) || []);

    const [powerStats, setPowerStats] = useState<any[]>(pet.powerStats || [
        { label: "ความซน", value: 5 },
        { label: "ความตะกละ", value: 5 },
        { label: "สกิลอ้อน", value: 5 },
    ]);
    const [favorites, setFavorites] = useState<string[]>(pet.favoriteThings || []);
    const [habits, setHabits] = useState<string[]>(getInitialHabits(pet.secretHabits));
    // Initialize with explicit fields to avoid __typename from GraphQL
    const [socialLinks, setSocialLinks] = useState<any>({
        facebook: pet.socialLinks?.facebook || "",
        instagram: pet.socialLinks?.instagram || "",
        tiktok: pet.socialLinks?.tiktok || "",
        youtube: pet.socialLinks?.youtube || "",
    });

    // Handlers
    const toggleTag = (tag: string) => {
        if (tags.includes(tag)) {
            setTags(tags.filter(t => t !== tag));
        } else {
            if (tags.length >= 2) return;
            setTags([...tags, tag]);
        }
    };

    const handleStatChange = (index: number, val: number) => {
        const newStats = [...powerStats];
        newStats[index] = { ...newStats[index], value: val };
        setPowerStats(newStats);
    };

    const toggleFavorite = (label: string) => {
        if (favorites.includes(label)) {
            setFavorites(favorites.filter(f => f !== label));
        } else {
            if (favorites.length >= 3) return;
            setFavorites([...favorites, label]);
        }
    };

    const handleHabitChange = (index: number, val: string) => {
        const newHabits = [...habits];
        newHabits[index] = val;
        setHabits(newHabits);
    };

    const handleSocialLinkChange = (platform: string, val: string) => {
        setSocialLinks({ ...socialLinks, [platform]: val });
    };

    const handleSave = async () => {
        try {
            await updatePet({
                variables: {
                    input: {
                        id: pet.id,
                        socialTags: [customTitle, ...tags], // Combine Title + Tags
                        // Ensure powerStats matches InputType structure { label, value }
                        powerStats: powerStats.map(s => ({ label: s.label, value: parseInt(s.value) })),
                        favoriteThings: favorites,
                        secretHabits: habits.filter(h => h.trim() !== ""), // Filter empty
                        socialLinks: socialLinks, // Send as object
                    }
                }
            });
            onSuccess();
            onClose();
        } catch (e: any) {
            alert("Error updating profile: " + e.message);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-5" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white w-full max-w-md rounded-[30px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-[#8AD6C6] to-[#76BDB0] p-5 text-white flex justify-between items-center shrink-0">
                    <h2 className="text-xl font-bold"><i className="fas fa-edit mr-2"></i> แก้ไขโปรไฟล์สาธารณะ</h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto grow">
                    {/* Progress Bar */}
                    <div className="flex gap-2 mb-6">
                        {[1, 2, 3, 4, 5].map(s => (
                            <div key={s} className={`h-1.5 rounded-full flex-1 transition-colors ${s <= step ? 'bg-[#8AD6C6]' : 'bg-gray-100'}`}></div>
                        ))}
                    </div>

                    {step === 1 && (
                        <div className="animate-fade-in-right">
                            <h3 className="text-lg font-bold text-gray-700 mb-2">ชื่อตำแหน่ง / ฉายา</h3>
                            <p className="text-sm text-gray-400 mb-4">ระบุตำแหน่งที่อยากให้โลกจำ (สูงสุด 20 ตัวอักษร)</p>
                            <div className="relative mb-6">
                                <i className="fas fa-id-card absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                <input
                                    type="text"
                                    value={customTitle}
                                    onChange={(e) => setCustomTitle(e.target.value)}
                                    placeholder="เช่น ประธานเหมียว, CEO"
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8AD6C6] text-gray-700 font-bold"
                                    maxLength={20}
                                    autoFocus
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                    {customTitle.length}/20
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-gray-700 mb-2">เลือก Hashtags</h3>
                            <p className="text-sm text-gray-400 mb-4">เลือกได้สูงสุด 2 อย่าง</p>
                            <div className="flex flex-wrap gap-2">
                                {TAG_OPTIONS.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => toggleTag(tag)}
                                        className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-all ${tags.includes(tag)
                                            ? 'border-[#8AD6C6] bg-[#E6FFFA] text-[#8AD6C6]'
                                            : 'border-gray-100 text-gray-500 hover:border-gray-200'
                                            } ${!tags.includes(tag) && tags.length >= 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        disabled={!tags.includes(tag) && tags.length >= 2}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-fade-in-right">
                            <h3 className="text-lg font-bold text-gray-700 mb-4">ปรับค่าพลัง (Power Stats)</h3>
                            <div className="space-y-6">
                                {powerStats.map((stat, idx) => (
                                    <div key={idx}>
                                        <div className="flex justify-between text-sm font-bold text-gray-600 mb-2">
                                            <span>{stat.label}</span>
                                            <span className="text-[#8AD6C6]">{stat.value}/10</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="10"
                                            step="1"
                                            value={stat.value}
                                            onChange={(e) => handleStatChange(idx, parseInt(e.target.value))}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#8AD6C6]"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="animate-fade-in-right">
                            <h3 className="text-lg font-bold text-gray-700 mb-2">ของโปรด (Favorites)</h3>
                            <p className="text-sm text-gray-400 mb-4">เลือกได้สูงสุด 3 อย่าง</p>
                            <div className="grid grid-cols-2 gap-3">
                                {FAVORITE_OPTIONS.map(opt => (
                                    <button
                                        key={opt.label}
                                        onClick={() => toggleFavorite(opt.label)}
                                        className={`p-3 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${favorites.includes(opt.label)
                                            ? 'border-[#8AD6C6] bg-[#E6FFFA] text-[#8AD6C6]'
                                            : 'border-gray-100 text-gray-500 hover:border-gray-200'
                                            } ${!favorites.includes(opt.label) && favorites.length >= 3 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        disabled={!favorites.includes(opt.label) && favorites.length >= 3}
                                    >
                                        <i className={`${opt.icon} text-lg w-6 text-center`}></i>
                                        <span className="font-bold text-sm w-full">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="animate-fade-in-right">
                            <h3 className="text-lg font-bold text-gray-700 mb-4">นิสัยลับๆ (Secret Habits)</h3>
                            <div className="space-y-3">
                                {habits.map((habit, idx) => (
                                    <div key={idx} className="relative">
                                        <i className="fas fa-pen absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                        <input
                                            type="text"
                                            value={habit}
                                            onChange={(e) => handleHabitChange(idx, e.target.value)}
                                            placeholder={`นิสัยที่ ${idx + 1}...`}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8AD6C6] text-gray-600"
                                            maxLength={30}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {step === 5 && (
                        <div className="animate-fade-in-right">
                            <h3 className="text-lg font-bold text-gray-700 mb-4">ช่องทางการติดตาม (Social Media)</h3>
                            <p className="text-sm text-gray-400 mb-4">ใส่ลิงก์เพื่อให้คนติดตามน้องได้ง่ายขึ้น</p>
                            <div className="space-y-4">
                                <div className="relative">
                                    <i className="fab fa-facebook absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 text-lg"></i>
                                    <input
                                        type="text"
                                        value={socialLinks.facebook || ""}
                                        onChange={(e) => handleSocialLinkChange("facebook", e.target.value)}
                                        placeholder="Facebook URL"
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8AD6C6] text-gray-600 text-sm"
                                    />
                                </div>
                                <div className="relative">
                                    <i className="fab fa-instagram absolute left-4 top-1/2 -translate-y-1/2 text-pink-500 text-lg"></i>
                                    <input
                                        type="text"
                                        value={socialLinks.instagram || ""}
                                        onChange={(e) => handleSocialLinkChange("instagram", e.target.value)}
                                        placeholder="Instagram URL"
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8AD6C6] text-gray-600 text-sm"
                                    />
                                </div>
                                <div className="relative">
                                    <i className="fab fa-tiktok absolute left-4 top-1/2 -translate-y-1/2 text-black text-lg"></i>
                                    <input
                                        type="text"
                                        value={socialLinks.tiktok || ""}
                                        onChange={(e) => handleSocialLinkChange("tiktok", e.target.value)}
                                        placeholder="TikTok URL"
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8AD6C6] text-gray-600 text-sm"
                                    />
                                </div>
                                <div className="relative">
                                    <i className="fab fa-youtube absolute left-4 top-1/2 -translate-y-1/2 text-red-600 text-lg"></i>
                                    <input
                                        type="text"
                                        value={socialLinks.youtube || ""}
                                        onChange={(e) => handleSocialLinkChange("youtube", e.target.value)}
                                        placeholder="YouTube URL"
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8AD6C6] text-gray-600 text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-5 border-t border-gray-100 flex justify-between shrink-0">
                    {step > 1 ? (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="bg-gray-100 text-gray-600 px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                        >
                            ย้อนกลับ
                        </button>
                    ) : <div></div>}

                    {step < 5 ? (
                        <button
                            onClick={() => setStep(step + 1)}
                            className="bg-[#8AD6C6] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#76BDB0] transition-colors shadow-lg shadow-[#8AD6C6]/30"
                        >
                            ถัดไป
                        </button>
                    ) : (
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="bg-[#8AD6C6] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#76BDB0] transition-colors shadow-lg shadow-[#8AD6C6]/30 flex items-center gap-2"
                        >
                            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>}
                            บันทึก
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
