"use client";

import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle2, Loader2, AlertCircle, X, FileCheck } from "lucide-react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";

export default function CreateCredentialPage() {
    const { address, isConnected } = useAccount();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        studentName: "",
        studentWallet: "",
        studentRollNumber: "",
        degreeTitle: "",
        fieldOfStudy: "",
        graduationYear: "",
        grade: "",
        description: "",
    });

    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Helper function to parse and format CGPA for display
    const parseCGPAForDisplay = (gradeStr: string): string => {
        if (!gradeStr || !gradeStr.trim()) return "";
        
        const trimmed = gradeStr.trim();
        
        // If it's in format "X/Y", show it as-is
        if (trimmed.includes('/')) {
            return trimmed;
        }
        
        // If it's a direct number, show it with one decimal place if needed
        const numericMatch = trimmed.match(/(\d+\.?\d*)/);
        if (numericMatch) {
            const num = parseFloat(numericMatch[1]);
            return num % 1 === 0 ? num.toString() : num.toFixed(1);
        }
        
        return trimmed;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.size > 10 * 1024 * 1024) {
                setError("File size exceeds 10MB limit.");
                return;
            }
            setFile(selectedFile);
            setError("");
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) {
            if (droppedFile.size > 10 * 1024 * 1024) {
                setError("File size exceeds 10MB limit.");
                return;
            }
            setFile(droppedFile);
            setError("");
        }
    };

    const removeFile = () => {
        setFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isConnected || !address) {
            setError("You must connect your wallet to issue credentials.");
            return;
        }

        if (!formData.studentWallet || !formData.studentName || !formData.degreeTitle || !formData.fieldOfStudy) {
            setError("Please fill in all required fields.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // Parse CGPA from grade field (handles formats like "9.4", "3.8/4.0", "9.4/10", etc.)
            let cgpa: number | null = null;
            if (formData.grade && formData.grade.trim()) {
                const gradeStr = formData.grade.trim();
                
                // If it's in format "X/Y", handle fraction conversion
                if (gradeStr.includes('/')) {
                    const parts = gradeStr.split('/').map(p => p.trim());
                    if (parts.length === 2) {
                        const numerator = parseFloat(parts[0]);
                        const denominator = parseFloat(parts[1]);
                        if (!isNaN(numerator) && !isNaN(denominator) && denominator > 0) {
                            // Convert to 10-point scale if denominator is 4 or less
                            if (denominator <= 4) {
                                cgpa = (numerator / denominator) * 10;
                            } else {
                                // Already in 10-point scale or other scale - use numerator as-is
                                cgpa = numerator;
                            }
                        }
                    }
                } else {
                    // Direct numeric value - extract first number found
                    const numericMatch = gradeStr.match(/(\d+\.?\d*)/);
                    if (numericMatch) {
                        cgpa = parseFloat(numericMatch[1]);
                    }
                }
                
                // Clamp to 0-10 range and validate
                if (cgpa !== null) {
                    if (cgpa > 10) cgpa = 10;
                    if (cgpa < 0) cgpa = 0;
                    // Only set if it's a valid number
                    if (isNaN(cgpa)) cgpa = null;
                }
            }

            const response = await fetch("/api/degrees/issue", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    institutionWallet: address,
                    studentWallet: formData.studentWallet,
                    studentName: formData.studentName,
                    degreeTitle: formData.degreeTitle,
                    branch: formData.fieldOfStudy,
                    cgpa: cgpa, // Include parsed CGPA
                    // Note: In a real app, we would upload the file to IPFS/S3 here
                    // For now, we just pass the file name as a placeholder for credentialHash
                    credentialHash: file ? `FILE_UPLOADED:${file.name}` : null,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(true);
                // Redirect to customization page
                setTimeout(() => {
                    router.push(`/dashboard/institution/customize-certificate/${data.degree.degreeId}`);
                }, 1500);
            } else {
                setError(data.message || "Failed to issue credential.");
            }
        } catch (err) {
            console.error("Issuance Error:", err);
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-6">
                <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <div className="text-center">
                    <h2 className="text-2xl font-semibold">Credential Created Successfully!</h2>
                    <p className="text-gray-400 mt-2">Redirecting to customization...</p>
                </div>
                <p className="text-sm text-gray-500 animate-pulse">Preparing certificate editor...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-5xl">
            <div>
                <h1 className="text-3xl font-semibold tracking-tight">Create Credential</h1>
                <p className="text-gray-400 mt-2">
                    Create and issue a verified academic credential for a student.
                </p>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-8">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* 1. Student Information */}
                        <div className="p-6 rounded-xl border border-[#1C1C1C] bg-[#050505] space-y-6">
                            <h2 className="text-xl font-medium border-b border-[#1C1C1C] pb-4">
                                1. Student Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">
                                        Student Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="studentName"
                                        required
                                        value={formData.studentName}
                                        onChange={handleChange}
                                        placeholder="Enter full name"
                                        className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-white transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">
                                        Student Wallet Address *
                                    </label>
                                    <input
                                        type="text"
                                        name="studentWallet"
                                        required
                                        value={formData.studentWallet}
                                        onChange={handleChange}
                                        placeholder="0x..."
                                        className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-white transition-colors"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-gray-300">
                                        Student ID / Roll Number (optional)
                                    </label>
                                    <input
                                        type="text"
                                        name="studentRollNumber"
                                        value={formData.studentRollNumber}
                                        onChange={handleChange}
                                        placeholder="e.g. STU-2023-001"
                                        className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-white transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 2. Academic Information */}
                        <div className="p-6 rounded-xl border border-[#1C1C1C] bg-[#050505] space-y-6">
                            <h2 className="text-xl font-medium border-b border-[#1C1C1C] pb-4">
                                2. Academic Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-gray-300">
                                        Degree / Certification Title *
                                    </label>
                                    <input
                                        type="text"
                                        name="degreeTitle"
                                        required
                                        value={formData.degreeTitle}
                                        onChange={handleChange}
                                        placeholder="e.g. Bachelor of Science in Computer Science"
                                        className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-white transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">
                                        Field of Study *
                                    </label>
                                    <input
                                        type="text"
                                        name="fieldOfStudy"
                                        required
                                        value={formData.fieldOfStudy}
                                        onChange={handleChange}
                                        placeholder="e.g. Computer Science"
                                        className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-white transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">
                                        Graduation Year
                                    </label>
                                    <input
                                        type="text"
                                        name="graduationYear"
                                        value={formData.graduationYear}
                                        onChange={handleChange}
                                        placeholder="YYYY"
                                        className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-white transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">
                                        CGPA / GPA
                                    </label>
                                    <input
                                        type="text"
                                        name="grade"
                                        value={formData.grade}
                                        onChange={handleChange}
                                        placeholder="e.g. 9.4, 3.8/4.0, or 8.5/10"
                                        className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-white transition-colors"
                                    />
                                    <p className="text-xs text-gray-500">Enter CGPA value (will be converted to 10-point scale if needed)</p>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-gray-300">
                                        Credential Description (optional)
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Add any additional details about this credential..."
                                        rows={4}
                                        className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-white transition-colors resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 3. Certificate Upload */}
                        <div className="p-6 rounded-xl border border-[#1C1C1C] bg-[#050505] space-y-6">
                            <h2 className="text-xl font-medium border-b border-[#1C1C1C] pb-4">
                                3. Certificate Upload
                            </h2>
                            
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="hidden"
                            />

                            {!file ? (
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                    className="border-2 border-dashed border-[#222] rounded-xl p-10 flex flex-col items-center justify-center text-center hover:bg-[#0A0A0A] hover:border-gray-600 transition-all cursor-pointer group"
                                >
                                    <div className="w-12 h-12 rounded-full bg-[#111] flex items-center justify-center mb-4 group-hover:bg-[#1C1C1C] transition-colors">
                                        <Upload className="w-6 h-6 text-gray-400 group-hover:text-white" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-300">
                                        Click to upload or drag and drop
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        PDF, JPG, or PNG (max. 10MB)
                                    </p>
                                </div>
                            ) : (
                                <div className="p-4 rounded-xl border border-[#1C1C1C] bg-[#0A0A0A] flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
                                            <FileCheck className="w-5 h-5 text-brand" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white truncate max-w-[200px] md:max-w-[400px]">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={removeFile}
                                        className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 5. Primary Action Button */}
                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Issuing...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-5 h-5" />
                                        Create Credential
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* 4. Credential Preview Sidebar */}
                <div className="xl:col-span-1">
                    <div className="sticky top-8 p-6 rounded-xl border border-[#1C1C1C] bg-[#050505] space-y-6">
                        <h2 className="text-xl font-medium border-b border-[#1C1C1C] pb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-gray-400" />
                            Preview
                        </h2>

                        <div className="space-y-4">
                            {formData.degreeTitle ? (
                                <div className="p-4 rounded-lg bg-[#0A0A0A] border border-[#111] space-y-3">
                                    <div className="text-center pb-3 border-b border-[#1C1C1C]">
                                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                                            VERIDUS VERIFIED
                                        </p>
                                        <h3 className="font-medium leading-snug">
                                            {formData.degreeTitle}
                                        </h3>
                                    </div>

                                    <div className="space-y-2 text-sm pt-2">
                                        <div className="flex justify-between items-start gap-4">
                                            <span className="text-gray-500">Issued To:</span>
                                            <span className="font-medium text-right break-words">{formData.studentName || "—"}</span>
                                        </div>
                                        <div className="flex justify-between items-start gap-4">
                                            <span className="text-gray-500">Student ID:</span>
                                            <span className="text-right break-words">{formData.studentRollNumber || "—"}</span>
                                        </div>
                                        <div className="flex justify-between items-start gap-4">
                                            <span className="text-gray-500">Major:</span>
                                            <span className="text-right break-words">{formData.fieldOfStudy || "—"}</span>
                                        </div>
                                        <div className="flex justify-between items-start gap-4">
                                            <span className="text-gray-500">Class of:</span>
                                            <span className="text-right break-words">{formData.graduationYear || "—"}</span>
                                        </div>
                                        {formData.grade && (
                                            <div className="flex justify-between items-start gap-4 pt-2 border-t border-[#1C1C1C]">
                                                <span className="text-gray-500">CGPA:</span>
                                                <span className="font-medium text-right break-words">{parseCGPAForDisplay(formData.grade)}</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {file && (
                                        <div className="mt-4 pt-3 border-t border-[#1C1C1C] flex items-center gap-2 text-[10px] text-gray-500 italic">
                                            <FileCheck className="w-3 h-3" />
                                            Certificate attached: {file.name}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="py-12 text-center text-sm text-gray-500">
                                    <p>Start typing to see</p>
                                    <p>credential preview.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
