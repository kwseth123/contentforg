import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import DemoModeWrapper from "@/components/DemoModeWrapper";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ContentForg — B2B Sales Content Engine",
  description: "Generate polished, on-brand sales content powered by AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Providers>
          <DemoModeWrapper>{children}</DemoModeWrapper>
        </Providers>
      </body>
    </html>
  );
}
