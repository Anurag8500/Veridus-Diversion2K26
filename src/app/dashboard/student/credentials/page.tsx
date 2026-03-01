"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { 
    Search, 
    Filter, 
    Eye, 
    Download, 
    Share2, 
    Loader2, 
    AlertCircle,
    FileText,
    Lock,
    X,
    CheckCircle2,
    Copy
} from "lucide-react";

interface Degree {
    _id: string;
    degreeId: string;
    degreeTitle: string;
    institutionName: string;
    branch: string;
    issueDate: string;
    status: string;
    cgpa?: number | null;
}

export default function MyCredentialsPage() {
    const { address, isConnected } = useAccount();
    const [degrees, setDegrees] = useState<Degree[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const fetchStarted = useRef(false);
    const lastFetchedAddress = useRef<string | null>(null);
    
    // ZK-Proof modal state
    const [showShareModal, setShowShareModal] = useState(false);
    const [selectedDegree, setSelectedDegree] = useState<Degree | null>(null);
    const [disclosureType, setDisclosureType] = useState<"full" | "degree_only" | "gpa_threshold">("degree_only");
    const [gpaThreshold, setGpaThreshold] = useState<string>("8.0");
    const [generatingProof, setGeneratingProof] = useState(false);
    const [generatedProof, setGeneratedProof] = useState<{ proofId: string; verificationUrl: string } | null>(null);
    const [proofError, setProofError] = useState<string>("");

    useEffect(() => {
        const fetchDegrees = async () => {
            if (!isConnected || !address) return;
            // Prevent duplicate fetch for the same address in the same component mount
            if (fetchStarted.current && lastFetchedAddress.current === address) return;
            
            fetchStarted.current = true;
            lastFetchedAddress.current = address;

            try {
                setLoading(true);
                const response = await fetch(`/api/degrees/student?studentWallet=${address}`);
                const data = await response.json();

                if (data.success) {
                    setDegrees(data.degrees);
                } else {
                    setError(data.message || "Failed to fetch degrees");
                }
            } catch (err) {
                console.error("Error fetching degrees:", err);
                setError("An unexpected error occurred while loading your credentials.");
            } finally {
                setLoading(false);
            }
        };

        fetchDegrees();
    }, [isConnected, address]);

    const filteredDegrees = degrees.filter(degree => 
        degree.degreeTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        degree.institutionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        degree.degreeId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSharePrivately = (degree: Degree) => {
        setSelectedDegree(degree);
        setShowShareModal(true);
        setGeneratedProof(null);
        setProofError("");
        // If degree doesn't have CGPA, default to degree_only instead of gpa_threshold
        setDisclosureType(degree.cgpa ? "degree_only" : "degree_only");
        setGpaThreshold("8.0");
    };

    const handleGenerateProof = async () => {
        if (!selectedDegree || !address) return;

        // Prevent GPA threshold if CGPA is not available
        if (disclosureType === "gpa_threshold" && (selectedDegree.cgpa === null || selectedDegree.cgpa === undefined)) {
            setProofError("This credential does not have CGPA data. Please select a different disclosure option.");
            return;
        }

        setGeneratingProof(true);
        setProofError("");
        try {
            const response = await fetch("/api/zk-proof/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    degreeId: selectedDegree.degreeId,
                    studentWallet: address,
                    disclosureType,
                    gpaThreshold: disclosureType === "gpa_threshold" ? parseFloat(gpaThreshold) : undefined,
                }),
            });

            const data = await response.json();
            if (data.success) {
                setGeneratedProof(data.proof);
                setProofError("");
            } else {
                setProofError(data.message || "Failed to generate proof");
            }
        } catch (err) {
            console.error("Error generating proof:", err);
            setProofError("An unexpected error occurred while generating the proof.");
        } finally {
            setGeneratingProof(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">My Credentials</h1>
                    <p className="text-gray-400 mt-2">
                        View and manage your verified academic credentials.
                    </p>
                </div>
            </div>

            {/* 1. Search and Filter Area */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search by title, institution or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#050505] border border-[#1C1C1C] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 transition-colors"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-[#050505] border border-[#1C1C1C] rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-[#111] transition-colors">
                    <Filter className="w-4 h-4" />
                    Filter: Institution
                </button>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-[#050505] border border-[#1C1C1C] rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-[#111] transition-colors">
                    <Filter className="w-4 h-4" />
                    Filter: Status
                </button>
            </div>

            {/* 2. Credentials List/Table */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-[#050505] border border-[#1C1C1C] rounded-xl">
                    <Loader2 className="w-8 h-8 text-brand animate-spin mb-4" />
                    <p className="text-gray-400 animate-pulse">Fetching your credentials...</p>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-20 bg-red-500/5 border border-red-500/10 rounded-xl text-center px-4">
                    <AlertCircle className="w-10 h-10 text-red-500/50 mb-4" />
                    <h3 className="text-red-500 font-medium">Error Loading Credentials</h3>
                    <p className="text-gray-400 mt-1 max-w-sm">{error}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="mt-6 px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors text-sm font-medium"
                    >
                        Try Again
                    </button>
                </div>
            ) : filteredDegrees.length > 0 ? (
                <div className="rounded-xl border border-[#1C1C1C] bg-[#050505] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-400 bg-[#0A0A0A] border-b border-[#1C1C1C] uppercase">
                                <tr>
                                    <th scope="col" className="px-6 py-4 font-medium">Credential Title</th>
                                    <th scope="col" className="px-6 py-4 font-medium">Issuing Institution</th>
                                    <th scope="col" className="px-6 py-4 font-medium">Issue Date</th>
                                    <th scope="col" className="px-6 py-4 font-medium text-center">Status</th>
                                    <th scope="col" className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDegrees.map((cred) => (
                                    <tr
                                        key={cred._id}
                                        className="border-b border-[#1C1C1C] last:border-0 hover:bg-[#0A0A0A] transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-white">{cred.degreeTitle}</span>
                                                <span className="text-xs text-gray-500 mt-0.5">{cred.degreeId}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-300">{cred.institutionName || "N/A"}</td>
                                        <td className="px-6 py-4 text-gray-400">
                                            {new Date(cred.issueDate).toLocaleDateString('en-GB', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                                cred.status === "valid" 
                                                    ? "bg-green-500/10 text-green-500" 
                                                    : "bg-red-500/10 text-red-500"
                                            }`}>
                                                {cred.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    title="View Credential" 
                                                    onClick={() => window.open(`/api/certificates/${cred.degreeId}`, "_blank")}
                                                    className="p-1.5 text-gray-500 hover:text-white hover:bg-[#1C1C1C] rounded transition-colors"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    title="Download Certificate" 
                                                    onClick={() => {
                                                        const link = document.createElement("a");
                                                        link.href = `/api/certificates/${cred.degreeId}`;
                                                        link.download = `${cred.degreeId}.pdf`;
                                                        document.body.appendChild(link);
                                                        link.click();
                                                        document.body.removeChild(link);
                                                    }}
                                                    className="p-1.5 text-gray-500 hover:text-white hover:bg-[#1C1C1C] rounded transition-colors"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    title="Share Privately" 
                                                    onClick={() => handleSharePrivately(cred)}
                                                    className="p-1.5 text-gray-500 hover:text-white hover:bg-[#1C1C1C] rounded transition-colors"
                                                >
                                                    <Lock className="w-4 h-4" />
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
                <div className="flex flex-col items-center justify-center py-24 bg-[#050505] border border-[#1C1C1C] border-dashed rounded-xl text-center px-4">
                    <div className="w-16 h-16 bg-[#0A0A0A] border border-[#1C1C1C] rounded-2xl flex items-center justify-center mb-6">
                        <FileText className="w-8 h-8 text-gray-600" />
                    </div>
                    <h3 className="text-white font-medium text-lg">No Credentials Found</h3>
                    <p className="text-gray-500 mt-2 max-w-sm">
                        {searchQuery 
                            ? `No credentials matching "${searchQuery}" were found in your record.`
                            : "Your verified academic credentials will appear here once they are issued by your institution."
                        }
                    </p>
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery("")}
                            className="mt-6 text-brand hover:text-brand-hover text-sm font-medium transition-colors"
                        >
                            Clear search filter
                        </button>
                    )}
                </div>
            )}

            {/* Share Privately Modal */}
            {showShareModal && selectedDegree && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#050505] border border-[#1C1C1C] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-[#1C1C1C] flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-white">Share Privately</h2>
                                <p className="text-sm text-gray-400 mt-1">Generate a ZK-proof for selective disclosure</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowShareModal(false);
                                    setGeneratedProof(null);
                                    setProofError("");
                                }}
                                className="p-2 text-gray-400 hover:text-white hover:bg-[#1C1C1C] rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {!generatedProof ? (
                                <>
                                    <div className="space-y-4">
                                        <div className="p-4 bg-[#0A0A0A] border border-[#1C1C1C] rounded-lg">
                                            <p className="text-sm font-medium text-white mb-1">{selectedDegree.degreeTitle}</p>
                                            <p className="text-xs text-gray-400">{selectedDegree.institutionName}</p>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="flex items-start gap-3 p-4 bg-[#0A0A0A] border border-[#1C1C1C] rounded-lg cursor-pointer hover:bg-[#111] transition-colors">
                                                <input
                                                    type="radio"
                                                    name="disclosure"
                                                    checked={disclosureType === "full"}
                                                    onChange={() => setDisclosureType("full")}
                                                    className="mt-1"
                                                />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-white">Share Full Certificate</p>
                                                    <p className="text-xs text-gray-400 mt-1">Reveal all credential details</p>
                                                </div>
                                            </label>

                                            <label className="flex items-start gap-3 p-4 bg-[#0A0A0A] border border-[#1C1C1C] rounded-lg cursor-pointer hover:bg-[#111] transition-colors">
                                                <input
                                                    type="radio"
                                                    name="disclosure"
                                                    checked={disclosureType === "degree_only"}
                                                    onChange={() => setDisclosureType("degree_only")}
                                                    className="mt-1"
                                                />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-white">Share Proof of Degree only (Hide Marks)</p>
                                                    <p className="text-xs text-gray-400 mt-1">Verify degree without revealing grades or CGPA</p>
                                                </div>
                                            </label>

                                            <label className={`flex items-start gap-3 p-4 border rounded-lg transition-colors ${
                                                selectedDegree.cgpa !== null && selectedDegree.cgpa !== undefined
                                                    ? "bg-[#0A0A0A] border-[#1C1C1C] cursor-pointer hover:bg-[#111]" 
                                                    : "bg-[#050505] border-[#1C1C1C]/50 cursor-not-allowed opacity-60"
                                            }`}>
                                                <input
                                                    type="radio"
                                                    name="disclosure"
                                                    checked={disclosureType === "gpa_threshold"}
                                                    onChange={() => (selectedDegree.cgpa !== null && selectedDegree.cgpa !== undefined) && setDisclosureType("gpa_threshold")}
                                                    disabled={selectedDegree.cgpa === null || selectedDegree.cgpa === undefined}
                                                    className="mt-1 disabled:cursor-not-allowed"
                                                />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-white">Share Proof of GPA &gt; [Threshold]</p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {selectedDegree.cgpa !== null && selectedDegree.cgpa !== undefined
                                                            ? "Prove CGPA meets threshold without revealing actual value"
                                                            : "This credential does not have CGPA data. Please contact your institution to add CGPA information."
                                                        }
                                                    </p>
                                                    {disclosureType === "gpa_threshold" && selectedDegree.cgpa !== null && selectedDegree.cgpa !== undefined && (
                                                        <div className="mt-3">
                                                            <input
                                                                type="number"
                                                                step="0.1"
                                                                min="0"
                                                                max="10"
                                                                value={gpaThreshold}
                                                                onChange={(e) => setGpaThreshold(e.target.value)}
                                                                placeholder="8.0"
                                                                className="w-full px-3 py-2 bg-[#050505] border border-[#1C1C1C] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    {proofError && (
                                        <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                                            <div className="flex items-center gap-2 mb-1">
                                                <AlertCircle className="w-4 h-4 text-red-500" />
                                                <p className="text-sm font-medium text-red-500">Error</p>
                                            </div>
                                            <p className="text-xs text-red-400/80">{proofError}</p>
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleGenerateProof}
                                            disabled={generatingProof}
                                            className="flex-1 px-4 py-3 bg-brand text-white rounded-lg font-medium hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {generatingProof ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Generating Proof...
                                                </>
                                            ) : (
                                                <>
                                                    <Lock className="w-4 h-4" />
                                                    Generate Verification Link
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowShareModal(false);
                                                setGeneratedProof(null);
                                            }}
                                            className="px-4 py-3 bg-[#0A0A0A] border border-[#1C1C1C] text-gray-300 rounded-lg font-medium hover:bg-[#111] transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-6 bg-green-500/5 border border-green-500/20 rounded-lg">
                                        <div className="flex items-center gap-3 mb-3">
                                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                                            <h3 className="text-lg font-semibold text-white">Proof Generated Successfully</h3>
                                        </div>
                                        <p className="text-sm text-gray-400 mb-4">
                                            Your verification link has been created. Share this URL with verifiers to prove your credentials without revealing sensitive information.
                                        </p>
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Verification URL</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={generatedProof.verificationUrl}
                                                    readOnly
                                                    className="flex-1 px-4 py-2.5 bg-[#0A0A0A] border border-[#1C1C1C] rounded-lg text-sm text-white font-mono"
                                                />
                                                <button
                                                    onClick={() => copyToClipboard(generatedProof.verificationUrl)}
                                                    className="px-4 py-2.5 bg-[#0A0A0A] border border-[#1C1C1C] rounded-lg hover:bg-[#111] transition-colors"
                                                    title="Copy URL"
                                                >
                                                    <Copy className="w-4 h-4 text-gray-400" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowShareModal(false);
                                            setGeneratedProof(null);
                                            setProofError("");
                                        }}
                                        className="w-full px-4 py-3 bg-brand text-white rounded-lg font-medium hover:bg-brand-hover transition-colors"
                                    >
                                        Done
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
