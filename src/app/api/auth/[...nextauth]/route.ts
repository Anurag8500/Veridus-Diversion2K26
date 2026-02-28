import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

// Extend NextAuth types to include our custom fields
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

const handler = NextAuth({
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Missing email or password");
                }

                await connectDB();

                const user = await User.findOne({
                    email: credentials.email.toLowerCase(),
                });

                if (!user) {
                    throw new Error("Invalid credentials");
                }

                const isMatch = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isMatch) {
                    throw new Error("Invalid credentials");
                }

                if (!user.isEmailVerified) {
                    throw new Error("Please verify your email before signing in.");
                }

                // Return the object that NextAuth will store in the JWT
                return {
                    id: (user._id as string).toString(),
                    email: user.email,
                    name: user.name,
                    role: user.role,
                };
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            // Initial sign in: user object is available from authorize()
            if (user) {
                token.userId = user.id;
                token.role = user.role;
                token.email = user.email;
                token.name = user.name;
            }

            // Handle manual session update (e.g. after set-role)
            if (trigger === "update" && session?.role) {
                token.role = session.role;
            }

            return token;
        },
        async session({ session, token }) {
            // Attach custom fields to the session object
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
        signIn: "/signin",
        error: "/auth/error",
    },
});

export { handler as GET, handler as POST };
