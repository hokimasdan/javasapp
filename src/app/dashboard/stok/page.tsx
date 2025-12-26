'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function StokPage() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([]) // [Langkah 4] State untuk menampung daftar kategori
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    sku: '',
    stock: 0,
    cost_price: 0,
    price: 0,
    reseller_price: 0
  })

  // Fungsi mengambil data produk
  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    if (error) console.log('Error Produk:', error.message)
    else setProducts(data || [])
  }

  // [Langkah 4] Fungsi mengambil daftar kategori dari database
  const fetchCategories = async () => {
    const { data, error } = await supabase.from('categories').select('name').order('name', { ascending: true })
    if (error) console.log('Error Kategori:', error.message)
    else setCategories(data || [])
  }

  // Menjalankan pengambilan data saat halaman dibuka
  useEffect(() => { 
    fetchProducts()
    fetchCategories() // [Langkah 4] Ambil kategori otomatis
  }, [])

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('products').insert([formData])
    
    if (error) {
      alert('Gagal simpan: ' + error.message)
    } else {
      alert('Produk berhasil ditambahkan!')
      setIsModalOpen(false)
      setFormData({ name: '', category: '', sku: '', stock: 0, cost_price: 0, price: 0, reseller_price: 0 })
      fetchProducts()
    }
  }

  return (
    <div className="p-8 bg-background-light min-h-screen relative text-black">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Manajemen Stok</h1>
          <p className="text-slate-500">Kelola inventaris tanaman Javas Nursery</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md"
        >
          <span className="material-symbols-outlined">add</span>
          Tambah Produk
        </button>
      </div>

      {/* Tabel Stok */}
      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-emerald-50 border-b border-emerald-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-primary uppercase">Produk</th>
              <th className="px-6 py-4 text-xs font-bold text-primary uppercase text-right">Stok</th>
              <th className="px-6 py-4 text-xs font-bold text-primary uppercase text-right">Harga Jual</th>
              <th className="px-6 py-4 text-xs font-bold text-primary uppercase text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-50">
            {products.map((item: any) => (
              <tr key={item.id} className="hover:bg-emerald-50/50">
                <td className="px-6 py-4 font-bold">
                  {item.name} <br/>
                  <span className="text-xs font-normal text-slate-400 italic">{item.category || 'Tanpa Kategori'}</span>
                </td>
                <td className="px-6 py-4 text-right font-mono font-bold text-primary">{item.stock}</td>
                <td className="px-6 py-4 text-right font-mono text-slate-700">Rp {item.price.toLocaleString()}</td>
                <td className="px-6 py-4 text-center text-slate-300">
                  <span className="material-symbols-outlined cursor-pointer hover:text-primary transition-colors">edit</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL (KOTAK TAMBAH PRODUK) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-emerald-100 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-emerald-50 flex justify-between items-center bg-emerald-50/30">
              <h2 className="text-xl font-bold text-primary">Tambah Produk Baru</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1 text-black">Nama Produk</label>
                  <input required type="text" className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-primary bg-white text-black"
                    onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1 text-black">Kategori</label>
                  {/* [Langkah 4] Mengubah pilihan manual menjadi mapping dari tabel categories */}
                  <select 
                    required
                    className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-primary bg-white text-black"
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map((cat: any) => (
                      <option key={cat.name} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1 text-black">SKU</label>
                  <input type="text" className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-primary bg-white text-black"
                    onChange={(e) => setFormData({...formData, sku: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1 text-black">Stok Awal</label>
                  <input required type="number" className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-primary bg-white text-black"
                    onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1 text-black">Harga Modal (Rp)</label>
                  <input required type="number" className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-primary font-mono bg-white text-black"
                    onChange={(e) => setFormData({...formData, cost_price: parseInt(e.target.value)})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1 text-black">Harga Jual (Rp)</label>
                  <input required type="number" className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-primary font-mono bg-white text-black"
                    onChange={(e) => setFormData({...formData, price: parseInt(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1 text-black">Harga Reseller (Rp)</label>
                  <input type="number" className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-primary font-mono bg-white text-black"
                    onChange={(e) => setFormData({...formData, reseller_price: parseInt(e.target.value)})} />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors">Batal</button>
                <button type="submit" className="flex-1 bg-primary text-white font-bold py-3 rounded-xl shadow-lg hover:bg-primary-dark transition-colors">Simpan Produk</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}