"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";

export function Navbar() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        // Initial check
        handleScroll();

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
            ? "bg-background-base/80 backdrop-blur-md border-b border-border-subtle shadow-sm"
            : "bg-transparent border-transparent"
            }`}>
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-12">
                    <Link href="/" className="flex items-center gap-3">
                        <Image
                            src="/logo.png"
                            alt="Veridus Logo"
                            width={40}
                            height={40}
                            className="object-contain"
                        />
                        <span className="text-2xl font-bold tracking-wider text-text-primary">
                            VERIDUS
                        </span>
                    </Link>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-text-secondary">
                        <Link href="#how-it-works" className="hover:text-text-primary transition-colors">How It Works</Link>
                        <Link href="#features" className="hover:text-text-primary transition-colors">Features</Link>
                        <Link href="#access" className="hover:text-text-primary transition-colors">Access</Link>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-4">
                    <Link href="/get-started"
                        className="text-sm font-medium bg-brand text-background-base px-5 py-2.5 rounded-full hover:bg-brand-hover transition-colors">
                        Get Started
                    </Link>
                </div>

                <button className="md:hidden text-text-secondary hover:text-text-primary">
                    <Menu className="w-6 h-6" />
                </button>
            </div>
        </nav >
    );
}
