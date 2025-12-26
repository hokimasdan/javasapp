'use client'
import Link from 'next/link'

export default function Sidebar() {
  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      {/* Brand/Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined text-white">potted_plant</span>
        </div>
        <div>
          <h1 className="text-primary font-bold text-lg tracking-tight">JAVAS NURSERY</h1>
          <p className="text-slate-500 text-xs font-medium">Admin Dashboard</p>
        </div>
      </div>

      {/* Navigasi Menu */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary text-white shadow-md shadow-primary/25">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="text-sm font-medium">Beranda</span>
        </Link>
        <Link href="/dashboard/stok" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-primary-light hover:text-primary transition-all">
          <span className="material-symbols-outlined">inventory_2</span>
          <span className="text-sm font-medium">Inventaris/Stok</span>
        </Link>
        <Link href="/dashboard/kategori" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-primary-light hover:text-primary transition-all">
        <span className="material-symbols-outlined">category</span>
        <span className="text-sm font-medium">Tambah Kategori</span>
        </Link>
        <Link href="/dashboard/kasir" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-primary-light hover:text-primary transition-all">
          <span className="material-symbols-outlined">receipt_long</span>
          <span className="text-sm font-medium">Kasir</span>
        </Link>
        <Link href="/dashboard/laporan" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-primary-light hover:text-primary transition-all">
          <span className="material-symbols-outlined">bar_chart</span>
          <span className="text-sm font-medium">Laporan</span>
        </Link>
        <Link href="/dashboard/pengaturan" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-primary-light hover:text-primary transition-all">
        <span className="material-symbols-outlined">settings</span>
        <span className="text-sm font-medium">Pengaturan</span>
        </Link>
      </nav>

      {/* Profile Singkat di Bawah */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-primary-light/50">
          <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">JD</div>
          <div className="flex flex-col overflow-hidden">
            <p className="text-sm font-bold text-slate-800 truncate">Mas Dan</p>
            <p className="text-xs text-slate-500 truncate">Owner</p>
          </div>
        </div>
      </div>
    </aside>
  )
}