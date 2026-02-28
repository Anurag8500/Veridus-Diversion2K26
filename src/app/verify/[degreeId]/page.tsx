"use client";

import { useState, useEffect, use } from "react";
import { 
    ShieldCheck, 
    AlertCircle, 
    Loader2, 
    Building2, 
    User, 
    GraduationCap, 
    Calendar, 
    Fingerprint, 
    CheckCircle2,
    XCircle,
    Info
} from "lucide-react";
import Link from "next/link";

interface VerificationData {
    degreeId: string;
    status: string;
    isAuthentic: boolean;
    blockchainVerified: boolean;
    storedHash: string;
    recomputedHash: string;
    academicData: {
        studentName: string;
        degreeTitle: string;
        branch: string;
        institutionName: string;
        issueDate: string;
        blockchainTxHash?: string;
        anchoredAt?: string;
    };
}

export default function PublicVerifyPage({ params }: { params: Promise<{ degreeId: string }> }) {
    const { degreeId } = use(params);
    const [data, setData] = useState<VerificationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchVerification = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/verify/${degreeId}`);
                const result = await response.json();

                if (result.success) {
                    setData(result.verification);
                } else {
                    setError(result.message || "Credential Not Found");
                }
            } catch (err) {
                console.error("Verification error:", err);
                setError("An unexpected error occurred during verification.");
            } finally {
                setLoading(false);
            }
        };

        fetchVerification();
    }, [degreeId]);

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
                <p className="text-gray-400 font-medium animate-pulse uppercase tracking-widest text-xs">Cryptographic Verification in Progress...</p>
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
                        {error || "The credential record could not be found or has been removed from the network."}
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

    const isTampered = data.status === "TAMPERED";
    const isAuthentic = data.isAuthentic;

    return (
        <div className="min-h-screen bg-[#020202] text-white p-6 md:p-12 font-sans selection:bg-brand/30">
            <div className="max-w-4xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                            VERIDUS <span className="text-gray-600 font-normal">|</span> <span className="text-sm font-medium text-gray-400 uppercase tracking-[0.2em]">Verification Protocol</span>
                        </h1>
                        <p className="text-xs text-gray-500">Decentralized Academic Credential Verification Engine</p>
                    </div>
                    
                    <div className={`flex items-center gap-3 px-5 py-2.5 rounded-full border ${
                        isAuthentic 
                        ? "bg-green-500/5 border-green-500/20 text-green-500" 
                        : "bg-red-500/5 border-red-500/20 text-red-500"
                    }`}>
                        {isAuthentic ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        <span className="text-sm font-bold uppercase tracking-wider">
                            {isAuthentic ? "Authenticity Verified" : isTampered ? "Integrity Compromised" : "Credential Invalid"}
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
                    {/* Left: Credential Data */}
                    <div className="lg:col-span-3 space-y-8">
                        <div className="p-8 rounded-[2.5rem] border border-[#1C1C1C] bg-[#080808] space-y-10 shadow-2xl">
                            <div className="flex items-center justify-between border-b border-[#1C1C1C] pb-6">
                                <h2 className="text-lg font-semibold text-gray-200">Credential Details</h2>
                                <span className="text-[10px] font-mono text-gray-500 px-3 py-1 bg-[#111] border border-[#1C1C1C] rounded-full">ID: {data.degreeId}</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-6">
                                <DetailItem icon={User} label="Student Name" value={data.academicData.studentName} />
                                <DetailItem icon={GraduationCap} label="Degree Title" value={data.academicData.degreeTitle} />
                                <DetailItem icon={Building2} label="Institution" value={data.academicData.institutionName} />
                                <DetailItem icon={Info} label="Branch / Specialization" value={data.academicData.branch} />
                                <DetailItem icon={Calendar} label="Issuance Date" value={formatDate(data.academicData.issueDate)} />
                            </div>

                            {data.academicData.blockchainTxHash && (
                                <div className="mt-10 pt-8 border-t border-[#1C1C1C] space-y-4">
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <Fingerprint className="w-4 h-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">On-Chain Evidence</span>
                                    </div>
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-gray-500 font-mono">Transaction Hash</p>
                                            <p className="text-xs font-mono text-brand break-all">{data.academicData.blockchainTxHash}</p>
                                        </div>
                                        {data.academicData.anchoredAt && (
                                            <div className="text-right">
                                                <p className="text-[10px] text-gray-500 font-mono">Anchored At</p>
                                                <p className="text-xs font-mono text-gray-400">{formatDate(data.academicData.anchoredAt)}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Security & Hash */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="p-6 rounded-3xl border border-[#1C1C1C] bg-[#080808] space-y-6">
                            <div className="flex items-center gap-3 text-gray-400">
                                <Fingerprint className="w-5 h-5" />
                                <h3 className="text-sm font-bold uppercase tracking-wider">Hash Integrity</h3>
                            </div>
                            
                            <div className="space-y-4">
                                <HashBox label="Stored Ledger Hash" hash={data.storedHash} />
                                <HashBox 
                                    label="Real-time Recomputed Hash" 
                                    hash={data.recomputedHash} 
                                    status={isTampered ? "error" : "success"}
                                />
                            </div>

                            {isAuthentic && (
                                <div className="p-4 rounded-2xl bg-green-500/5 border border-green-500/10 flex gap-4">
                                    <ShieldCheck className="w-6 h-6 text-green-500 shrink-0" />
                                    <p className="text-xs text-green-500/80 leading-relaxed">
                                        The cryptographic fingerprint matches the ledger record. This credential is valid and has not been altered since issuance.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 rounded-3xl border border-brand/20 bg-brand/5 space-y-4">
                            <h3 className="text-sm font-bold text-brand uppercase tracking-wider">Why Verification Matters</h3>
                            <p className="text-xs text-gray-400 leading-relaxed">
                                VERIDUS uses deterministic hashing to ensure every credential is tamper-proof. Scanning this QR code re-runs the hash algorithm against current database values to ensure absolute integrity.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center pt-8 border-t border-[#111]">
                    <p className="text-xs text-gray-600 uppercase tracking-widest">Powered by Veridus Protocol © 2026</p>
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
