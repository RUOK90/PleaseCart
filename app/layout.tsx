import type { Metadata } from "next";
import localFont from "next/font/local";
import { ReactNode } from "react";
import { JSX } from "react/jsx-runtime";
import "./globals.css";

const pretendard = localFont({
  src: "../public/fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
});

export const metadata: Metadata = {
  title: "장바구니를 부탁해",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>): JSX.Element {
  return (
    <html lang="ko" className={`${pretendard.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background font-sans break-keep text-foreground">
        {children}
      </body>
    </html>
  );
}
