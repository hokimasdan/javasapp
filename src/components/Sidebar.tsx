'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  // 1. Ambil Role User saat komponen dimuat
  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Mengambil role dari tabel 'profiles' berdasarkan ID user
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        setUserRole(data?.role || 'staff')
      }
    }
    fetchUserRole()
  }, [])

  // 2. Fungsi Logout
  const handleLogout = async () => {
    const confirmLogout = confirm("Mas Dan yakin ingin keluar dari aplikasi?")
    if (confirmLogout) {
      await supabase.auth.signOut()
      router.push('/') // Kembali ke halaman Login utama
    }
  }

  // 3. Konfigurasi Menu dengan pembatasan Role
  const menuItems = [
    { name: 'Beranda', href: '/dashboard', icon: 'dashboard', roles: ['admin', 'staff'] },
    { name: 'Inventaris/Stok', href: '/dashboard/stok', icon: 'inventory_2', roles: ['admin', 'staff'] },
    { name: 'Tambah Kategori', href: '/dashboard/kategori', icon: 'category', roles: ['admin'] },
    { name: 'Kasir', href: '/dashboard/kasir', icon: 'receipt_long', roles: ['admin', 'staff'] },
    { name: 'Invoice Grosir', href: '/dashboard/invoice', icon: 'request_quote', roles: ['admin', 'staff'] },
    { name: 'Laporan', href: '/dashboard/laporan', icon: 'bar_chart', roles: ['admin'] },
    { name: 'Pengaturan', href: '/dashboard/pengaturan', icon: 'settings', roles: ['admin'] },
  ]

  const toggleMenu = () => setIsOpen(!isOpen)

  return (
    <>
      {/* --- HEADER MOBILE --- */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-primary overflow-hidden">
        <img src="/logoj.png" className="w-full h-full object-cover" alt="Logo" />
        </div>
          <span className="font-bold text-primary tracking-tight uppercase">Javas Nursery</span>
        </div>
        <button 
          onClick={toggleMenu}
          className="p-2 rounded-lg bg-slate-100 text-slate-600 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined">{isOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* --- OVERLAY MOBILE --- */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in duration-300"
          onClick={toggleMenu}
        />
      )}

      {/* --- SIDEBAR UTAMA --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col h-screen transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static md:w-64 md:flex-shrink-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* Brand/Logo (Desktop) */}
        <div className="p-6 hidden md:flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary overflow-hidden">
          <img src="/logoj.png" className="w-full h-full object-cover" alt="Logo" />
        </div>
          <div>
            <h1 className="text-primary font-black text-lg tracking-tighter">JAVAS NURSERY</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Management</p>
          </div>
        </div>

        {/* Navigasi Menu */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            // Logika Filter Menu: Jika role user tidak ada di daftar roles menu, jangan tampilkan
            if (userRole && !item.roles.includes(userRole)) return null

            const isActive = pathname === item.href
            return (
              <Link 
                key={item.href}
                href={item.href} 
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-primary'
                }`}
              >
                <span className={`material-symbols-outlined text-[22px] ${isActive ? 'fill-1' : ''}`}>
                  {item.icon}
                </span>
                <span className="text-sm font-bold">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Profile & Logout Section */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          {/* Info User */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black shadow-inner">
              {userRole === 'admin' ? 'AD' : 'KS'}
            </div>
            <div className="flex flex-col overflow-hidden text-left">
              <p className="text-sm font-black text-slate-800 truncate">Mas Dan</p>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">
                {userRole || 'Memuat...'}
              </p>
            </div>
          </div>

          {/* Tombol Logout */}
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all font-black text-sm active:scale-95 group"
          >
            <span className="material-symbols-outlined text-[22px] group-hover:rotate-12 transition-transform">logout</span>
            Keluar Aplikasi
          </button>
        </div>
      </aside>
    </>
  )
}