import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemePicker } from "@/components/theme-picker";
import { BootOverlay } from "@/components/boot-overlay";
import "./globals.css";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap"
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-mono",
  display: "swap"
});

export const metadata: Metadata = {
  title: "JARVIS · Personal Intelligence Core",
  description: "Personal AI operating system for captured knowledge, plans, and briefings."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${displayFont.variable} ${monoFont.variable}`}>
      <body>
        <ThemeProvider>
          <BootOverlay />
          <ThemePicker />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
