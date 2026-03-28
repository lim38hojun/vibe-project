import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";

import { Header } from "@/components/Header";
import { AuthProvider } from "@/contexts/AuthContext";

import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "나만의 일기장",
  description: "감정과 기록을 일기로 남기는 개인용 웹 앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-slate-50 font-sans text-slate-800 dark:bg-[#021a18] dark:text-slate-100">
        <AuthProvider>
          <Header />
          <main className="flex flex-1 flex-col bg-slate-50 dark:bg-[#021a18]">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
