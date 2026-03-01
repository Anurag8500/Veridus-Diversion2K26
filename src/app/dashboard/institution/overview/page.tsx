"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FilePlus, Files, Users, Building2, Loader2, FileText } from "lucide-react";
import { useAccount } from "wagmi";

export default function OverviewPage() {
    const { address, isConnected } = useAccount();
    const [stats, setStats] = useState({
        totalIssued: 0,
        activeStudents: 0, // In a real app, we'd need a separate count for this
        verifiedCount: 0,
        recentActivity: 0
    });
    const [recentDegrees, setRecentDegrees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const fetchInstitutionData = async () => {
            if (!isConnected || !address) return;

            try {
                setLoading(true);

                // Establish/fetch institution identity
                const authResponse = await fetch('/api/auth/wallet-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ walletAddress: address, role: "institution" }),
                });
                
                if (authResponse.ok) {
                    const { user: userData } = await authResponse.json();
                    setUser(userData);
                }

                const response = await fetch(`/api/degrees/institution?institutionWallet=${address}`);
                const data = await response.json();

                if (data.success) {
                    const degrees = data.degrees;
                    setRecentDegrees(degrees.slice(0, 5));
                    
                    // Calculate basic stats
                    const totalIssued = degrees.length;
                    const validDegrees = degrees.filter((d: any) => d.status === "valid").length;
                    
                    // Count unique students using wallet addresses
                    const uniqueStudentsCount = Array.from(new Set(
                        degrees
                            .filter((d: any) => d.studentWallet)
                            .map((d: any) => d.studentWallet)
                    )).length;

                    setStats({
                        totalIssued,
                        activeStudents: uniqueStudentsCount,
                        verifiedCount: validDegrees, // Assuming valid means verified for now
                        recentActivity: degrees.filter((d: any) => {
                            const oneWeekAgo = new Date();
                            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                            return new Date(d.createdAt) > oneWeekAgo;
                        }).length
                    });
                }
            } catch (err) {
                console.error("Error fetching institution data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchInstitutionData();
    }, [isConnected, address]);

    return (
        <div className="space-y-10">
            {/* 1. Page Header */}
            <div>
                <h1 className="text-3xl font-semibold tracking-tight">Overview</h1>
                <p className="text-gray-400 mt-2">
                    Monitor institutional credential activity and platform usage.
                </p>
            </div>

            {/* 2. Welcome Section */}
            <div className="p-8 rounded-xl bg-gradient-to-br from-[#111111] to-[#0A0A0A] border border-[#1C1C1C] relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-2xl font-medium">Welcome back, {user?.institutionName || "Institution"}</h2>
                    <p className="text-gray-400 mt-2 max-w-2xl">
                        Manage and issue verified academic credentials securely through VERIDUS using your wallet address.
                    </p>
                </div>
            </div>

            {/* 3. Statistics Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {loading ? (
                    Array(4).fill(0).map((_, i) => (
                        <div key={i} className="p-6 rounded-xl border border-[#1C1C1C] bg-[#050505] animate-pulse h-28"></div>
                    ))
                ) : (
                    [
                        { label: "Total Credentials Issued", value: stats.totalIssued },
                        { label: "Active Students", value: stats.activeStudents },
                        { label: "Valid Credentials", value: stats.verifiedCount },
                        { label: "New this Week", value: stats.recentActivity },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="p-6 rounded-xl border border-[#1C1C1C] bg-[#050505]"
                        >
                            <p className="text-sm text-gray-400">{stat.label}</p>
                            <p className="text-3xl font-semibold mt-2">{stat.value}</p>
                        </div>
                    ))
                )}
            </div>

            {/* 4. Quick Actions Section */}
            <div>
                <h2 className="text-xl font-medium mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Link
                        href="/dashboard/institution/create"
                        className="flex flex-col items-center justify-center p-6 rounded-xl border border-[#1C1C1C] bg-[#0A0A0A] hover:bg-[#111] transition-colors group"
                    >
                        <FilePlus className="w-8 h-8 text-gray-400 group-hover:text-white mb-3" />
                        <span className="font-medium text-sm text-gray-300 group-hover:text-white">Create Credential</span>
                    </Link>
                    <Link
                        href="/dashboard/institution/records"
                        className="flex flex-col items-center justify-center p-6 rounded-xl border border-[#1C1C1C] bg-[#0A0A0A] hover:bg-[#111] transition-colors group"
                    >
                        <Files className="w-8 h-8 text-gray-400 group-hover:text-white mb-3" />
                        <span className="font-medium text-sm text-gray-300 group-hover:text-white">Credential Records</span>
                    </Link>
                    <Link
                        href="/dashboard/institution/students"
                        className="flex flex-col items-center justify-center p-6 rounded-xl border border-[#1C1C1C] bg-[#0A0A0A] hover:bg-[#111] transition-colors group"
                    >
                        <Users className="w-8 h-8 text-gray-400 group-hover:text-white mb-3" />
                        <span className="font-medium text-sm text-gray-300 group-hover:text-white">Student Records</span>
                    </Link>
                    <Link
                        href="/dashboard/institution/profile"
                        className="flex flex-col items-center justify-center p-6 rounded-xl border border-[#1C1C1C] bg-[#0A0A0A] hover:bg-[#111] transition-colors group"
                    >
                        <Building2 className="w-8 h-8 text-gray-400 group-hover:text-white mb-3" />
                        <span className="font-medium text-sm text-gray-300 group-hover:text-white">Institution Profile</span>
                    </Link>
                </div>
            </div>

            {/* 5. Recent Activity Panel */}
            <div>
                <h2 className="text-xl font-medium mb-4">Recent Activity</h2>
                {loading ? (
                    <div className="p-12 rounded-xl border border-[#1C1C1C] bg-[#050505] flex justify-center">
                        <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
                    </div>
                ) : recentDegrees.length > 0 ? (
                    <div className="rounded-xl border border-[#1C1C1C] bg-[#050505] overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-400 bg-[#0A0A0A] border-b border-[#1C1C1C] uppercase">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Student</th>
                                    <th className="px-6 py-4 font-medium">Credential</th>
                                    <th className="px-6 py-4 font-medium">Date</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentDegrees.map((degree) => (
                                    <tr key={degree._id} className="border-b border-[#1C1C1C] last:border-0 hover:bg-[#0A0A0A] transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">{degree.studentName}</td>
                                        <td className="px-6 py-4 text-gray-300">{degree.degreeTitle}</td>
                                        <td className="px-6 py-4 text-gray-400">
                                            {new Date(degree.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                                degree.status === "valid" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                                            }`}>
                                                {degree.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 rounded-xl border border-[#1C1C1C] bg-[#050505] text-center flex flex-col items-center justify-center">
                        <FileText className="w-10 h-10 text-gray-600 mb-4" />
                        <p className="text-gray-300 font-medium">No credential activity yet.</p>
                        <p className="text-sm text-gray-500 mt-1">
                            Activity will appear once credentials are created.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
