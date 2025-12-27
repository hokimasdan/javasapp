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

  // 1. Ambil Data User (Nama & Role) dari Database
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('full_name, role')
            .eq('id', user.id)
            .single()
          
          if (!error && data) {
            setUserData({
              name: data.full_name || 'User',
              role: data.role?.toLowerCase() || 'kasir'
            })
          }
        }
      } catch (err) {
        console.error("Error fetching user info:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchUserData()
  }, [])

  const handleLogout = async () => {
    const confirmLogout = confirm("Yakin ingin keluar dari aplikasi?")
    if (confirmLogout) {
      await supabase.auth.signOut()
      router.push('/')
    }
  }

  // 2. Menu Items (Role disesuaikan: 'admin' & 'kasir')
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
      {/* --- HEADER MOBILE --- */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-[60]">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary overflow-hidden">
            <img src="/logoj.png" className="w-full h-full object-cover" alt="Logo" />
          </div>
          <span className="font-black text-primary text-sm tracking-tight uppercase">Javas Nursery</span>
        </div>
        <button 
          onClick={toggleMenu}
          className="p-2 rounded-xl bg-slate-100 text-slate-600 active:scale-90 transition-all"
        >
          <span className="material-symbols-outlined text-2xl">{isOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* --- OVERLAY MOBILE --- */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] md:hidden animate-in fade-in duration-300"
          onClick={toggleMenu}
        />
      )}

      {/* --- SIDEBAR UTAMA --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-[80] w-72 bg-white border-r border-slate-200 flex flex-col h-screen transition-transform duration-500 ease-in-out
        md:translate-x-0 md:static md:w-64 md:flex-shrink-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* Brand/Logo (Desktop) */}
        <div className="p-6 hidden md:flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary overflow-hidden shadow-lg shadow-primary/20">
            <img src="/logoj.png" className="w-full h-full object-cover" alt="Logo" />
          </div>
          <div>
            <h1 className="text-primary font-black text-lg tracking-tighter leading-none">JAVAS</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Management</p>
          </div>
        </div>

        {/* Navigasi Menu */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            // Shimmer Loading sederhana agar tidak blank
            <div className="space-y-4 px-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 w-full bg-slate-50 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : (
            menuItems.map((item) => {
              // Validasi Role
              if (userData && !item.roles.includes(userData.role)) return null

              const isActive = pathname === item.href
              return (
                <Link 
                  key={item.href}
                  href={item.href} 
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${
                    isActive 
                      ? 'bg-primary text-white shadow-xl shadow-primary/30 scale-[1.02]' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-primary'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[22px] ${isActive ? 'fill-1' : ''}`}>
                    {item.icon}
                  </span>
                  <span className="text-sm font-bold tracking-tight">{item.name}</span>
                </Link>
              )
            })
          )}
        </nav>

        {/* Profile & Logout Section */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          {/* Info User Dinamis */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm mb-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs border border-primary/20 uppercase">
              {userData?.name.substring(0, 2) || '??'}
            </div>
            <div className="flex flex-col overflow-hidden text-left">
              <p className="text-sm font-black text-slate-800 truncate">
                {loading ? 'Memuat...' : userData?.name}
              </p>
              <p className="text-[9px] text-primary font-black uppercase tracking-widest leading-none">
                {userData?.role || 'Guest'}
              </p>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all font-black text-sm group active:scale-95"
          >
            <span className="material-symbols-outlined text-[22px] group-hover:rotate-12 transition-transform">logout</span>
            Keluar
          </button>
        </div>
      </aside>
    </>
  )
}