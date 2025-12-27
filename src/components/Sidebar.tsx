'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [userData, setUserData] = useState<{ name: string; role: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)
        // 1. Ambil session user yang login
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // 2. Ambil data full_name dan role dari tabel profiles
          const { data, error } = await supabase
            .from('profiles')
            .select('full_name, role')
            .eq('id', user.id)
            .single()
          
          if (!error && data) {
            setUserData({
              name: data.full_name, // Mengambil "Kasir" atau "Masdan" dari DB
              role: data.role ? data.role.toLowerCase() : '' // Paksa ke huruf kecil
            })
          }
        }
      } catch (err) {
        console.error("Gagal load profil:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchUserData()
  }, [])

  const handleLogout = async () => {
    if (confirm("Keluar dari aplikasi Javas Nursery?")) {
      await supabase.auth.signOut()
      router.push('/')
    }
  }

  // 3. DAFTAR MENU (Role disesuaikan dengan database: 'admin' dan 'kasir')
  const menuItems = [
    { name: 'Beranda', href: '/dashboard', icon: 'dashboard', roles: ['admin', 'kasir'] },
    { name: 'Inventaris/Stok', href: '/dashboard/stok', icon: 'inventory_2', roles: ['admin', 'kasir'] },
    { name: 'Tambah Kategori', href: '/dashboard/kategori', icon: 'category', roles: ['admin'] },
    { name: 'Kasir', href: '/dashboard/kasir', icon: 'receipt_long', roles: ['admin', 'kasir'] },
    { name: 'Invoice Grosir', href: '/dashboard/invoice', icon: 'request_quote', roles: ['admin', 'kasir'] },
    { name: 'Laporan', href: '/dashboard/laporan', icon: 'bar_chart', roles: ['admin'] },
    { name: 'Pengaturan', href: '/dashboard/pengaturan', icon: 'settings', roles: ['admin'] },
  ]

  const toggleMenu = () => setIsOpen(!isOpen)

  return (
    <>
      {/* HEADER MOBILE */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-[60]">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary overflow-hidden">
            <img src="/logoj.png" className="w-full h-full object-cover" alt="Logo" />
          </div>
          <span className="font-black text-primary text-sm tracking-tight uppercase">Javas Nursery</span>
        </div>
        <button onClick={toggleMenu} className="p-2 rounded-xl bg-slate-100 text-slate-600">
          <span className="material-symbols-outlined">{isOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* OVERLAY */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] md:hidden" onClick={toggleMenu} />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-[80] w-72 bg-white border-r border-slate-200 flex flex-col h-screen transition-transform duration-300
        md:translate-x-0 md:static md:w-64 md:flex-shrink-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* BRAND LOGO */}
        <div className="p-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary overflow-hidden shadow-lg shadow-primary/20">
            <img src="/logoj.png" className="w-full h-full object-cover" alt="Logo" />
          </div>
          <div>
            <h1 className="text-primary font-black text-lg tracking-tighter leading-none">JAVAS</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Management</p>
          </div>
        </div>

        {/* MENU NAVIGASI */}
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {!loading && userData ? (
            menuItems.map((item) => {
              // Validasi role di sini
              if (!item.roles.includes(userData.role)) return null

              const isActive = pathname === item.href
              return (
                <Link 
                  key={item.href}
                  href={item.href} 
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                  <span className="text-sm font-bold">{item.name}</span>
                </Link>
              )
            })
          ) : (
            <div className="p-4 space-y-3">
              {[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-slate-50 animate-pulse rounded-xl" />)}
            </div>
          )}
        </nav>

        {/* PROFILE SECTION */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 mb-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs uppercase">
              {userData?.name?.substring(0, 2) || '??'}
            </div>
            <div className="flex flex-col overflow-hidden">
              {/* NAMA DIAMBIL DARI DATABASE */}
              <p className="text-sm font-black text-slate-800 truncate">
                {loading ? 'Loading...' : userData?.name}
              </p>
              {/* ROLE DIAMBIL DARI DATABASE */}
              <p className="text-[9px] text-primary font-black uppercase tracking-widest">
                {userData?.role || '...'}
              </p>
            </div>
          </div>

          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all font-black text-sm">
            <span className="material-symbols-outlined text-[22px]">logout</span>
            Keluar Aplikasi
          </button>
        </div>
      </aside>
    </>
  )
}