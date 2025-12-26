import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background-light">
      {/* Pasang Sidebar di kiri */}
      <Sidebar />
      
      {/* Isi halaman (Beranda/Stok/Kasir) akan muncul di sini */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}