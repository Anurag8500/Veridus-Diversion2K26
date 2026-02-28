"use client";

import { useRouter } from "next/navigation";
import { GraduationCap, Building2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function GetStarted() {
  const router = useRouter();

  const handleRoleSelection = (role: string) => {
    localStorage.setItem("selectedRole", role);
    router.push("/connect-wallet");
  };

  const roles = [
    {
      id: "student",
      title: "Student",
      description: "Manage and share your verified academic credentials securely.",
      icon: <GraduationCap className="w-10 h-10" />,
      color: "from-blue-500/20 to-cyan-500/20",
      borderColor: "hover:border-blue-500/50",
    },
    {
      id: "institution",
      title: "Institution",
      description: "Issue and manage academic credentials on the blockchain ledger.",
      icon: <Building2 className="w-10 h-10" />,
      color: "from-brand/20 to-purple-500/20",
      borderColor: "hover:border-brand/50",
    },
  ];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-background-base">
      <div className="max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight text-text-primary uppercase">
            Choose Your Path
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Select your role to begin your journey with VERIDUS.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {roles.map((role, index) => (
            <motion.button
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleRoleSelection(role.id)}
              className={`group relative p-10 rounded-[2.5rem] bg-background-surface border border-border-base transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl flex flex-col items-start text-left ${role.borderColor}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${role.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2.5rem]`} />
              
              <div className="relative z-10 p-4 rounded-2xl bg-background-elevated border border-border-base mb-8 group-hover:scale-110 transition-transform duration-300">
                {role.icon}
              </div>

              <h2 className="relative z-10 text-3xl font-semibold mb-4 text-text-primary group-hover:text-white transition-colors">
                {role.title}
              </h2>
              
              <p className="relative z-10 text-lg text-text-secondary mb-10 group-hover:text-text-primary/90 transition-colors">
                {role.description}
              </p>

              <div className="relative z-10 mt-auto flex items-center gap-2 font-medium text-brand group-hover:translate-x-2 transition-transform duration-300">
                <span>Select {role.title}</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </motion.button>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <button 
            onClick={() => router.back()}
            className="text-text-secondary hover:text-text-primary transition-colors text-sm font-medium"
          >
            ← Back to Home
          </button>
        </motion.div>
      </div>
    </main>
  );
}
