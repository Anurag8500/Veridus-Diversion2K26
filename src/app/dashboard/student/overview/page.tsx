"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import { Wallet, Share2, User as UserIcon, Loader2 } from "lucide-react";

interface Degree {
    _id: string;
    status: string;
}

export default function StudentOverviewPage() {
    const { address, isConnected } = useAccount();
    const [stats, setStats] = useState({
        total: 0,
        verified: 0,
        shared: 0,
        activity: 0
    });
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!isConnected || !address) return;

            try {
                setLoading(true);
                
                // First, establish/fetch user identity using wallet-login
                const authResponse = await fetch('/api/auth/wallet-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ walletAddress: address, role: "student" }),
                });
                
                if (authResponse.ok) {
                    const { user: userData } = await authResponse.json();
                    setUser(userData);
                }

                // Fetch degrees using wallet address
                const response = await fetch(`/api/degrees/student?studentWallet=${address}`);
                const data = await response.json();

                if (data.success) {
                    const degrees: Degree[] = data.degrees;
                    const verified = degrees.filter(d => d.status === "valid").length;
                    
                    setStats({
                        total: degrees.length,
                        verified: verified,
                        shared: 0, // Sharing not yet implemented in backend
                        activity: degrees.length // Simplified activity count
                    });
                }
            } catch (err) {
                console.error("Error fetching dashboard stats:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [isConnected, address]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-white animate-spin mb-4" />
                <p className="text-gray-400">Loading your dashboard...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            {/* 1. Page Header */}
            <div>
                <h1 className="text-3xl font-semibold tracking-tight">Overview</h1>
                <p className="text-gray-400 mt-2">
                    Access and manage your verified academic credentials.
                </p>
            </div>

            {/* 2. Welcome Section */}
            <div className="p-8 rounded-xl bg-gradient-to-br from-[#111111] to-[#0A0A0A] border border-[#1C1C1C] relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-2xl font-medium">Welcome back, {user?.fullName || "Student"}</h2>
                    <p className="text-gray-400 mt-2 max-w-2xl">
                        Your verified academic credentials are securely stored on VERIDUS using your wallet address.
                    </p>
                </div>
            </div>

            {/* 3. Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Credentials", value: stats.total.toString() },
                    { label: "Verified Credentials", value: stats.verified.toString() },
                    { label: "Shared Credentials", value: stats.shared.toString() },
                    { label: "Recent Activity", value: stats.activity.toString() },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="p-6 rounded-xl border border-[#1C1C1C] bg-[#050505]"
                    >
                        <p className="text-sm text-gray-400">{stat.label}</p>
                        <p className="text-3xl font-semibold mt-2">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* 4. Quick Actions Section */}
            <div>
                <h2 className="text-xl font-medium mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Link
                        href="/dashboard/student/credentials"
                        className="flex flex-col items-center justify-center p-6 rounded-xl border border-[#1C1C1C] bg-[#0A0A0A] hover:bg-[#111] transition-colors group"
                    >
                        <Wallet className="w-8 h-8 text-gray-400 group-hover:text-white mb-3" />
                        <span className="font-medium text-sm text-gray-300 group-hover:text-white">My Credentials</span>
                    </Link>
                    <Link
                        href="/dashboard/student/shared"
                        className="flex flex-col items-center justify-center p-6 rounded-xl border border-[#1C1C1C] bg-[#0A0A0A] hover:bg-[#111] transition-colors group"
                    >
                        <Share2 className="w-8 h-8 text-gray-400 group-hover:text-white mb-3" />
                        <span className="font-medium text-sm text-gray-300 group-hover:text-white">Shared Credentials</span>
                    </Link>
                    <Link
                        href="/dashboard/student/profile"
                        className="flex flex-col items-center justify-center p-6 rounded-xl border border-[#1C1C1C] bg-[#0A0A0A] hover:bg-[#111] transition-colors group"
                    >
                        <UserIcon className="w-8 h-8 text-gray-400 group-hover:text-white mb-3" />
                        <span className="font-medium text-sm text-gray-300 group-hover:text-white">Profile</span>
                    </Link>
                </div>
            </div>

            {/* 5. Recent Activity Panel */}
            <div>
                <h2 className="text-xl font-medium mb-4">Recent Activity</h2>
                {stats.total > 0 ? (
                    <div className="p-6 rounded-xl border border-[#1C1C1C] bg-[#050505] space-y-4">
                        <div className="flex items-center gap-4 text-sm">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <p className="text-gray-300 flex-1">New credential verified: Your academic record has been updated.</p>
                            <span className="text-gray-500">Recently</span>
                        </div>
                    </div>
                ) : (
                    <div className="p-12 rounded-xl border border-[#1C1C1C] bg-[#050505] text-center flex flex-col items-center justify-center">
                        <p className="text-gray-300 font-medium">No credential activity yet.</p>
                        <p className="text-sm text-gray-500 mt-1">
                            Your credential interactions will appear here.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

