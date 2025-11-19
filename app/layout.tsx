import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Mail } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cold Email Outreach",
  description: "Personal tool for freelance web dev outreach",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-6 w-6 text-blue-600" />
                <span className="font-bold text-xl text-gray-900">Outreach</span>
              </div>
              <nav className="flex gap-6">
                <Link href="/" className="text-gray-600 hover:text-blue-600 font-medium">
                  Dashboard
                </Link>
                <Link href="/leads" className="text-gray-600 hover:text-blue-600 font-medium">
                  Leads
                </Link>
                <Link href="/templates" className="text-gray-600 hover:text-blue-600 font-medium">
                  Templates
                </Link>
                <Link href="/campaigns" className="text-gray-600 hover:text-blue-600 font-medium">
                  Campaigns
                </Link>
                <Link href="/settings" className="text-gray-600 hover:text-blue-600 font-medium">
                  Settings
                </Link>
              </nav>
            </div>
          </header>
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
