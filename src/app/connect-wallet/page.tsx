"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { signIn } from "next-auth/react";
import { injected } from "wagmi/connectors";
import { motion } from "framer-motion";
import { Wallet, LogOut, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function ConnectWallet() {
  const router = useRouter();
  const { address, isConnected, isConnecting } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userClickedConnect, setUserClickedConnect] = useState(false);

  // PART D: ROLE VALIDATION
  useEffect(() => {
    const role = localStorage.getItem("selectedRole");
    if (!role) {
      router.push("/get-started");
    }
  }, [router]);

  // Handle successful connection
  useEffect(() => {
    const handleLogin = async () => {
      // ONLY proceed if the user actually clicked connect in this component session
      if (isConnected && address && !isLoggingIn && userClickedConnect) {
        setIsLoggingIn(true);
        setError(null);
        try {
          const role = localStorage.getItem("selectedRole");
          const response = await fetch('/api/auth/wallet-login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              walletAddress: address,
              role: role 
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to login with wallet');
          }

          const { user } = await response.json();

          // Create a session with NextAuth
          const result = await signIn("credentials", {
              redirect: false,
              walletAddress: address,
              role: user.role,
              id: user._id,
              name: user.fullName || user.institutionName || address,
              email: user.officialEmail || "",
          });

          if (result?.error) {
              throw new Error("Failed to create session");
          }

          // PART C: CLEAR TEMP ROLE AFTER LOGIN
          localStorage.removeItem("selectedRole");

          // PART D: REDIRECTION LOGIC
          if (!user.profileCompleted) {
            router.push("/complete-profile");
          } else {
            if (user.role === "student") {
              router.push("/dashboard/student/overview");
            } else if (user.role === "institution") {
              router.push("/dashboard/institution/overview");
            }
          }
        } catch (err: any) {
          console.error("Login error:", err);
          setError(err.message || "Something went wrong during login");
        } finally {
          setIsLoggingIn(false);
        }
      }
    };

    handleLogin();
  }, [isConnected, address, router]);

  const role = typeof window !== 'undefined' ? localStorage.getItem("selectedRole") : null;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-background-base">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-background-surface border border-border-base rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden"
        >
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 blur-3xl -mr-16 -mt-16 rounded-full" />

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="p-5 rounded-2xl bg-brand/10 border border-brand/20 mb-8">
              <Wallet className="w-10 h-10 text-brand" />
            </div>

            <h1 className="text-3xl font-bold mb-4 text-text-primary uppercase tracking-tight">
              Connect Wallet
            </h1>
            
            <p className="text-text-secondary mb-10 leading-relaxed">
              {isConnected 
                ? "Connecting to account..." 
                : `Please connect your MetaMask wallet to continue as a ${role || 'user'}.`}
            </p>

            {error && (
              <div className="w-full p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            {!isConnected ? (
              <button
                onClick={() => {
                  setUserClickedConnect(true);
                  connect({ connector: injected() });
                }}
                disabled={isConnecting || isLoggingIn}
                className="w-full py-4 px-6 bg-brand text-background-base rounded-xl font-semibold flex items-center justify-center gap-3 hover:bg-brand-hover transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-brand/20"
              >
                {isConnecting || isLoggingIn ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{isConnecting ? "Connecting Wallet..." : "Signing in..."}</span>
                  </>
                ) : (
                  <>
                    <Wallet className="w-5 h-5" />
                    <span>Connect MetaMask</span>
                  </>
                )}
              </button>
            ) : (
              <div className="w-full space-y-4">
                <div className="p-4 rounded-xl bg-background-elevated border border-border-base flex flex-col items-center">
                  <span className="text-xs font-medium text-text-secondary uppercase tracking-widest mb-1">Connected Address</span>
                  <span className="text-sm font-mono text-brand truncate max-w-full">
                    {address}
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="w-full py-4 px-6 bg-white/5 text-text-secondary rounded-xl font-semibold flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Finalizing Login...</span>
                  </div>

                  <button
                    onClick={() => disconnect()}
                    className="w-full py-4 px-6 bg-transparent border border-red-500/30 text-red-500 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-red-500/5 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Disconnect</span>
                  </button>
                </div>
              </div>
            )}

            {!isConnected && !isConnecting && (
              <div className="mt-8 flex items-center gap-2 text-xs text-text-secondary bg-background-elevated px-4 py-2 rounded-full border border-border-base">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>MetaMask or compatible wallet required</span>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <button 
            onClick={() => router.push("/get-started")}
            className="text-text-secondary hover:text-text-primary transition-colors text-sm font-medium"
          >
            ← Change Role
          </button>
        </motion.div>
      </div>
    </main>
  );
}
