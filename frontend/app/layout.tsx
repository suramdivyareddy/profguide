import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { UserProvider } from '@/contexts/UserContext'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const sportsWorld = localFont({
  src: "./fonts/Sports World-Regular.otf",
  variable: "--font-sports-world",
});

export const metadata: Metadata = {
  title: {
    default: 'ProfGuide',
    template: '%s | ProfGuide'
  },
  description: 'Find and rate professors at your university',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Funnel+Sans:ital,wght@0,300..800;1,300..800&display=swap" rel="stylesheet" />
      </head>
      <UserProvider>
        <body className={`${geistSans.variable} ${geistMono.variable} ${sportsWorld.variable} antialiased flex flex-col min-h-screen`}>
          <Navbar />
          <main className="flex-1 relative">
            {children}
          </main>
          <Footer />
        </body>
      </UserProvider>
    </html>
  );
}
