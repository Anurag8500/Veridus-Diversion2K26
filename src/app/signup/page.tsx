"use client";

import { useState } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, User as UserIcon, Building2, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function UnifiedSignUp() {
    const router = useRouter();
    const [role, setRole] = useState<"student" | "institution">("student");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, role }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(data.message || "Account created! Please check your email to verify.");
                // Clear form
                setName("");
                setEmail("");
                setPassword("");
                setConfirmPassword("");
            } else {
                setError(data.message || "Signup failed");
            }
        } catch (err) {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Create Your Account"
            description="Join VERIDUS to securely manage and share verified academic credentials."
        >

            {/* Role Toggle */}
            <div className="mb-8 p-1 bg-background-surface border border-border-base rounded-xl flex">
                <button
                    onClick={() => setRole("student")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${role === "student"
                            ? "bg-brand text-background-base shadow-lg"
                            : "text-text-secondary hover:text-text-primary"
                        }`}
                >
                    <UserIcon className="w-4 h-4" /> Student
                </button>
                <button
                    onClick={() => setRole("institution")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${role === "institution"
                            ? "bg-brand text-background-base shadow-lg"
                            : "text-text-secondary hover:text-text-primary"
                        }`}
                >
                    <Building2 className="w-4 h-4" /> Institution
                </button>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-500 text-sm">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}
                {success && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3 text-green-500 text-sm">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <p>{success}</p>
                    </div>
                )}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                            {role === "student" ? "Full Name" : "Institution Name"}
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                                {role === "student" ? <UserIcon className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                            </div>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-background-surface border border-border-base rounded-xl pl-10 pr-4 py-3 text-sm text-text-primary focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/50 transition-all"
                                placeholder={role === "student" ? "John Doe" : "e.g. Stanford University"}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-background-surface border border-border-base rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/50 transition-all"
                            placeholder={role === "student" ? "john@example.com" : "admin@institution.edu"}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-background-surface border border-border-base rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/50 transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Confirm Password</label>
                        <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-background-surface border border-border-base rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/50 transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-6 bg-brand text-background-base rounded-xl py-3.5 px-4 font-medium hover:bg-brand-hover hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Creating Account...
                        </>
                    ) : (
                        <>
                            Create {role === "student" ? "Student" : "Institution"} Account <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-8 pt-6 border-t border-border-subtle text-center">
                <p className="text-sm text-text-secondary">
                    Already have an account?{" "}
                    <Link href="/signin" className="text-text-primary hover:text-brand font-medium transition-colors">
                        Sign in
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}
