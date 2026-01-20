"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { gql, useQuery } from "@apollo/client";
import confetti from "canvas-confetti";

import { Nunito } from "next/font/google";
import { ChevronDown, ChevronUp } from "lucide-react";

// Font Configuration
const nunito = Nunito({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800"],
    variable: '--font-nunito'
});


const MORNING_FORTUNES = [
    "ตื่นสายคือลาภอันประเสริฐ",
    "อาหารเช้าสำคัญนะ (โดยเฉพาะของแมว)",
    "รีบไปหาเงินมาเปย์เราเร็ว!",
    "วันนี้จะสดใส ถ้าได้กินอาหารเปียก",
    "อย่าเพิ่งไปทำงาน... เกาคางก่อน",
    "ฤกษ์ดีวันนี้ คือการนอนต่อ",
    "ระวังสะดุดความน่ารักเราล้มนะ",
    "กาแฟแก้วเดียวไม่พอ ต้องแมว 1 ตัว",
    "เช้านี้รับโชค (ถ้าเทข้าวให้เรา)",
    "จงตื่นตัวเหมือนแมวเห็นจิ้งจก"
];

const AFTERNOON_FORTUNES = [
    "หนังท้องตึง หนังตาหย่อน (ไปนอนซะ)",
    "ความขยันเป็นเหตุแห่งความเหนื่อย",
    "รับขนมแมวเลียแก้ง่วงมั้ย?",
    "ระวังโดนเจ้านายจับได้ (ว่าอู้อยู่)",
    "บ่ายนี้เหมาะแก่การ F ของเล่นแมว",
    "งานคือเงิน เงินคือค่าแมวเลีย",
    "ง่วงก็ไปนอน อย่าฝืนสังขาร",
    "ระวัง! ความหิวเข้าโจมตี",
    "พักสายตาเถอะ... มาดูรูปเราดีกว่า",
    "ศัตรูที่ร้ายกาจคือ 'ความขี้เกียจ'"
];

const EVENING_FORTUNES = [
    "รีบกลับบ้าน แมวรออยู่",
    "เย็นนี้ราศีจับที่พุง (หิวแล้ว!)",
    "รถติดไม่หวั่น ถ้าใจอยากกอดแมว",
    "มื้อเย็นนี้ ขอปลาทูสองตัวนะ",
    "หายเหนื่อยแน่นอน ถ้าได้ซุกพุงเรา",
    "อย่าเถลไถล เดี๋ยวแมวงอน",
    "ทิศมงคลคือทิศทางกลับบ้าน",
    "ระวังคนแปลกหน้า (แต่แมวแปลกหน้าจีบได้)",
    "โชคลาภลอยมา (ซื้อหวยขากลับสิ)",
    "วันนี้คุณทำดีมาก กลับมาพักผ่อนนะ"
];

const NIGHT_FORTUNES = [
    "อย่านอนดึก เดี๋ยวขอบตาคล้ำเหมือนเรา",
    "เตรียมตัว! ตี 3 เจอกัน (วิ่งรอบห้อง)",
    "ฝันเห็นเลขเด็ด อย่าลืมจด",
    "ระวังแมวนอนทับอก (ผีอำฉบับน่ารัก)",
    "หิวรอบดึกเป็นเรื่องปกติ",
    "คืนนี้พระจันทร์สวย แต่เราสวยกว่า",
    "รีบนอนเถอะ พรุ่งนี้ต้องหาเงิน",
    "ระวังเสียงกุกกัก (เราไล่แมลงสาบอยู่)",
    "ฝันดีนะมนุษย์ทาสของเรา",
    "ปิดไฟได้แล้ว แสงมันแยงตาแมว"
];

