import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Altora Service — ERP Layanan & Jasa",
  description: "Aplikasi POS & Manajamen Jasa Altora",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-slate-100 font-sans text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
