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

import { AntdRegistry } from '@ant-design/nextjs-registry';
import MainLayout from '@/components/MainLayout';
import { Providers } from '@/components/Providers';
import '@ant-design/v5-patch-for-react-19'; // 兼容 React 19

export const metadata: Metadata = {
  title: "实验报告提交系统",
  description: "用于学生提交实验报告的在线系统",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AntdRegistry>
          <Providers>
            <MainLayout>{children}</MainLayout>
          </Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
