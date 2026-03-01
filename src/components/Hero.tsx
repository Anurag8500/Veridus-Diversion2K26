"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Fingerprint } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

export function Hero() {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Smooth springs for a "premium" weighted feel
    const springX = useSpring(mouseX, { damping: 50, stiffness: 200 });
    const springY = useSpring(mouseY, { damping: 50, stiffness: 200 });

    // Subtle parallax for background elements
    const moveX = useTransform(springX, [-500, 500], [-30, 30]);
    const moveY = useTransform(springY, [-500, 500], [-30, 30]);

    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            mouseX.set(e.clientX - window.innerWidth / 2);
            mouseY.set(e.clientY - window.innerHeight / 2);
        };
        window.addEventListener("mousemove", handleMove);
        return () => window.removeEventListener("mousemove", handleMove);
    }, [mouseX, mouseY]);

    return (
        <section className="relative min-h-screen flex items-center px-6 lg:px-20 overflow-hidden bg-[#0B0E14]">
            {/* Background with Polygon Image */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {/* Your Image - Scale 1.1 prevents edges showing while moving */}
                <motion.div
                    style={{ x: moveX, y: moveY, scale: 1.1 }}
                    className="absolute inset-0 opacity-30"
                >
                    <Image
                        src="/poly-bg.jpg"
                        alt="Background Mesh"
                        fill
                        className="object-cover"
                        priority
                        quality={90}
                    />
                </motion.div>

                {/* Gradient overlays to blend with background */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0B0E14]/40 to-[#0B0E14]" />
                
                {/* Bottom glow to bridge the gap to next section */}
                <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#0B0E14] to-transparent" />

                {/* The "Glassy" Orbs */}
                <motion.div
                    style={{ x: moveX, y: moveY }}
                    className="absolute top-1/4 -right-20 w-[600px] h-[600px] bg-brand/15 rounded-full blur-[120px]"
                />
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center w-full max-w-7xl mx-auto relative z-10">
                {/* LEFT COLUMN: The "Matured" Professional Content */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="space-y-8"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-brand">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Blockchain Verified Credentials</span>
                    </div>

                    <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
                        The <span className="text-brand">Truth</span> Behind <br />
                        Every Degree.
                    </h1>

                    <p className="text-lg text-text-secondary max-w-lg leading-relaxed font-light">
                        Veridus leverages decentralized protocols to ensure academic integrity. 
                        Secure, instant, and tamper-proof verification for the modern era.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link
                            href="/get-started"
                            className="px-8 py-4 bg-brand text-black rounded-xl font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand/20"
                        >
                            Get Started <ArrowRight className="w-4 h-4" />
                        </Link>
                      
                    </div>
                </motion.div>

                {/* RIGHT COLUMN: The "Eye-Catchy" Visual */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{
                        x: useTransform(springX, (v) => v * 0.05),
                        y: useTransform(springY, (v) => v * 0.05),
                    }}
                    className="hidden lg:flex justify-center relative"
                >
                    {/* The Big Brand Logo Graphic - Scaled Up */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-brand/20 blur-[120px] group-hover:bg-brand/30 transition-colors duration-500" />
                        
                        <h2 className="text-[16rem] font-black text-white/5 tracking-tighter select-none">
                            V
                        </h2>

                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-80 h-80 border-[1px] border-white/10 rounded-3xl rotate-12 backdrop-blur-sm bg-white/5 flex items-center justify-center">
                                <div className="w-60 h-60 border-[1px] border-white/20 rounded-2xl -rotate-12 flex items-center justify-center bg-gradient-to-br from-brand/20 to-transparent">
                                    <Fingerprint className="w-24 h-24 text-brand opacity-80" />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
