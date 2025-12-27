'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function PengeluaranPage() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  
  // State Form Tambah Data
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: 'Operasional',
    amount: 0
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false })
      
      if (error) throw error
      setExpenses(data || [])
    } catch (err: any) {
      alert("Gagal ambil data: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // --- LOGIKA STATISTIK ---
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const totalBulanIni = expenses
    .filter(ex => {
      const d = new Date(ex.date)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })
    .reduce((sum, item) => sum + Number(item.amount), 0)

  // Mencari Kategori Terbesar
  const categoryTotals = expenses.reduce((acc: any, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount)
    return acc
  }, {})
  const kategoriTerbesar = Object.keys(categoryTotals).reduce((a, b) => categoryTotals[a] > categoryTotals[b] ? a : b, 'Belum Ada')

  const sisaAnggaran = 20000000 - totalBulanIni // Contoh budget 20jt

  // --- HANDLERS ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('expenses').insert([{
        ...formData,
        user_id: user?.id
      }])
      if (error) throw error
      
      setShowModal(false)
      setFormData({ date: new Date().toISOString().split('T')[0], description: '', category: 'Operasional', amount: 0 })
      fetchData()
    } catch (err: any) {
      alert("Gagal simpan: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredData = expenses.filter(ex => 
    (ex.description.toLowerCase().includes(search.toLowerCase())) &&
    (categoryFilter === '' || ex.category === categoryFilter)
  )

  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-background-light p-6 md:p-10">
      <div className="max-w-7xl mx-auto w-full flex flex-col gap-8">
        
        {/* HEADING */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-[#121716] text-3xl font-black tracking-tight">Catatan Pengeluaran</h2>
            <p className="text-[#688280] text-sm md:text-base">Kelola dan pantau semua biaya nursery secara efisien.</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-xl h-10 px-6 text-sm font-bold transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Tambah Pengeluaran
          </button>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Total Bulan Ini" value={`Rp ${totalBulanIni.toLocaleString()}`} icon="calendar_month" trend="+12%" />
          <StatCard title="Kategori Terbesar" value={kategoriTerbesar} icon="pie_chart" />
          <StatCard title="Sisa Anggaran" value={`Rp ${sisaAnggaran.toLocaleString()}`} icon="savings" trend="Safe" />
        </div>

        {/* FILTERS */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-end bg-white/50 p-4 rounded-xl border border-[#dde4e3]/50 backdrop-blur-sm">
          <div className="flex flex-1 w-full gap-4">
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-3 text-[#688280]">search</span>
              <input 
                className="w-full rounded-xl border border-[#dde4e3] bg-white h-12 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Cari keterangan..."
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select 
              className="w-48 rounded-xl border border-[#dde4e3] bg-white h-12 px-4 text-sm outline-none"
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">Semua Kategori</option>
              <option value="Pembelian Stok">Pembelian Stok</option>
              <option value="Operasional">Operasional</option>
              <option value="Gaji Karyawan">Gaji Karyawan</option>
              <option value="Utilitas">Utilitas</option>
            </select>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white border border-[#dde4e3] rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-[#f8faf9] border-b border-[#dde4e3]">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-[#688280] uppercase">Tanggal</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#688280] uppercase">Keterangan</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#688280] uppercase">Kategori</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#688280] uppercase text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dde4e3]">
              {loading ? (
                <tr><td colSpan={4} className="p-10 text-center animate-pulse">Memuat data...</td></tr>
              ) : filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-primary/[0.02] transition-colors">
                  <td className="px-6 py-4 text-sm text-[#121716] font-medium">{new Date(item.date).toLocaleDateString('id-ID')}</td>
                  <td className="px-6 py-4 text-sm text-[#121716]">{item.description}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${getCatStyle(item.category)}`}>
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#121716] font-bold text-right">Rp {item.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TAMBAH */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-black mb-6 text-primary uppercase">Tambah Pengeluaran</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Tanggal</label>
                <input type="date" required className="w-full p-4 bg-slate-50 rounded-2xl border-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Keterangan</label>
                <input type="text" required placeholder="Contoh: Bayar Listrik" className="w-full p-4 bg-slate-50 rounded-2xl border-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Kategori</label>
                <select className="w-full p-4 bg-slate-50 rounded-2xl border-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option value="Pembelian Stok">Pembelian Stok</option>
                  <option value="Operasional">Operasional</option>
                  <option value="Gaji Karyawan">Gaji Karyawan</option>
                  <option value="Utilitas">Utilitas</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Jumlah (Rp)</label>
                <input type="number" required className="w-full p-4 bg-orange-50 text-orange-700 font-bold rounded-2xl border-none" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 font-bold text-slate-400 uppercase text-xs">Batal</button>
                <button type="submit" className="flex-1 bg-primary text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg shadow-primary/20">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

// Komponen Kecil untuk Kartu
function StatCard({ title, value, icon, trend }: any) {
  return (
    <div className="flex flex-col gap-3 rounded-xl p-6 bg-white border border-[#dde4e3]/60 shadow-sm relative overflow-hidden group">
      <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <span className="material-symbols-outlined text-6xl text-primary">{icon}</span>
      </div>
      <p className="text-[#688280] text-sm font-medium uppercase tracking-wider">{title}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-[#121716] text-2xl font-bold">{value}</p>
        {trend && <span className="text-[#078832] bg-[#078832]/10 px-2 py-0.5 rounded-md text-xs font-bold">{trend}</span>}
      </div>
    </div>
  )
}

function getCatStyle(cat: string) {
  switch (cat) {
    case 'Pembelian Stok': return 'bg-green-100 text-green-800 border-green-200'
    case 'Utilitas': return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'Gaji Karyawan': return 'bg-purple-100 text-purple-800 border-purple-200'
    default: return 'bg-slate-100 text-slate-800 border-slate-200'
  }
}