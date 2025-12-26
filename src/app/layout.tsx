import type { Metadata, Viewport } from "next"; // Tambahkan Viewport
import "./globals.css";

export const metadata: Metadata = {
  title: "Javas Nursery",
  description: "Sistem Manajemen Kasir dan Stok Javas Nursery",
  // Baris di bawah ini bikin HP mendeteksi ini sebagai aplikasi web
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Javas App",
  },
};

// Khusus Next.js 14+, setting warna browser (biar bar atas HP warnanya nyambung)
export const viewport: Viewport = {
  themeColor: "#164e41", // Warna hijau Javas Nursery
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Mencegah user zoom-zoom gak sengaja yang bikin layout berantakan
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="antialiased bg-slate-50 text-slate-900 selection:bg-teal-100">
        {/* Struktur ini penting: 
            Kita bungkus children dengan div yang memastikan 
            tidak ada konten yang 'balapan' keluar layar.
        */}
        <div className="relative min-h-screen overflow-x-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}