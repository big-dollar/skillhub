import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { SiteLayout } from "@/components/layout/site-layout";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SkillHub | 开发者 skill 知识库",
  description: "浏览、分享并发现优质的开发 skill、patterns 与架构指南。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark" style={{ colorScheme: 'dark' }}>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} antialiased bg-background text-foreground`}
      >
        <SiteLayout>
          {children}
        </SiteLayout>
      </body>
    </html>
  );
}
