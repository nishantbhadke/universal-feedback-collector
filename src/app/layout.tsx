import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Universal Project Review & Contribution Collector",
  description: "A centralized standalone platform for collecting, tracking, and managing project-related reviews, suggestions, contributions, and bug reports.",
  keywords: ["feedback collector", "project reviews", "beta testing logs", "bug tracking system"],
  authors: [{ name: "Nishant Bhadke" }],
  openGraph: {
    title: "Universal Project Review & Contribution Collector",
    description: "Centralized feedback command center for modern software craftsmanship.",
    type: "website"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable} h-full antialiased`}>
      <body className="font-sans min-h-full flex flex-col bg-[#0b0f19] text-gray-100 select-none antialiased">
        <Header />
        <main className="flex-1 w-full max-w-7xl mx-auto py-8">
          {children}
        </main>
        <footer className="border-t border-white/5 py-8 text-center text-xs text-gray-500 font-mono mt-auto">
          <p>© {new Date().getFullYear()} Universal Project Review & Contribution Collector System • Standalone Active Sync</p>
        </footer>
      </body>
    </html>
  );
}
