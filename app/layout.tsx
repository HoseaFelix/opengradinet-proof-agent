import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ProofAgent — Verifiable AI Agents on OpenGradient",
  description:
    "Create, run, and audit AI agents with cryptographic proof of every decision. Built on OpenGradient's verifiable inference infrastructure.",
  keywords: ["AI", "OpenGradient", "verifiable inference", "TEE", "blockchain", "agents"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
