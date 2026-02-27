"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Eye, Download, Share2, MoreVertical, Loader2, FileText, AlertCircle } from "lucide-react";
import { useSession } from "next-auth/react";

export default function CredentialRecordsPage() {
    const { data: session } = useSession();
    const [degrees, setDegrees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchDegrees = async () => {
            if (!session?.user?.id) return;

            try {
                setLoading(true);
                const response = await fetch(`/api/degrees/institution?institutionId=${session.user.id}`);
                const data = await response.json();

                if (data.success) {
                    setDegrees(data.degrees);
                } else {
                    setError(data.message || "Failed to fetch records");
                }
            } catch (err) {
                console.error("Error fetching records:", err);
                setError("An unexpected error occurred while loading records.");
            } finally {
                setLoading(false);
            }
        };

        fetchDegrees();
    }, [session?.user?.id]);

    const filteredDegrees = degrees.filter(degree => 
        degree.degreeTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        degree.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        degree.degreeId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Credential Records</h1>
                    <p className="text-gray-400 mt-2">
                        Manage and track all academic credentials issued by your institution.
                    </p>
                </div>
            </div>

            {/* Search and Filter Area */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search by student name, degree, or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#050505] border border-[#1C1C1C] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 transition-colors"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-[#050505] border border-[#1C1C1C] rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-[#111] transition-colors">
                    <Filter className="w-4 h-4" />
                    Filter: Status
                </button>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-[#050505] border border-[#1C1C1C] rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-[#111] transition-colors">
                    <Filter className="w-4 h-4" />
                    Filter: Year
                </button>
            </div>

            {/* Credentials List/Table */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-[#050505] border border-[#1C1C1C] rounded-xl">
                    <Loader2 className="w-8 h-8 text-brand animate-spin mb-4" />
                    <p className="text-gray-400 animate-pulse">Loading credential records...</p>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-20 bg-red-500/5 border border-red-500/10 rounded-xl text-center px-4">
                    <AlertCircle className="w-10 h-10 text-red-500/50 mb-4" />
                    <h3 className="text-red-500 font-medium">Error Loading Records</h3>
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
                                    <th scope="col" className="px-6 py-4 font-medium">Credential</th>
                                    <th scope="col" className="px-6 py-4 font-medium">Issued To</th>
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
                                        <td className="px-6 py-4 text-gray-300">
                                            <div className="flex flex-col">
                                                <span>{cred.studentName}</span>
                                                <span className="text-xs text-gray-500">{cred.studentId?.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">
                                            {new Date(cred.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                                cred.status === "valid" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                                            }`}>
                                                {cred.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button title="View Details" className="p-1.5 text-gray-500 hover:text-white hover:bg-[#1C1C1C] rounded transition-colors">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button title="Download Copy" className="p-1.5 text-gray-500 hover:text-white hover:bg-[#1C1C1C] rounded transition-colors">
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                <button title="More Options" className="p-1.5 text-gray-500 hover:text-white hover:bg-[#1C1C1C] rounded transition-colors">
                                                    <MoreVertical className="w-4 h-4" />
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
                    <h3 className="text-white font-medium text-lg">No Records Found</h3>
                    <p className="text-gray-500 mt-2 max-w-sm">
                        {searchQuery 
                            ? `No credentials matching "${searchQuery}" were found.`
                            : "Your issued academic credentials will appear here once they are created."
                        }
                    </p>
                </div>
            )}
        </div>
    );
}
