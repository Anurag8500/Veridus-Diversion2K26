import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Web3Provider } from "@/components/Web3Provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VERIDUS | Truth Behind Every Degree",
  description: "A new standard for academic verification. Issue secure digital degrees and verify credentials instantly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `history.scrollRestoration = "manual"`,
          }}
        />
      </head>
      <body className={`${inter.variable} antialiased selection:bg-white/20 selection:text-white bg-background-base text-text-primary`} >
        <AuthProvider>
          <Web3Provider>
            {children}
          </Web3Provider>
        </AuthProvider>
      </body>
    </html>
  );
}
