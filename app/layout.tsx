import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./providers";
import Header from "./components/Header";
import Footer from "./components/Footer";
import CsrfInitializer from "./components/CsrfInitializer";
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ToolUnity - Tool Sharing Marketplace",
  description: "Rent tools from your community or earn money from your idle tools. Tool owners keep 80% of every rental. Verified users only, owner approval required. No membership fees.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <CsrfInitializer />
          <div className="flex flex-col min-h-screen">
            <Header />
            <div className="bg-red-50 border-b-2 border-red-300 px-4 py-3 text-center text-red-800">
              <p className="text-sm font-medium">
                We're aware of a signup issue affecting some users. We're actively working on a fix. If you're unable to sign up, please contact{' '}
                <a href="mailto:support@toolunity.co.uk" className="underline hover:text-red-900 font-semibold">
                  support@toolunity.co.uk
                </a>
              </p>
            </div>
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </div>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
