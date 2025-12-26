import type { Metadata } from "next";
import "./globals.css";

// Ini adalah informasi judul aplikasi yang muncul di tab browser
export const metadata: Metadata = {
  title: "Javas Nursery - POS System",
  description: "Sistem Manajemen Kasir dan Stok Javas Nursery",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Tukang Ikon: Memanggil Material Symbols agar ikon di Sidebar dan Dashboard muncul */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="antialiased">
        {/* 'children' adalah isi halaman kita (Login atau Dashboard) */}
        {children}
      </body>
    </html>
  );
}