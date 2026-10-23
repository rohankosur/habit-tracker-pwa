import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import ThemeProvider from "@/components/ThemeProvider";
import { DeviceLayoutProvider } from "@/contexts/DeviceLayoutContext";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import Navigation from "@/components/Navigation";
import AmbientParticles from "@/components/AmbientParticles";
import DeviceMainContainer from "@/components/DeviceMainContainer";

const fontSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const fontSerif = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Reflect | Daily Habit & Reflection Tracker",
  description: "Precision technical blueprint habit and reflection tracker.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Reflect",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#050711",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontMono.variable} ${fontSerif.variable} h-full antialiased max-w-full overflow-x-hidden`}
    >
      <body className="min-h-full flex flex-col bg-substrate-bg text-slate-200 font-sans relative max-w-full overflow-x-hidden touch-pan-y">
        <AuthProvider>
          <DeviceLayoutProvider>
            <ThemeProvider>
              <AmbientParticles />
              <ServiceWorkerRegister />
              <Navigation />
              <DeviceMainContainer>
                {children}
              </DeviceMainContainer>
            </ThemeProvider>
          </DeviceLayoutProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
