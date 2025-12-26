import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Kita pakai 'flex-col' di HP agar Sidebar (Header Mobile) ada di atas, 
    // lalu 'flex-row' di Desktop agar Sidebar ada di samping.
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      
      {/* Sidebar & Mobile Header */}
      <Sidebar />
      
      {/* Area Konten Utama 
          'min-w-0' adalah kunci rahasia: mencegah layout hancur kalau ada tabel lebar.
          'flex-1' memastikan area ini mengambil sisa ruang yang ada.
      */}
      <main className="flex-1 w-full min-w-0 overflow-x-hidden">
        {/* Padding yang adaptif: 
            Di HP (p-4) lebih rapat, di Desktop (p-8/p-10) lebih lega.
        */}
        <div className="p-4 md:p-8 lg:p-10 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}