const GENERAL_FORTUNES = [
    "วันนี้วันดี ซื้อหวยเลย!",
    "ระวังชามข้าวว่างเปล่า...",
    "จะได้ลาภลอย (เอามาซื้อหนมแมว)",
    "ขยันกิน ขยันนอน คือยอดแมว",
    "ทาสจะนำของอร่อยมาถวายเร็วๆ นี้",
    "ดวงความรักรุ่งริ่ง แต่ดวงกินรุ่งโรจน์",
    "ระวังมนุษย์แอบจุ๊บพุง",
    "วันนี้แมวเป็นใหญ่ (เหมือนทุกวัน)",
    "ชีพจรลงเท้า (เตรียมวิ่งไล่จับแมว)",
    "คุณคือทาสที่โชคดีที่สุดในโลก"
];

const LOADING_MESSAGES = [
    "กำลังสื่อสารกับดาวแมว...",
    "กำลังหยิบใบคำทำนาย...",
    "กำลังแปลรหัสลับจากหนวดแมว...",
    "กำลังดมกลิ่นโชคชะตา..."
];

const TREAT_EMOJIS = ["🐟", "🍗", "🦐", "🥩", "🥛"];

// Collapsible Section Component
const CollapsibleSection = ({ title, icon, children }: { title: string, icon: string, children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="mb-[15px]">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-[#4A5568] text-[1.1rem] font-[700] mb-[10px] bg-transparent border-none p-0 cursor-pointer"
            >
                <div className="flex items-center gap-[8px]">
                    <i className={`${icon} text-[#8AD6C6]`}></i> {title}
                </div>
                {isOpen ? <ChevronUp size={20} className="text-[#8AD6C6]" /> : <ChevronDown size={20} className="text-[#8AD6C6]" />}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function PublicPetProfile() {
    const params = useParams();
    const { id } = params;

    const GET_PUBLIC_PET = gql`
      query GetPublicPet($id: String!) {
        pet: publicPet(id: $id) {
            id
            name
            image
            socialTags
            powerStats {
                label
                value
            }
            favoriteThings
            secretHabits
            isLost
            owner {
                phoneNumber
            }
            socialLinks {
                facebook
                instagram
                tiktok
                youtube
            }
        }
      }
    `;

    // Only run query if we have an ID
    const { data, loading, error } = useQuery(GET_PUBLIC_PET, {
        variables: { id },
        skip: !id
    });

    const [treatCount, setTreatCount] = useState(1200);
    const [clickEffects, setClickEffects] = useState<{ id: number, x: number, y: number, text: string }[]>([]);

    // Modal States
    const [fortune, setFortune] = useState<string | null>(null);
    const [isThinking, setIsThinking] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
    const [luckyNumber, setLuckyNumber] = useState<string | null>(null);
    const [showLuckyModal, setShowLuckyModal] = useState(false);

    // Treat Button Handler
    const handleFeed = (e: React.MouseEvent<HTMLButtonElement>) => {
        // Haptic feedback
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);

        setTreatCount(prev => prev + 1);

        // Add floating effect
        const rect = e.currentTarget.getBoundingClientRect();
        // Center the effect relative to the button if clicked via simple tap, 
        // or usage coordinates if accurate
        const x = rect.width / 2; // Approximate center for simple effect
        const y = rect.height / 2;

        const randomEmoji = TREAT_EMOJIS[Math.floor(Math.random() * TREAT_EMOJIS.length)];

        const newEffect = { id: Date.now(), x, y, text: `+1 ${randomEmoji}` };
        setClickEffects(prev => [...prev, newEffect]);

        // Cleanup
        setTimeout(() => {
            setClickEffects(prev => prev.filter(item => item.id !== newEffect.id));
        }, 1000);
    };

    // Fortune Handler
    const handleFortune = () => {
        if (isThinking) return;
        setIsThinking(true);
        setFortune(null);

        // Pick a random loading message
        const randomMsg = LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
        setLoadingMessage(randomMsg);

        setTimeout(() => {
            const hour = new Date().getHours();
            let pool = GENERAL_FORTUNES;

            if (hour >= 5 && hour < 12) pool = MORNING_FORTUNES;
            else if (hour >= 12 && hour < 17) pool = AFTERNOON_FORTUNES;
            else if (hour >= 17 && hour < 21) pool = EVENING_FORTUNES;
            else if (hour >= 21 || hour < 5) pool = NIGHT_FORTUNES;

            // 20% chance to pick from general instead of specific time slots
            if (Math.random() < 0.2) pool = GENERAL_FORTUNES;

            const randomFortune = pool[Math.floor(Math.random() * pool.length)];
            setFortune(randomFortune);
            setIsThinking(false);
        }, 1500);
    };

    // Lucky Number Handler
    const handleLuckyNumber = () => {
        const isThreeDigit = Math.random() > 0.5;
        const num = isThreeDigit
            ? Math.floor(Math.random() * 900) + 100
            : Math.floor(Math.random() * 90) + 10;

        setLuckyNumber(num.toString());
        setShowLuckyModal(true);
    };

    // Effect for Confetti when Lucky Modal is shown
    useEffect(() => {
        let interval: any; // Use any to avoid NodeJS vs Window timer type conflicts
        if (showLuckyModal) {
            const duration = 3000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 60 };
            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            interval = setInterval(function () {
                const timeLeft = animationEnd - Date.now();
                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }
                // Reduce particle count slightly for smoother performance
                const particleCount = 40 * (timeLeft / duration);

                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);
        }

        return () => {
            if (interval) clearInterval(interval);
            // Removed confetti.reset() to let particles fall naturally and avoid UI freeze
        };
    }, [showLuckyModal]);

    if (loading) return <div className={`min-h-screen flex items-center justify-center bg-[#FFF9F4] ${nunito.className}`}><i className="fas fa-spinner fa-spin text-4xl text-[#8AD6C6]"></i></div>;
    if (error) return <div className={`min-h-screen flex items-center justify-center bg-[#FFF9F4] text-red-500 ${nunito.className}`}>Error: {error.message}</div>;

    // Use fetched data or fallback
    const pet = data?.pet || {};
    const socialTags = pet.socialTags || [];

    // Split socialTags: First is Title/Position, rest are Hashtags
    const positionTitle = socialTags[0] || "";
    const hashtags = socialTags.slice(1);

    const powerStats = pet.powerStats || [
        { label: "ความซน", value: 10 },
        { label: "ความตะกละ", value: 8 },
        { label: "ความอ้อน", value: 5 }
    ];
    const favoriteThings = pet.favoriteThings || [];
    const secretHabits = pet.secretHabits || [];

    const socialLinks = pet.socialLinks || {};
    const hasSocialLinks = Object.values(socialLinks).some(link => link && link !== "");

    return (
        <div className={`min-h-screen flex justify-center items-center bg-[#FFF9F4] font-sans ${nunito.className} py-4`}>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

            {/* Mobile Container */}
            <div className="w-full max-w-[375px] bg-white md:rounded-[30px] overflow-hidden shadow-[0_20px_40px_rgba(138,214,198,0.2)] relative min-h-screen md:min-h-[812px] flex flex-col">

                {/* Header with Blurred Full-Width Image */}
                <div className="h-[380px] relative flex flex-col justify-end p-5 text-center text-white overflow-hidden">
                    {/* Blurred Background Image */}
                    <div className="absolute inset-0 z-0">
                        <img src={pet.image || "https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=300&auto=format&fit=crop"} alt="Background" className="w-full h-full object-cover blur-sm scale-110 opacity-80" />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60"></div>
                    </div>

                    <div className="absolute top-[40px] left-1/2 -translate-x-1/2 w-[200px] h-[200px] rounded-full border-[6px] border-white shadow-[0_10px_30px_rgba(0,0,0,0.2)] z-[5] overflow-hidden bg-white">
                        <img src={pet.image || "https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=300&auto=format&fit=crop"} alt={pet.name} className="w-full h-full object-cover" />
                    </div>

                    <div className="relative z-10 mt-[80px] text-left pb-4">
                        <div className="text-[2.2rem] font-[800] mb-[2px] flex items-center gap-[10px] drop-shadow-md text-white">
                            {pet.name}
                        </div>
                        <div className="text-[1.1rem] opacity-95 mb-[10px] font-[600] drop-shadow-sm text-white/90">
                            {/* Display only title here */}
                            ✨ {positionTitle}
                        </div>
                        <div className="flex gap-[8px] flex-wrap">
                            {/* Loop only through hashtags (slice 1) */}
                            {hashtags.map((tag: string, i: number) => (
                                <span key={i} className="bg-white/20 px-3 py-1 rounded-full text-[0.75rem] font-bold backdrop-blur-md border border-white/40">{tag}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 bg-white flex-grow rounded-t-[30px] relative -mt-[20px] z-20">

                    {/* SOS Alert */}
                    {pet.isLost && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-50 border-2 border-red-200 rounded-[20px] p-5 mb-8 relative overflow-hidden shadow-[0_4px_15px_rgba(239,68,68,0.1)]"
                        >
                            <div className="absolute top-0 right-0 p-2 opacity-10">
                                <i className="fas fa-exclamation-triangle text-5xl text-red-500 rotate-12"></i>
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-red-600 font-black text-lg mb-2 flex items-center gap-2">
                                    <i className="fas fa-exclamation-circle animate-pulse"></i> น้องหลงกับเจ้าของ!
                                </h3>
                                <p className="text-red-500 text-sm font-bold mb-4 leading-relaxed">
                                    ขณะนี้ {pet.name} กำลังพลัดหลง หากคุณพบเห็นโปรดติดต่อเจ้าของโดยด่วน
                                </p>
                                {pet.owner?.phoneNumber && (
                                    <a
                                        href={`tel:${pet.owner.phoneNumber}`}
                                        className="inline-flex items-center justify-center w-full gap-2 bg-red-500 text-white px-6 py-3.5 rounded-[16px] font-black text-lg shadow-lg hover:bg-red-600 transition-all active:scale-95 no-underline"
                                    >
                                        <i className="fas fa-phone-alt"></i> โทรติดต่อเจ้าของ
                                    </a>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Collapsible Power Stats */}
                    <CollapsibleSection title="ค่าพลัง" icon="fas fa-bolt">
                        <div className="bg-[#FFF9F4] p-[20px] rounded-[20px] border border-[#8AD6C6]/20 mb-[10px]">
                            {/* Stats Loop */}
                            {powerStats.map((stat: any, i: number) => (
                                <div key={i} className="mb-[15px] last:mb-0">
                                    <div className="flex justify-between text-[0.9rem] font-[700] mb-[6px] text-[#4A5568]">
                                        <span><i className="fas fa-star text-[#F6AD55] mr-2"></i> {stat.label}</span>
                                        <span>{stat.value}/10</span>
                                    </div>
                                    <div className="bg-white h-[12px] rounded-[10px] overflow-hidden relative border border-[#edf2f7]">
                                        <div
                                            className="bg-[#8AD6C6] h-full rounded-[10px]"
                                            style={{ width: `${(stat.value / 10) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CollapsibleSection>

                    {/* Collapsible Favorite Things */}
                    <CollapsibleSection title="ของโปรด" icon="fas fa-heart">
                        <div className="grid grid-cols-3 gap-[10px] mb-[10px]">
                            {favoriteThings.map((fav: string, i: number) => (
                                <div key={i} className="bg-[#FFF9F4] p-[15px] py-[15px] rounded-[16px] text-center border border-[#8AD6C6]/20">
                                    <i className="fas fa-heart text-[1.2rem] mb-[8px] text-[#F6A6A6]"></i>
                                    <span className="text-[0.8rem] font-[700] text-[#4A5568] block break-words leading-tight">{fav}</span>
                                </div>
                            ))}
                        </div>
                    </CollapsibleSection>

                    {/* Collapsible Secret Habits */}
                    <CollapsibleSection title="นิสัยลับๆ" icon="fas fa-mask">
                        <div className="flex flex-col gap-[10px] mb-[10px]">
                            {secretHabits.map((habit: string, i: number) => (
                                <div key={i} className="flex items-center gap-[15px] p-[16px] rounded-[16px] text-[0.9rem] font-[600] bg-[#FFF9F4] border border-[#8AD6C6]/20 text-[#4A5568]">
                                    <i className="fas fa-user-secret text-[#8AD6C6] text-lg"></i> {habit}
                                </div>
                            ))}
                        </div>
                    </CollapsibleSection>

                </div>

                {/* Action Zone */}
                <div className="bg-[#FFF9F4] p-[25px_20px] text-center relative z-30 pb-8">

                    {/* Button 1: Feed Virtual Snacks */}
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleFeed}
                        className="w-full border-none p-[16px] mb-[15px] rounded-[20px] text-white text-left relative cursor-pointer shadow-[0_4px_15px_rgba(138,214,198,0.4)] bg-[#8AD6C6] hover:bg-[#76BDB0] transition-colors"
                    >
                        <div className="flex items-center gap-[15px]">
                            <div className="text-[1.8rem] w-[40px] text-center"><i className="fas fa-fish"></i></div>
                            <div className="flex-grow">
                                <div className="flex justify-between items-center mb-[2px]">
                                    <h3 className="text-[1rem] font-[700]">ป้อนขนมแจกแต้มบุญ</h3>
                                    <span className="bg-white/20 px-3 py-0.5 rounded-lg text-[0.8rem] font-bold backdrop-blur-sm">
                                        สะสม {treatCount.toLocaleString()}
                                    </span>
                                </div>
                                <p className="text-[0.8rem] opacity-90 font-[500] text-left">จิ้มเพื่อป้อนหนมให้ทูนหัว 🐟</p>
                            </div>
                            {/* Click Effects inside button */}
                            <AnimatePresence>
                                {clickEffects.map(effect => (
                                    <motion.div
                                        key={effect.id}
                                        initial={{ opacity: 1, y: 0, scale: 0.5 }}
                                        animate={{ opacity: 0, y: -50, scale: 1.5 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute text-2xl font-black text-white pointer-events-none z-20 left-1/2 top-0"
                                    >
                                        {effect.text}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </motion.button>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Button 2: Request Lucky Number */}
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={handleLuckyNumber}
                            className="w-full border-2 border-[#8AD6C6] bg-white p-[14px] rounded-[20px] text-[#4A5568] text-center relative cursor-pointer shadow-sm hover:bg-[#F0FFF4] transition-colors h-[120px] flex flex-col items-center justify-center gap-2"
                        >
                            <i className="fas fa-dice text-[#8AD6C6] text-3xl mb-1"></i>
                            <div>
                                <h3 className="text-[0.95rem] font-[700] text-[#8AD6C6]">ขอเลขเด็ด</h3>
                                <p className="text-[0.7rem] opacity-70 font-[600]">งวดนี้มาแน่แม่จ๋า</p>
                            </div>
                        </motion.button>

                        {/* Button 3: Shake Fortune Sticks */}
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={handleFortune}
                            className="w-full border-2 border-[#8AD6C6] bg-white p-[14px] rounded-[20px] text-[#4A5568] text-center relative cursor-pointer shadow-sm hover:bg-[#F0FFF4] transition-colors h-[120px] flex flex-col items-center justify-center gap-2"
                        >
                            <i className="fas fa-wand-magic-sparkles text-[#8AD6C6] text-3xl mb-1"></i>
                            <div>
                                <h3 className="text-[0.95rem] font-[700] text-[#8AD6C6]">เขย่าเซียมซี</h3>
                                <p className="text-[0.7rem] opacity-70 font-[600]">เสี่ยงทายดวงวันนี้</p>
                            </div>
                        </motion.button>
                    </div>
                </div>



                {/* Footer */}
                {hasSocialLinks && (
                    <div className="bg-[#FFF9F4] p-[20px] text-center text-[#718096] text-[0.8rem] pb-8">
                        <p className="mb-[15px] font-[600]">ติดตาม {pet.name} ได้ที่</p>
                        <div className="flex justify-center gap-[20px]">
                            {socialLinks.facebook && (
                                <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="w-[45px] h-[45px] rounded-full bg-white border border-[#E2E8F0] shadow-sm flex justify-center items-center text-[#1877F2] text-[1.4rem] hover:scale-110 transition-transform">
                                    <i className="fab fa-facebook"></i>
                                </a>
                            )}
                            {socialLinks.instagram && (
                                <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="w-[45px] h-[45px] rounded-full bg-white border border-[#E2E8F0] shadow-sm flex justify-center items-center text-[#E4405F] text-[1.4rem] hover:scale-110 transition-transform">
                                    <i className="fab fa-instagram"></i>
                                </a>
                            )}
                            {socialLinks.tiktok && (
                                <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="w-[45px] h-[45px] rounded-full bg-white border border-[#E2E8F0] shadow-sm flex justify-center items-center text-[#000000] text-[1.4rem] hover:scale-110 transition-transform">
                                    <i className="fab fa-tiktok"></i>
                                </a>
                            )}
                            {socialLinks.youtube && (
                                <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="w-[45px] h-[45px] rounded-full bg-white border border-[#E2E8F0] shadow-sm flex justify-center items-center text-[#FF0000] text-[1.4rem] hover:scale-110 transition-transform">
                                    <i className="fab fa-youtube"></i>
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals for Fortune & Lucky Number */}
            <AnimatePresence>
                {/* Fortune Modal */}
                {isThinking && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-[24px] p-8 text-center shadow-2xl min-w-[280px] flex flex-col items-center"
                        >
                            <div className="relative w-20 h-20 mb-4 flex items-center justify-center">
                                {/* The Spinning Circle */}
                                <div className="absolute inset-0 border-4 border-[#8AD6C6]/20 border-t-[#8AD6C6] rounded-full animate-spin"></div>
                                {/* The Static Cat */}
                                <i className="fas fa-cat text-3xl text-[#8AD6C6]"></i>
                            </div>
                            <p className="font-bold text-[#4A5568] animate-pulse">{loadingMessage}</p>
                        </motion.div>
                    </div>
                )}

                {fortune && !isThinking && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setFortune(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 50 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 50 }}
                            className="bg-white text-[#4A5568] w-[90%] max-w-[320px] rounded-[30px] p-8 text-center shadow-2xl relative overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="relative z-10 flex flex-col items-center">
                                {/* Pet Image in Result Modal */}
                                <div className="w-24 h-24 rounded-full border-[4px] border-[#8AD6C6] shadow-xl overflow-hidden mb-4">
                                    <img
                                        src={pet.image || "https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=300&auto=format&fit=crop"}
                                        alt={pet.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <h3 className="text-xl font-black mb-4 text-[#8AD6C6]">{pet.name} กล่าวว่า:</h3>
                                <p className="text-lg font-[600] mb-6 italic text-[#4A5568]">"{fortune}"</p>
                                <button
                                    onClick={() => setFortune(null)}
                                    className="bg-[#8AD6C6] text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-[#76BDB0] transition-colors active:scale-95"
                                >
                                    สาธุ 99
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Lucky Number Modal */}
                {showLuckyModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowLuckyModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.5, y: 50, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.5, y: 50, opacity: 0 }}
                            className="bg-white w-[90%] max-w-[320px] rounded-[32px] p-8 text-center relative overflow-hidden shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-[#8AD6C6]/10 to-transparent"></div>

                            <h2 className="text-xl font-black text-[#4A5568] mb-2">✨ {pet.name} ให้เลขเด็ด ✨</h2>

                            <div className="bg-[#FFF9F4] border-2 border-dashed border-[#8AD6C6] rounded-2xl p-8 mb-6 mt-4">
                                <span className="text-5xl font-black text-[#F6A6A6] tracking-widest drop-shadow-sm">
                                    {luckyNumber}
                                </span>
                            </div>

                            <button
                                onClick={() => setShowLuckyModal(false)}
                                className="w-full bg-[#8AD6C6] text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-transform active:scale-95 hover:bg-[#76BDB0]"
                            >
                                รวยๆ เฮงๆ! 🍀
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
