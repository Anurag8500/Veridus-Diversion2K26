"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export function Hero() {
    return (
        <section className="relative pt-40 pb-20 md:pt-52 md:pb-32 px-6 overflow-hidden min-h-[90vh] flex flex-col justify-center">
            {/* Dynamic Background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[1000px] h-[800px] opacity-[0.15] pointer-events-none">
                <motion.div
                    animate={{
                        rotate: [0, 90, 180, 270, 360],
                        scale: [1, 1.2, 1]
                    }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className="w-full h-full bg-gradient-to-tr from-brand via-white/50 to-transparent blur-[150px] rounded-full"
                />
            </div>

            <div className="max-w-4xl mx-auto text-center relative z-10 w-full">
                <motion.h1
                    initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="text-7xl md:text-9xl lg:text-[12rem] font-bold uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-white/20 mb-6 drop-shadow-[0_0_60px_rgba(255,255,255,0.2)]"
                >
                    VERIDUS
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="text-xl md:text-3xl text-text-secondary font-light tracking-wider mb-12 max-w-3xl mx-auto"
                >
                    Truth Behind Every Degree
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <Link href="/get-started" className="w-full sm:w-auto px-8 py-4 bg-brand text-background-base rounded-full font-medium hover:bg-brand-hover hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2">
                        Get Started <ArrowRight className="w-4 h-4" />
                    </Link>
                    <a href="#access" className="w-full sm:w-auto px-8 py-4 bg-transparent border border-border-base text-text-primary rounded-full font-medium hover:bg-white/[0.08] hover:border-white/30 transition-all flex items-center justify-center">
                        Explore Now
                    </a>
                </motion.div>
            </div>
        </section>
    );
}
