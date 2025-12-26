'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function LaporanPage() {
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalTransactions: 0,
    avgOrder: 0
  })
  const [transactions, setTransactions] = useState([])

  const fetchLaporan = async () => {
    // 1. Ambil semua data transaksi
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setTransactions(data)
      
      // 2. Hitung statistik (Analogi: Menjumlahkan semua nota di laci)
      const total = data.reduce((sum, item) => sum + Number(item.total_price), 0)
      const count = data.length
      const avg = count > 0 ? total / count : 0

      setStats({
        totalIncome: total,
        totalTransactions: count,
        avgOrder: avg
      })
    }
  }

  useEffect(() => { fetchLaporan() }, [])

  return (
    <div className="p-8 bg-background-light min-h-screen text-black">
      {/* Judul Halaman */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary tracking-tight">Laporan Keuangan</h1>
        <p className="text-slate-500">Analisis performa penjualan Javas Nursery secara real-time.</p>
      </div>

      {/* KPI Cards (Kartu Ringkasan) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 group hover:border-primary transition-all">
          <p className="text-slate-500 text-sm font-medium mb-1">Total Pendapatan</p>
          <h3 className="text-2xl font-bold text-primary font-mono">
            Rp {stats.totalIncome.toLocaleString()}
          </h3>
          <span className="text-[10px] text-green-600 bg-green-100 px-2 py-0.5 rounded-full mt-2 inline-block font-bold">↑ 12.5%</span>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 group hover:border-primary transition-all">
          <p className="text-slate-500 text-sm font-medium mb-1">Total Transaksi</p>
          <h3 className="text-2xl font-bold text-primary font-mono">
            {stats.totalTransactions.toLocaleString()}
          </h3>
          <span className="text-[10px] text-green-600 bg-green-100 px-2 py-0.5 rounded-full mt-2 inline-block font-bold">↑ 8.2%</span>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 group hover:border-primary transition-all">
          <p className="text-slate-500 text-sm font-medium mb-1">Rata-rata Order</p>
          <h3 className="text-2xl font-bold text-primary font-mono">
            Rp {stats.avgOrder.toLocaleString()}
          </h3>
          <span className="text-[10px] text-red-500 bg-red-50 px-2 py-0.5 rounded-full mt-2 inline-block font-bold">↓ 2.1%</span>
        </div>
      </div>

      {/* Tabel Transaksi Terakhir */}
      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
        <div className="p-6 border-b border-emerald-50 flex justify-between items-center">
          <h3 className="font-bold text-lg">Transaksi Terakhir</h3>
          <button className="text-primary text-sm font-bold hover:underline">Lihat Semua</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-emerald-50/50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-primary uppercase">ID Transaksi</th>
                <th className="px-6 py-4 text-xs font-bold text-primary uppercase">Tanggal</th>
                <th className="px-6 py-4 text-xs font-bold text-primary uppercase text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-slate-400">Belum ada transaksi terekam.</td>
                </tr>
              ) : (
                transactions.map((trx: any) => (
                  <tr key={trx.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm">#TRX-{trx.id.substring(0, 5)}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(trx.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-right font-bold font-mono text-primary">
                      Rp {Number(trx.total_price).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}