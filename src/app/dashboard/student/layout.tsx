"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAccount, useDisconnect } from "wagmi";
import { useState, useEffect } from "react";
import {
    LayoutDashboard,
    Wallet,
    Share2,
    User,
    Settings,
    LogOut,
} from "lucide-react";

const navigation = [
    { name: "Overview", href: "/dashboard/student/overview", icon: LayoutDashboard },
    { name: "My Credentials", href: "/dashboard/student/credentials", icon: Wallet },
    { name: "Shared Credentials", href: "/dashboard/student/shared", icon: Share2 },
    { name: "Profile", href: "/dashboard/student/profile", icon: User },
    { name: "Account Settings", href: "/dashboard/student/settings", icon: Settings },
];

export default function StudentDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { address, isConnected } = useAccount();
    const { disconnect } = useDisconnect();
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const checkAuth = async () => {
            if (isConnected && address) {
                try {
                    const response = await fetch('/api/auth/wallet-login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ walletAddress: address, role: "student" }),
                    });
                    if (response.ok) {
                        const { user } = await response.json();
                        setUser(user);
                        if (!user.profileCompleted) {
                            router.push("/complete-profile");
                        }
                    } else {
                        router.push("/");
                    }
                } catch (err) {
                    router.push("/");
                } finally {
                    setIsLoading(false);
                }
            } else if (!isConnected) {
                router.push("/");
            }
        };
        checkAuth();
    }, [isConnected, address, router]);

    const handleLogout = () => {
        disconnect();
        router.push("/");
    };

    if (isLoading) {
        return (
            <div className="h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-black text-white">
            {/* Sidebar */}
            <aside className="w-64 border-r border-[#1C1C1C] flex flex-col bg-[#050505]">
                <div className="p-6">
                    <h1 className="text-2xl font-bold tracking-tight">VERIDUS</h1>
                    <p className="text-sm text-gray-400 mt-1">Student Panel</p>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive
                                        ? "bg-[#1C1C1C] text-white"
                                        : "text-gray-400 hover:text-white hover:bg-[#111111]"
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="text-sm font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-[#1C1C1C]">
                    <div className="mb-4 px-2">
                        <p className="text-sm font-medium truncate">{user?.fullName || "Student"}</p>
                        <p className="text-xs text-gray-500 truncate transition-colors">
                            {user?.walletAddress?.slice(0, 6)}...{user?.walletAddress?.slice(-4)}
                        </p>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-red-500 rounded-md hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="p-8 max-w-7xl mx-auto">{children}</div>
            </main>
        </div>
    );
}

