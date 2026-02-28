import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Extend NextAuth types for custom session fields
declare module "next-auth" {
    interface Session extends DefaultSession {
        user: {
            id: string;
            walletAddress?: string | null;
            role?: string | null;
        } & DefaultSession["user"];
    }

    interface User extends DefaultUser {
        walletAddress?: string | null;
        role?: string | null;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        userId?: string;
        walletAddress?: string | null;
        role?: string | null;
    }
}

// Wallet-based authentication with Credentials provider
const handler = NextAuth({
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                walletAddress: { label: "Wallet Address", type: "text" },
                role: { label: "Role", type: "text" },
                id: { label: "User ID", type: "text" },
                name: { label: "Name", type: "text" },
                email: { label: "Email", type: "text" },
            },
            async authorize(credentials) {
                if (!credentials?.walletAddress) return null;

                // The verification is already done in /api/auth/wallet-login
                // We just trust the credentials passed here since it's an internal call
                return {
                    id: credentials.id,
                    walletAddress: credentials.walletAddress,
                    role: credentials.role,
                    name: credentials.name || credentials.walletAddress,
                    email: credentials.email || "",
                };
            },
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.userId = user.id;
                token.walletAddress = user.walletAddress;
                token.role = user.role;
                token.email = user.email;
                token.name = user.name;
            }
            if (trigger === "update" && session?.role) {
                token.role = session.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.userId as string;
                session.user.walletAddress = token.walletAddress as string | null;
                session.user.role = token.role as string | null;
                session.user.name = token.name as string;
                session.user.email = token.email as string;
            }
            return session;
        },
    },
    pages: {
        signIn: "/",
    },
});

export { handler as GET, handler as POST };
