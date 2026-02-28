import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

// Extend NextAuth types for custom session fields
declare module "next-auth" {
    interface Session extends DefaultSession {
        user: {
            id: string;
            role?: string | null;
        } & DefaultSession["user"];
    }

    interface User extends DefaultUser {
        role?: string | null;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        userId?: string;
        role?: string | null;
    }
}

// Wallet-based authentication will be added in Part 2.
// Providers array is intentionally empty.
const handler = NextAuth({
    providers: [],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.userId = user.id;
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
