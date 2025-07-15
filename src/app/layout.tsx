import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap", // Improves font loading performance
  preload: true,   // Ensures proper preloading
});

export const metadata: Metadata = {
  metadataBase: new URL("https://yourdomain.com"),
  title: "StaffPulse – Nurture Wellbeing, Amplify Performance",
  description: "AI-powered employee wellness platform with WhatsApp integration. Nurture wellbeing, amplify performance through data-driven insights and analytics.",
  openGraph: {
    title: "StaffPulse – Nurture Wellbeing, Amplify Performance",
    description: "AI-powered employee wellness platform with WhatsApp integration. Nurture wellbeing, amplify performance through data-driven insights and analytics.",
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
    title: "StaffPulse – Nurture Wellbeing, Amplify Performance",
    description: "AI-powered employee wellness platform with WhatsApp integration. Nurture wellbeing, amplify performance through data-driven insights and analytics.",
    images: ["/logo.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
