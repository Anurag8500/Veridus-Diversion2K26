"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export function Cta() {
    return (
        <section className="py-40 px-6 bg-background-surface overflow-hidden relative">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: [0.03, 0.05, 0.03], scale: [0.8, 1, 0.9] }}
                viewport={{ once: true }}
                transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand blur-[120px] rounded-full pointer-events-none"
            />

            <div className="max-w-4xl mx-auto text-center relative z-10">
                <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="text-5xl md:text-7xl font-medium tracking-tight text-text-primary mb-8 text-glow leading-tight"
                >
                    Start Trusting Academic Credentials Again
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
                    className="text-xl text-text-secondary mb-12 max-w-2xl mx-auto"
                >
                    Join the network of verified institutions and immutable records.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-6"
                >
                    <Link href="/get-started" className="group w-full sm:w-auto px-8 py-5 bg-brand text-background-base rounded-full font-medium hover:bg-brand-hover hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] flex items-center justify-center gap-3 text-lg">
                        Get Started <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link href="/get-started" className="w-full sm:w-auto px-8 py-5 bg-transparent border border-border-base text-text-primary rounded-full font-medium hover:bg-white/[0.08] hover:border-white/30 transition-all flex items-center justify-center text-lg">
                        Explore Now
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
