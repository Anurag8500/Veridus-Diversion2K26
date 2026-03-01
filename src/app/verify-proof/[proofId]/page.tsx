"use client";

import { useState, useEffect, use } from "react";
import { 
    ShieldCheck, 
    AlertCircle, 
    Loader2, 
    Building2, 
    GraduationCap, 
    Calendar, 
    Fingerprint, 
    CheckCircle2,
    XCircle,
    Info,
    Lock
} from "lucide-react";
import Link from "next/link";

interface VerificationData {
    proofId: string;
    disclosureType: string;
    verified: boolean;
    blockchainVerified: boolean;
    merkleRoot: string;
    proofHash: string;
    proofData: {
        degreeTitle: string;
        institutionName: string;
        branch: string;
        issueDate: string;
        gpaVerified?: boolean;
        gpaThreshold?: number;
    };
    createdAt: string;
}

export default function ZKProofVerifyPage({ params }: { params: Promise<{ proofId: string }> }) {
    const { proofId } = use(params);
    const [data, setData] = useState<VerificationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchVerification = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/zk-proof/verify/${proofId}`);
                const result = await response.json();

                if (result.success) {
                    setData(result.verification);
                } else {
                    setError(result.message || "Proof Not Found");
                }
            } catch (err) {
                console.error("Verification error:", err);
                setError("An unexpected error occurred during verification.");
            } finally {
                setLoading(false);
            }
        };

        fetchVerification();
    }, [proofId]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#020202] flex flex-col items-center justify-center p-4">
                <Loader2 className="w-10 h-10 text-brand animate-spin mb-4" />
                <p className="text-gray-400 font-medium animate-pulse uppercase tracking-widest text-xs">ZK-Proof Verification in Progress...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-[#020202] flex flex-col items-center justify-center p-4 text-white">
                <div className="w-full max-w-md p-8 rounded-3xl border border-red-500/20 bg-red-500/5 text-center backdrop-blur-sm">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Verification Failed</h1>
                    <p className="text-gray-400 mb-8 text-sm leading-relaxed">
                        {error || "The ZK-proof could not be found or has expired."}
                    </p>
                    <Link 
                        href="/"
                        className="inline-flex items-center px-8 py-3 bg-white text-black rounded-full text-sm font-semibold hover:bg-gray-200 transition-all"
                    >
                        Return to Portal
                    </Link>
                </div>
            </div>
        );
    }

    const isVerified = data.verified;

    return (
        <div className="min-h-screen bg-[#020202] text-white p-6 md:p-12 font-sans selection:bg-brand/30">
            <div className="max-w-4xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                            VERIDUS <span className="text-gray-600 font-normal">|</span> <span className="text-sm font-medium text-gray-400 uppercase tracking-[0.2em]">ZK-Proof Verification</span>
                        </h1>
                        <p className="text-xs text-gray-500">Zero-Knowledge Selective Disclosure Protocol</p>
                    </div>
                    
                    <div className={`flex items-center gap-3 px-5 py-2.5 rounded-full border ${
                        isVerified 
                        ? "bg-green-500/5 border-green-500/20 text-green-500" 
                        : "bg-red-500/5 border-red-500/20 text-red-500"
                    }`}>
                        {isVerified ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        <span className="text-sm font-bold uppercase tracking-wider">
                            {isVerified ? "Attribute Verified via ZK-Proof" : "Verification Failed"}
                        </span>
                    </div>

                    {data.blockchainVerified && (
                        <div className="flex items-center gap-3 px-5 py-2.5 rounded-full border bg-brand/5 border-brand/20 text-brand">
                            <ShieldCheck className="w-5 h-5" />
                            <span className="text-sm font-bold uppercase tracking-wider">
                                Blockchain Anchored
                            </span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Left: Proof Data */}
                    <div className="lg:col-span-3 space-y-8">
                        <div className="p-8 rounded-[2.5rem] border border-[#1C1C1C] bg-[#080808] space-y-10 shadow-2xl">
                            <div className="flex items-center justify-between border-b border-[#1C1C1C] pb-6">
                                <h2 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                                    <Lock className="w-5 h-5" />
                                    Verified Attributes
                                </h2>
                                <span className="text-[10px] font-mono text-gray-500 px-3 py-1 bg-[#111] border border-[#1C1C1C] rounded-full">Proof: {data.proofId}</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-6">
                                <DetailItem icon={GraduationCap} label="Degree Title" value={data.proofData.degreeTitle} />
                                <DetailItem icon={Building2} label="Institution" value={data.proofData.institutionName} />
                                <DetailItem icon={Info} label="Branch / Specialization" value={data.proofData.branch} />
                                <DetailItem icon={Calendar} label="Issuance Date" value={formatDate(data.proofData.issueDate)} />
                            </div>

                            {/* GPA Verification (if applicable) */}
                            {data.disclosureType === "gpa_threshold" && data.proofData.gpaVerified && (
                                <div className="mt-10 pt-8 border-t border-[#1C1C1C] space-y-4">
                                    <div className="p-6 bg-green-500/5 border border-green-500/20 rounded-2xl">
                                        <div className="flex items-center gap-3 mb-3">
                                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                                            <h3 className="text-sm font-bold text-green-500 uppercase tracking-wider">GPA Threshold Verified</h3>
                                        </div>
                                        <div className="mt-3 p-4 bg-[#0A0A0A] border border-green-500/10 rounded-lg">
                                            <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Verified Condition</p>
                                            <p className="text-2xl font-bold text-green-500">
                                                CGPA &gt; {data.proofData.gpaThreshold}
                                            </p>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-4 flex items-center gap-1">
                                            <Lock className="w-3 h-3" />
                                            The actual CGPA value is not disclosed for privacy protection.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Disclosure Type Info */}
                            <div className="mt-10 pt-8 border-t border-[#1C1C1C] space-y-4">
                                <div className="flex items-center gap-2 text-gray-500">
                                    <Info className="w-4 h-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Disclosure Type</span>
                                </div>
                                <div className="p-4 bg-[#0A0A0A] border border-[#1C1C1C] rounded-xl">
                                    <p className="text-sm text-gray-300">
                                        {data.disclosureType === "full" && "Full certificate disclosure"}
                                        {data.disclosureType === "degree_only" && "Degree information only (marks hidden)"}
                                        {data.disclosureType === "gpa_threshold" && `GPA threshold proof (≥${data.proofData.gpaThreshold})`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Security & Hash */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="p-6 rounded-3xl border border-[#1C1C1C] bg-[#080808] space-y-6">
                            <div className="flex items-center gap-3 text-gray-400">
                                <Fingerprint className="w-5 h-5" />
                                <h3 className="text-sm font-bold uppercase tracking-wider">ZK-Proof Integrity</h3>
                            </div>
                            
                            <div className="space-y-4">
                                <HashBox label="Merkle Root (On-Chain)" hash={data.merkleRoot} />
                                <HashBox 
                                    label="Proof Hash" 
                                    hash={data.proofHash} 
                                    status={isVerified ? "success" : "error"}
                                />
                            </div>

                            {isVerified && (
                                <div className="p-4 rounded-2xl bg-green-500/5 border border-green-500/10 flex gap-4">
                                    <ShieldCheck className="w-6 h-6 text-green-500 shrink-0" />
                                    <p className="text-xs text-green-500/80 leading-relaxed">
                                        This ZK-proof has been cryptographically verified against the on-chain Merkle root. The attributes shown above are authentic and have not been tampered with.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 rounded-3xl border border-brand/20 bg-brand/5 space-y-4">
                            <h3 className="text-sm font-bold text-brand uppercase tracking-wider">Privacy Protection</h3>
                            <p className="text-xs text-gray-400 leading-relaxed">
                                This verification uses Zero-Knowledge proofs to verify specific attributes without revealing sensitive information like actual grades, CGPA values, or personal identifiers.
                            </p>
                        </div>

                        <div className="p-6 rounded-3xl border border-[#1C1C1C] bg-[#080808] space-y-2">
                            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Proof Generated</p>
                            <p className="text-xs font-mono text-gray-400">{formatDate(data.createdAt)}</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center pt-8 border-t border-[#111]">
                    <p className="text-xs text-gray-600 uppercase tracking-widest">Powered by Veridus ZK-Proof Protocol © 2026</p>
                </div>
            </div>
        </div>
    );
}

function DetailItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-500">
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-lg font-medium text-white">{value}</p>
        </div>
    );
}

function HashBox({ label, hash, status }: { label: string, hash: string, status?: "success" | "error" }) {
    return (
        <div className="space-y-2">
            <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">{label}</p>
            <div className={`p-3 rounded-xl bg-[#030303] border font-mono text-[10px] break-all leading-relaxed ${
                status === "success" ? "border-green-500/30 text-green-500/70" :
                status === "error" ? "border-red-500/30 text-red-500/70" :
                "border-[#1C1C1C] text-gray-500"
            }`}>
                {hash}
            </div>
        </div>
    );
}

