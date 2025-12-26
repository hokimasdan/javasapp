'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    todaySales: 0,
    totalTrx: 0,
    totalStock: 0,
    lowStockCount: 0
  })
  const [recentTrx, setRecentTrx] = useState([])
  const [lowStockItems, setLowStockItems] = useState([])

  const fetchDashboardData = async () => {
    // 1. Ambil Penjualan Hari Ini
    const today = new Date().toISOString().split('T')[0]
    const { data: todayTrx } = await supabase
      .from('transactions')
      .select('total_price')
      .gte('created_at', today)
    
    const salesSum = todayTrx?.reduce((sum, item) => sum + Number(item.total_price), 0) || 0

    // 2. Ambil Total Stok & Barang Hampir Habis (Stok <= 5)
    const { data: allProducts } = await supabase.from('products').select('stock, name, id')
    const stockSum = allProducts?.reduce((sum, item) => sum + Number(item.stock), 0) || 0
    const lowStock = allProducts?.filter(p => p.stock <= 5) || []

    // 3. Ambil 5 Transaksi Terakhir
    const { data: latest } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    setStats({
      todaySales: salesSum,
      totalTrx: todayTrx?.length || 0,
      totalStock: stockSum,
      lowStockCount: lowStock.length
    })
    setRecentTrx(latest || [])
    setLowStockItems(lowStock)
  }

  useEffect(() => { fetchDashboardData() }, [])

  return (
    <div className="p-8 bg-background-light min-h-screen text-black">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-primary tracking-tight">Selamat Datang, Admin 👋</h1>
        <p className="text-slate-500">Ringkasan aktivitas bisnis Javas Nursery hari ini.</p>
      </header>

      {/* Baris Kartu Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 rounded-xl text-primary">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">+12%</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Penjualan Hari Ini</p>
          <h3 className="text-2xl font-bold text-primary font-mono">Rp {stats.todaySales.toLocaleString()}</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600 w-fit mb-4">
            <span className="material-symbols-outlined">shopping_bag</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Jumlah Transaksi</p>
          <h3 className="text-2xl font-bold text-primary font-mono">{stats.totalTrx}</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100">
          <div className="p-3 bg-teal-50 rounded-xl text-teal-600 w-fit mb-4">
            <span className="material-symbols-outlined">spa</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Total Stok Tanaman</p>
          <h3 className="text-2xl font-bold text-primary font-mono">{stats.totalStock.toLocaleString()}</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-red-50 rounded-xl text-red-600">
              <span className="material-symbols-outlined">warning</span>
            </div>
            <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full">Perhatian</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Stok Rendah (≤ 5)</p>
          <h3 className="text-2xl font-bold text-red-600 font-mono">{stats.lowStockCount} Item</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kolom Kiri: Transaksi Terakhir */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
          <div className="p-6 border-b border-emerald-50 flex justify-between items-center">
            <h3 className="font-bold text-lg">Transaksi Terakhir</h3>
            <button className="text-primary text-sm font-bold hover:underline">Lihat Semua</button>
          </div>
          <table className="w-full text-left">
            <thead className="bg-emerald-50/30">
              <tr className="text-xs text-primary font-bold uppercase">
                <th className="px-6 py-4">ID Order</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50">
              {recentTrx.map((trx: any) => (
                <tr key={trx.id} className="text-sm">
                  <td className="px-6 py-4 font-mono">#TRX-{trx.id.substring(0,5)}</td>
                  <td className="px-6 py-4 font-bold">Rp {Number(trx.total_price).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">LUNAS</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Kolom Kanan: Peringatan Stok */}
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6">
          <div className="flex items-center gap-2 text-red-600 mb-6">
            <span className="material-symbols-outlined">notification_important</span>
            <h3 className="font-bold text-lg">Peringatan Stok</h3>
          </div>
          <div className="space-y-4">
            {lowStockItems.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Semua stok aman.</p>
            ) : (
              lowStockItems.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-red-50 rounded-xl border border-red-100">
                  <span className="text-sm font-bold text-slate-800">{item.name}</span>
                  <span className="text-lg font-mono font-bold text-red-600">{item.stock}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}