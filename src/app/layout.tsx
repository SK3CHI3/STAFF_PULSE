import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://yourdomain.com"),
  title: "StaffPulse – Employee Wellness Platform",
  description: "AI-powered employee wellness platform with WhatsApp integration, analytics, and multi-organization support.",
  openGraph: {
    title: "StaffPulse – Employee Wellness Platform",
    description: "AI-powered employee wellness platform with WhatsApp integration, analytics, and multi-organization support.",
    url: "https://yourdomain.com",
    siteName: "StaffPulse",
    images: [
      {
        url: "/logo.svg",
        width: 1200,
        height: 630,
        alt: "StaffPulse Logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "StaffPulse – Employee Wellness Platform",
    description: "AI-powered employee wellness platform with WhatsApp integration, analytics, and multi-organization support.",
    images: ["/logo.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
