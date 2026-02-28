"use client";

import { useState } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, User as UserIcon, Building2, Loader2, AlertCircle } from "lucide-react";
import { signIn } from "next-auth/react";

export default function UnifiedSignIn() {
    const router = useRouter();
    const [role, setRole] = useState<"student" | "institution">("student");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                // NextAuth surfaces the error thrown in authorize()
                setError(result.error === "CredentialsSignin"
                    ? "Invalid email or password"
                    : result.error
                );
                return;
            }

            if (result?.ok) {
                // Fetch the user's role from DB to determine redirect
                const meRes = await fetch("/api/me");
                if (meRes.ok) {
                    const user = await meRes.json();
                    const targetPath = user.role === "student"
                        ? "/dashboard/student/overview"
                        : "/dashboard/institution/overview";
                    router.push(targetPath);
                } else {
                    router.push("/dashboard/student/overview");
                }
            }
        } catch (err) {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Sign In"
            description="Access your VERIDUS dashboard to manage and share verified academic credentials."
        >

            {/* Role Toggle for UI Consistency */}
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
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Email Address</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                                {role === "student" ? <UserIcon className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                            </div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-background-surface border border-border-base rounded-xl pl-10 pr-4 py-3 text-sm text-text-primary focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/50 transition-all"
                                placeholder={role === "student" ? "john@example.com" : "admin@institution.edu"}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Password</label>
                            <Link href="#" className="text-xs text-text-secondary hover:text-text-primary transition-colors">
                                Forgot Password?
                            </Link>
                        </div>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
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
                            <Loader2 className="h-4 w-4 animate-spin" /> Logging in...
                        </>
                    ) : (
                        <>
                            Login to {role === "student" ? "Student" : "Institution"} Dashboard <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-8 pt-6 border-t border-border-subtle text-center">
                <p className="text-sm text-text-secondary">
                    New to VERIDUS?{" "}
                    <Link href="/signup" className="text-text-primary hover:text-brand font-medium transition-colors">
                        Create an Account
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}
