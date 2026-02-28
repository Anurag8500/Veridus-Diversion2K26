"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { 
    Search, 
    Filter, 
    Eye, 
    Download, 
    Share2, 
    Loader2, 
    AlertCircle,
    FileText
} from "lucide-react";

interface Degree {
    _id: string;
    degreeId: string;
    degreeTitle: string;
    institutionName: string;
    branch: string;
    issueDate: string;
    status: string;
}

export default function MyCredentialsPage() {
    const { address, isConnected } = useAccount();
    const [degrees, setDegrees] = useState<Degree[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchDegrees = async () => {
            if (!isConnected || !address) return;

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
                                                <button title="Share Credential" className="p-1.5 text-gray-500 hover:text-white hover:bg-[#1C1C1C] rounded transition-colors">
                                                    <Share2 className="w-4 h-4" />
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
        </div>
    );
}
