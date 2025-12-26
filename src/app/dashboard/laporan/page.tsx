'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Interface agar Vercel tidak error (Type Safety)
interface Transaction {
  id: string;
  created_at: string;
  total_price: number;
  payment_method: string;
}

export default function LaporanPage() {
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalTransactions: 0,
    avgOrder: 0
  })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLaporan = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('transactions')
      .select('id, created_at, total_price, payment_method')
      .order('created_at', { ascending: false })

    if (data) {
      setTransactions(data)
      
      const total = data.reduce((sum, item) => sum + Number(item.total_price), 0)
      const count = data.length
      const avg = count > 0 ? total / count : 0

      setStats({
        totalIncome: total,
        totalTransactions: count,
        avgOrder: avg
      })
    }
    setLoading(false)
  }

  useEffect(() => { fetchLaporan() }, [])

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      {/* JUDUL HALAMAN */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-primary tracking-tight">Laporan Keuangan</h1>
        <p className="text-slate-500 text-sm font-medium">Analisis performa Javas Nursery secara real-time.</p>
      </div>

      {/* KPI CARDS (KARTU RINGKASAN) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-10">
        <StatCard 
          label="Total Pendapatan" 
          value={`Rp ${stats.totalIncome.toLocaleString()}`} 
          icon="payments" 
          color="bg-emerald-500"
        />
        <StatCard 
          label="Total Transaksi" 
          value={stats.totalTransactions.toLocaleString()} 
          icon="receipt_long" 
          color="bg-blue-500"
        />
        <StatCard 
          label="Rata-rata Order" 
          value={`Rp ${Math.round(stats.avgOrder).toLocaleString()}`} 
          icon="analytics" 
          color="bg-orange-500"
        />
      </div>

      {/* DAFTAR TRANSAKSI */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm uppercase tracking-widest">
            <span className="material-symbols-outlined text-primary">history</span>
            Transaksi Terakhir
          </h3>
          <button 
            onClick={fetchLaporan}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 active-scale shadow-sm"
          >
            <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>refresh</span>
          </button>
        </div>

        {/* VIEW 1: TABEL (Desktop Only) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <th className="px-8 py-5">ID Transaksi</th>
                <th className="px-8 py-5">Tanggal & Waktu</th>
                <th className="px-8 py-5">Metode</th>
                <th className="px-8 py-5 text-right">Total Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.map((trx) => (
                <tr key={trx.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-5 font-mono text-xs font-bold text-slate-400">
                    #TRX-{trx.id.substring(0, 8)}
                  </td>
                  <td className="px-8 py-5 text-sm font-bold text-slate-600">
                    {new Date(trx.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-[10px] font-black px-3 py-1 bg-slate-100 text-slate-500 rounded-lg uppercase tracking-widest">
                      {trx.payment_method || 'CASH'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right font-black text-primary">
                    Rp {Number(trx.total_price).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* VIEW 2: CARDS (Mobile Only) */}
        <div className="md:hidden divide-y divide-slate-50">
          {transactions.length === 0 && !loading ? (
            <div className="p-10 text-center text-slate-300 italic text-sm">Belum ada transaksi.</div>
          ) : (
            transactions.map((trx) => (
              <div key={trx.id} className="p-5 active:bg-slate-50 transition-colors flex justify-between items-center">
                <div className="space-y-1">
                  <p className="font-black text-slate-800 text-sm uppercase">#TRX-{trx.id.substring(0, 5)}</p>
                  <p className="text-[10px] font-bold text-slate-400">
                    {new Date(trx.created_at).toLocaleString('id-ID', { dateStyle: 'medium' })} • {trx.payment_method?.toUpperCase()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black text-primary">Rp {Number(trx.total_price).toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// Sub-komponen Card agar rapi
function StatCard({ label, value, icon, color }: { label: string, value: string, icon: string, color: string }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-5 active-scale group hover:border-primary/30 transition-all">
      <div className={`${color} w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg`}>
        <span className="material-symbols-outlined text-3xl">{icon}</span>
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-xl font-black text-slate-800 tracking-tight">{value}</h3>
      </div>
    </div>
  )
}