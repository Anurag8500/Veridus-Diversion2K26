"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { Eye, Ban, Link as LinkIcon, Share2, Loader2, Copy, ExternalLink, Lock, CheckCircle2 } from "lucide-react";

interface SharedCredential {
    proofId: string;
    degreeId: string;
    degreeTitle: string;
    institutionName: string;
    disclosureType: "full" | "degree_only" | "gpa_threshold";
    gpaThreshold?: number | null;
    verificationUrl: string;
    createdAt: string;
    expiresAt?: string | null;
    status: "Active" | "Expired";
}

export default function SharedCredentialsPage() {
    const { address, isConnected } = useAccount();
    const [sharedList, setSharedList] = useState<SharedCredential[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const fetchStarted = useRef(false);
    const lastFetchedAddress = useRef<string | null>(null);

    useEffect(() => {
        const fetchShared = async () => {
            if (!isConnected || !address) return;
            // Prevent duplicate fetch for the same address in the same component mount
            if (fetchStarted.current && lastFetchedAddress.current === address) return;
            
            fetchStarted.current = true;
            lastFetchedAddress.current = address;

            try {
                setLoading(true);
                const response = await fetch(`/api/zk-proof/student?studentWallet=${address}`);
                const data = await response.json();

                if (data.success) {
                    setSharedList(data.proofs);
                } else {
                    setError(data.message || "Failed to fetch shared credentials");
                }
            } catch (err) {
                console.error("Error fetching shared credentials:", err);
                setError("An unexpected error occurred while loading shared credentials.");
            } finally {
                setLoading(false);
            }
        };

        fetchShared();
    }, [isConnected, address]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const getDisclosureTypeLabel = (type: string, threshold?: number | null) => {
        switch (type) {
            case "full":
                return "Full Certificate";
            case "degree_only":
                return "Degree Only";
            case "gpa_threshold":
                return `GPA > ${threshold}`;
            default:
                return type;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-white animate-spin mb-4" />
                <p className="text-gray-400">Loading shared credentials...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Shared Credentials</h1>
                    <p className="text-gray-400 mt-2">
                        Manage credentials you have shared with organizations or employers.
                    </p>
                </div>
                <div className="p-6 rounded-xl border border-red-500/20 bg-red-500/5 text-center">
                    <p className="text-red-500">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-semibold tracking-tight">Shared Credentials</h1>
                <p className="text-gray-400 mt-2">
                    Manage ZK-proof verification links you have generated for your credentials.
                </p>
            </div>

            {sharedList.length > 0 ? (
                <div className="rounded-xl border border-[#1C1C1C] bg-[#050505] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-400 bg-[#0A0A0A] border-b border-[#1C1C1C] uppercase">
                                <tr>
                                    <th scope="col" className="px-6 py-4 font-medium">Credential</th>
                                    <th scope="col" className="px-6 py-4 font-medium">Disclosure Type</th>
                                    <th scope="col" className="px-6 py-4 font-medium">Shared Date</th>
                                    <th scope="col" className="px-6 py-4 font-medium text-center">Status</th>
                                    <th scope="col" className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sharedList.map((share) => (
                                    <tr
                                        key={share.proofId}
                                        className="border-b border-[#1C1C1C] last:border-0 hover:bg-[#0A0A0A] transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-white">{share.degreeTitle}</span>
                                                <span className="text-xs text-gray-500 mt-0.5">{share.institutionName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Lock className="w-3 h-3 text-gray-500" />
                                                <span className="text-gray-300">{getDisclosureTypeLabel(share.disclosureType, share.gpaThreshold)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">
                                            {formatDate(share.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                                    share.status === "Active"
                                                        ? "bg-green-500/10 text-green-500"
                                                        : "bg-red-500/10 text-red-500"
                                                }`}
                                            >
                                                {share.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    title="View Verification Page"
                                                    onClick={() => window.open(share.verificationUrl, "_blank")}
                                                    className="p-1.5 text-gray-500 hover:text-white hover:bg-[#1C1C1C] rounded transition-colors"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </button>
                                                <button
                                                    title="Copy Verification Link"
                                                    onClick={() => copyToClipboard(share.verificationUrl)}
                                                    className="p-1.5 text-gray-500 hover:text-white hover:bg-[#1C1C1C] rounded transition-colors"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="p-12 rounded-xl border border-[#1C1C1C] bg-[#050505] text-center flex flex-col items-center justify-center">
                    <Share2 className="w-12 h-12 text-gray-600 mb-4" />
                    <p className="text-gray-300 font-medium text-lg">No shared credentials</p>
                    <p className="text-sm text-gray-500 mt-2 max-w-sm">
                        You haven't generated any ZK-proof verification links yet. Generate them from your "My Credentials" page using the "Share Privately" button.
                    </p>
                </div>
            )}
        </div>
    );
}

