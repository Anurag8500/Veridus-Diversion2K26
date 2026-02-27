"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Mail, User, Loader2, Users, AlertCircle } from "lucide-react";
import { useSession } from "next-auth/react";

export default function StudentRecordsPage() {
    const { data: session } = useSession();
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchStudents = async () => {
            if (!session?.user?.id) return;

            try {
                setLoading(true);
                const response = await fetch(`/api/degrees/institution?institutionId=${session.user.id}`);
                const data = await response.json();

                if (data.success) {
                    // Extract unique students from degrees
                    const studentMap = new Map();
                    data.degrees.forEach((degree: any) => {
                        if (degree.studentId && !studentMap.has(degree.studentId._id)) {
                            studentMap.set(degree.studentId._id, {
                                ...degree.studentId,
                                lastCredential: degree.degreeTitle,
                                lastIssued: degree.createdAt,
                                credentialCount: 1
                            });
                        } else if (degree.studentId) {
                            const student = studentMap.get(degree.studentId._id);
                            student.credentialCount += 1;
                            if (new Date(degree.createdAt) > new Date(student.lastIssued)) {
                                student.lastCredential = degree.degreeTitle;
                                student.lastIssued = degree.createdAt;
                            }
                        }
                    });
                    setStudents(Array.from(studentMap.values()));
                } else {
                    setError(data.message || "Failed to fetch student records");
                }
            } catch (err) {
                console.error("Error fetching students:", err);
                setError("An unexpected error occurred while loading student records.");
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, [session?.user?.id]);

    const filteredStudents = students.filter(student => 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Student Records</h1>
                    <p className="text-gray-400 mt-2">
                        View and manage students who have received credentials from your institution.
                    </p>
                </div>
            </div>

            {/* Search and Filter Area */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search by student name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#050505] border border-[#1C1C1C] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 transition-colors"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-[#050505] border border-[#1C1C1C] rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-[#111] transition-colors">
                    <Filter className="w-4 h-4" />
                    Sort: Newest
                </button>
            </div>

            {/* Students List/Table */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-[#050505] border border-[#1C1C1C] rounded-xl">
                    <Loader2 className="w-8 h-8 text-brand animate-spin mb-4" />
                    <p className="text-gray-400 animate-pulse">Loading student records...</p>
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
            ) : filteredStudents.length > 0 ? (
                <div className="rounded-xl border border-[#1C1C1C] bg-[#050505] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-400 bg-[#0A0A0A] border-b border-[#1C1C1C] uppercase">
                                <tr>
                                    <th scope="col" className="px-6 py-4 font-medium">Student Details</th>
                                    <th scope="col" className="px-6 py-4 font-medium">Last Credential Issued</th>
                                    <th scope="col" className="px-6 py-4 font-medium">Total Issued</th>
                                    <th scope="col" className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map((student) => (
                                    <tr
                                        key={student._id}
                                        className="border-b border-[#1C1C1C] last:border-0 hover:bg-[#0A0A0A] transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-xs">
                                                    {(student.name?.charAt(0) || "?")}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-white">{student.name}</span>
                                                    <span className="text-xs text-gray-500">{student.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-gray-300">{student.lastCredential}</span>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(student.lastIssued).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#111] border border-[#222] text-gray-400">
                                                {student.credentialCount} {student.credentialCount === 1 ? 'Credential' : 'Credentials'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button title="Email Student" className="p-1.5 text-gray-500 hover:text-white hover:bg-[#1C1C1C] rounded transition-colors">
                                                    <Mail className="w-4 h-4" />
                                                </button>
                                                <button title="View Profile" className="p-1.5 text-gray-500 hover:text-white hover:bg-[#1C1C1C] rounded transition-colors">
                                                    <User className="w-4 h-4" />
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
                        <Users className="w-8 h-8 text-gray-600" />
                    </div>
                    <h3 className="text-white font-medium text-lg">No Students Found</h3>
                    <p className="text-gray-500 mt-2 max-w-sm">
                        {searchQuery 
                            ? `No students matching "${searchQuery}" were found.`
                            : "Students who receive credentials from your institution will appear here."
                        }
                    </p>
                </div>
            )}
        </div>
    );
}
