"use client";
import Script from "next/script";

import { useEffect } from 'react';
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import InactivityWrapper from "@/components/auth/InactivityWrapper";

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="corporate" className="h-full">
      <head>
        <Script src="https://subtle-druid-430b16.netlify.app/codemate-badge.js" strategy="lazyOnload" />
      </head>
      <body className="antialiased">
        <InactivityWrapper>
          <div className="flex flex-col min-h-screen bg-base-200">
            <Header />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            <Footer />
          </div>
        </InactivityWrapper>
      </body>
    </html>
  );
}
