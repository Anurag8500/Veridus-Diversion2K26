"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import { Loader2, GraduationCap, Building2, Wallet, ArrowRight } from "lucide-react";

export default function CompleteProfile() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    const fetchUser = async () => {
      if (isConnected && address) {
        try {
          // Re-using wallet-login as a way to "fetch" user or establish identity for this session
          // In a real app, this would be a session-based auth check
          const response = await fetch('/api/auth/wallet-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress: address, role: "student" }), // role doesn't matter for fetching
          });

          if (!response.ok) throw new Error("Failed to fetch user");

          const { user } = await response.json();
          setUser(user);

          // If profile is already completed, redirect to dashboard
          if (user.profileCompleted) {
            const dashboardPath = user.role === "student" ? "/dashboard/student/overview" : "/dashboard/institution/overview";
            router.push(dashboardPath);
          }
        } catch (err) {
          console.error("Error fetching user:", err);
          setError("Session lost. Please reconnect your wallet.");
        } finally {
          setIsLoading(false);
        }
      } else if (!isConnected && !isLoading) {
        // If not connected and not initial loading, redirect home
        router.push("/");
      }
    };

    fetchUser();
  }, [isConnected, address, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/profile/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          ...formData
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to complete profile");
      }

      const dashboardPath = user.role === "student" ? "/dashboard/student/overview" : "/dashboard/institution/overview";
      router.push(dashboardPath);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-base">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-brand animate-spin" />
          <p className="text-text-secondary animate-pulse">Establishing identity...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen py-20 px-6 bg-background-base">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-background-surface border border-border-base rounded-[2.5rem] p-8 md:p-12 shadow-2xl"
        >
          <div className="flex flex-col items-center text-center mb-10">
            <div className="p-4 rounded-2xl bg-brand/10 border border-brand/20 mb-6">
              {user.role === "student" ? (
                <GraduationCap className="w-8 h-8 text-brand" />
              ) : (
                <Building2 className="w-8 h-8 text-brand" />
              )}
            </div>
            <h1 className="text-3xl font-bold mb-2 text-text-primary uppercase tracking-tight">
              Complete Your Profile
            </h1>
            <p className="text-text-secondary">
              Tell us more about yourself to personalize your experience.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Wallet Address - Read Only */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                <Wallet className="w-4 h-4" /> Wallet Address (Primary ID)
              </label>
              <div className="p-4 rounded-xl bg-background-elevated border border-border-base text-text-primary/50 font-mono text-sm truncate">
                {address}
              </div>
            </div>

            {user.role === "student" ? (
              <>
                {/* Student Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Full Name</label>
                    <input
                      required
                      name="fullName"
                      placeholder="John Doe"
                      onChange={handleInputChange}
                      className="w-full p-4 rounded-xl bg-background-elevated border border-border-base text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Roll Number</label>
                    <input
                      required
                      name="rollNumber"
                      placeholder="CS-2024-001"
                      onChange={handleInputChange}
                      className="w-full p-4 rounded-xl bg-background-elevated border border-border-base text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Department</label>
                  <input
                    required
                    name="department"
                    placeholder="Computer Science & Engineering"
                    onChange={handleInputChange}
                    className="w-full p-4 rounded-xl bg-background-elevated border border-border-base text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Graduation Year</label>
                    <input
                      required
                      type="number"
                      name="graduationYear"
                      placeholder="2024"
                      onChange={handleInputChange}
                      className="w-full p-4 rounded-xl bg-background-elevated border border-border-base text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Date of Birth</label>
                    <input
                      required
                      type="date"
                      name="dateOfBirth"
                      onChange={handleInputChange}
                      className="w-full p-4 rounded-xl bg-background-elevated border border-border-base text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">LinkedIn Profile URL</label>
                  <input
                    name="linkedinUrl"
                    placeholder="https://linkedin.com/in/username"
                    onChange={handleInputChange}
                    className="w-full p-4 rounded-xl bg-background-elevated border border-border-base text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all"
                  />
                </div>
              </>
            ) : (
              <>
                {/* Institution Form Fields */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Institution Name</label>
                  <input
                    required
                    name="institutionName"
                    placeholder="University of Excellence"
                    onChange={handleInputChange}
                    className="w-full p-4 rounded-xl bg-background-elevated border border-border-base text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Registration ID</label>
                    <input
                      required
                      name="registrationId"
                      placeholder="UNI-12345-REG"
                      onChange={handleInputChange}
                      className="w-full p-4 rounded-xl bg-background-elevated border border-border-base text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Official Email</label>
                    <input
                      required
                      type="email"
                      name="officialEmail"
                      placeholder="admin@univ.edu"
                      onChange={handleInputChange}
                      className="w-full p-4 rounded-xl bg-background-elevated border border-border-base text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Domain</label>
                    <input
                      required
                      name="domain"
                      placeholder="univ.edu"
                      onChange={handleInputChange}
                      className="w-full p-4 rounded-xl bg-background-elevated border border-border-base text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Admin Contact Number</label>
                    <input
                      required
                      name="adminContactNumber"
                      placeholder="+1 (555) 000-0000"
                      onChange={handleInputChange}
                      className="w-full p-4 rounded-xl bg-background-elevated border border-border-base text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Location</label>
                  <input
                    required
                    name="location"
                    placeholder="City, Country"
                    onChange={handleInputChange}
                    className="w-full p-4 rounded-xl bg-background-elevated border border-border-base text-text-primary focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all"
                  />
                </div>
              </>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-5 px-6 bg-brand text-background-base rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-hover transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-brand/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <span>Complete Onboarding</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </main>
  );
}
