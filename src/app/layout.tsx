import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Cardigan Incorporated | Therapy Platform",
    template: "%s | Cardigan Incorporated",
  },
  description:
    "A HIPAA-ready therapy marketplace for Florida clients, curated clinicians, membership care, secure messaging, live sessions, and guided between-session support.",
  applicationName: "Cardigan Incorporated",
  manifest: "/manifest.webmanifest",
  metadataBase: new URL("https://cardigan.health"),
  openGraph: {
    title: "Cardigan Incorporated Therapy Platform",
    description:
      "Curated therapy matching, membership care, secure messaging, and live sessions for Florida clients.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">{children}</body>
    </html>
  );
}
