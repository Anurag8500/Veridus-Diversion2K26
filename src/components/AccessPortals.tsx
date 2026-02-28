"use client";

import Link from "next/link";
import { ArrowRight, Building2, GraduationCap, CheckCircle } from "lucide-react";
import { motion, Variants } from "framer-motion";

export function AccessPortals() {
    const portals = [
        {
            id: "institution",
            title: "Institution Portal",
            desc: "Issue and manage academic credentials securely on the ledger.",
            icon: <Building2 className="w-8 h-8" />,
            btnText: "Get Started",
            href: "/get-started"
        },
        {
            id: "student",
            title: "Student Portal",
            desc: "View, manage and share your verified academic degrees.",
            icon: <GraduationCap className="w-8 h-8" />,
            btnText: "Get Started",
            href: "/get-started"
        },
        {
            id: "verification",
            title: "Verification Portal",
            desc: "Verify academic credentials instantly using secure links.",
            icon: <CheckCircle className="w-8 h-8" />,
            btnText: "Explore Now",
            primary: true,
            href: "/get-started"
        }
    ];

    return (
        <section id="access" className="py-32 px-6">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-20"
                >
                    <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-text-primary mb-6">
                        Access Portals
                    </h2>
                    <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto">
                        Secure entry points for all participants in the verification network.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {portals.map((portal, idx) => (
                        <motion.div
                            key={portal.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6, delay: idx * 0.15 }}
                            className={`group p-8 md:p-10 rounded-[2rem] border flex flex-col items-start transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl relative overflow-hidden ${portal.primary
                                ? "border-brand/40 bg-brand-muted/10 hover:border-brand hover:shadow-[0_10px_40px_rgba(255,255,255,0.1)]"
                                : "border-border-base bg-background-surface hover:border-white/20 hover:bg-white/[0.02]"
                                }`}
                        >
                            {portal.primary && (
                                <div className="absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-duration-500" />
                            )}

                            <div className={`p-4 rounded-2xl mb-8 transition-transform duration-300 group-hover:scale-110 relative z-10 ${portal.primary
                                ? "bg-brand text-background-base shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                                : "bg-background-elevated text-text-primary border border-border-base group-hover:border-white/20"
                                }`}>
                                {portal.icon}
                            </div>

                            <h3 className="text-2xl font-medium text-text-primary mb-4 relative z-10">
                                {portal.title}
                            </h3>
                            <p className="text-text-secondary mb-12 flex-grow relative z-10 leading-relaxed group-hover:text-text-primary/90 transition-colors">
                                {portal.desc}
                            </p>

                            <Link
                                href={portal.href}
                                className={`relative z-10 w-full py-4 px-6 rounded-xl font-medium flex items-center justify-between transition-all duration-300 ${portal.primary
                                    ? "bg-brand text-background-base hover:bg-brand-hover hover:scale-[1.02] shadow-lg"
                                    : "bg-background-elevated text-text-primary border border-border-base hover:bg-white/10 hover:border-white/30"
                                    }`}
                            >
                                <span>{portal.btnText}</span>
                                <ArrowRight className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all" />
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
