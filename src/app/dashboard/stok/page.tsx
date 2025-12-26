'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function StokPage() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false) // Toggle form di mobile
  
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    category_id: '',
    price: 0,
    reseller_price: 0,
    stock: 0,
    image_url: ''
  })

  const fetchData = async () => {
    const { data: p } = await supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false })
    const { data: c } = await supabase.from('categories').select('*').order('name', { ascending: true })
    setProducts(p || [])
    setCategories(c || [])
  }

  useEffect(() => { fetchData() }, [])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event: any) => {
      const img = new Image()
      img.src = event.target.result
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const size = Math.min(img.width, img.height)
        canvas.width = 600; canvas.height = 600
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, (img.width - size)/2, (img.height - size)/2, size, size, 0, 0, 600, 600)
          canvas.toBlob(async (blob) => {
            if (blob) {
              const fileName = `prod_${Date.now()}.jpg`
              const { error } = await supabase.storage.from('products').upload(fileName, blob)
              if (error) return alert('Gagal upload gambar')
              const { data } = supabase.storage.from('products').getPublicUrl(fileName)
              setFormData({ ...formData, image_url: data.publicUrl })
            }
          }, 'image/jpeg', 0.7)
        }
        setLoading(false)
      }
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { id, ...payload } = formData
    const { error } = id 
      ? await supabase.from('products').update(payload).eq('id', id)
      : await supabase.from('products').insert([payload])
    
    if (error) alert(error.message)
    else {
      setFormData({ id: null, name: '', category_id: '', price: 0, reseller_price: 0, stock: 0, image_url: '' })
      fetchData()
      setShowForm(false)
      if (!id) window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    setLoading(false)
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search) || 
    p.categories?.name.toLowerCase().includes(search)
  )

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* HEADER UTAMA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary">Stok Tanaman</h1>
          <p className="text-slate-500 text-sm">Ada {products.length} koleksi di Javas Nursery</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => { setShowForm(!showForm); if(!showForm) setFormData({id:null, name:'', category_id:'', price:0, reseller_price:0, stock:0, image_url:''}) }} 
            className="flex-1 md:flex-none bg-primary text-white px-5 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 active-scale shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-xl">{showForm ? 'close' : 'add_circle'}</span>
            {showForm ? 'Batal' : 'Tambah Baru'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* FORM INPUT (Slide down di mobile kalau tombol Tambah diklik) */}
        <div className={`${showForm ? 'block' : 'hidden'} lg:block lg:col-span-1 sticky top-24 z-20`}>
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <h3 className="font-bold mb-5 text-primary flex items-center gap-2">
              <span className="material-symbols-outlined">{formData.id ? 'edit_note' : 'add_task'}</span>
              {formData.id ? 'Edit Data' : 'Tambah Stok'}
            </h3>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="relative group mx-auto w-32 h-32 mb-6">
                <div className="w-full h-full rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                  {formData.image_url ? (
                    <img src={formData.image_url} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-4xl text-slate-300">image</span>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-xl shadow-lg cursor-pointer active-scale">
                  <span className="material-symbols-outlined text-sm">photo_camera</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 ml-2 uppercase">Nama Tanaman</label>
                <input required type="text" className="w-full p-3.5 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary transition-all text-sm" placeholder="Contoh: Aglonema Suksom" value={formData.name} onChange={(e)=>setFormData({...formData, name: e.target.value})} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 ml-2 uppercase">Kategori</label>
                <select required className="w-full p-3.5 bg-slate-50 rounded-2xl outline-none border border-transparent focus:border-primary text-sm appearance-none" value={formData.category_id} onChange={(e)=>setFormData({...formData, category_id: e.target.value})}>
                  <option value="">Pilih Kategori</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 ml-2 uppercase">Harga (Rp)</label>
                  <input required type="number" className="w-full p-3.5 bg-slate-50 rounded-2xl outline-none border border-transparent focus:border-primary text-sm" value={formData.price || ''} onChange={(e)=>setFormData({...formData, price: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 ml-2 uppercase">Stok</label>
                  <input required type="number" className="w-full p-3.5 bg-slate-50 rounded-2xl outline-none border border-transparent focus:border-primary text-sm font-bold" value={formData.stock || ''} onChange={(e)=>setFormData({...formData, stock: Number(e.target.value)})} />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-primary-dark disabled:opacity-50 active-scale mt-2 transition-all">
                {loading ? 'Menyimpan...' : formData.id ? 'UPDATE DATA' : 'SIMPAN STOK'}
              </button>
            </form>
          </div>
        </div>

        {/* DAFTAR PRODUK */}
        <div className="lg:col-span-3 space-y-4">
          {/* SEARCH BAR */}
          <div className="bg-white p-2 md:p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 sticky top-4 md:top-0 z-30">
            <div className="bg-slate-50 p-2 rounded-xl text-slate-400">
              <span className="material-symbols-outlined">search</span>
            </div>
            <input 
              type="text" placeholder="Cari nama tanaman atau kategori..." 
              className="flex-1 outline-none text-sm bg-transparent font-medium"
              onChange={(e) => setSearch(e.target.value.toLowerCase())}
            />
          </div>

          {/* VIEW 1: TABLE (Hanya muncul di Layar Gede / md keatas) */}
          <div className="hidden md:block bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                  <th className="px-6 py-5">Tanaman</th>
                  <th className="px-6 py-5 text-right">Harga</th>
                  <th className="px-6 py-5 text-center">Stok</th>
                  <th className="px-6 py-5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="group hover:bg-slate-50/50 transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden shadow-sm border border-white">
                          <img src={p.image_url || '/placeholder.png'} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{p.name}</p>
                          <span className="text-[10px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded-full uppercase tracking-tighter">
                            {p.categories?.name}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-bold text-slate-800">Rp {p.price.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400 font-medium">Reseller: Rp {p.reseller_price.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={`inline-block px-3 py-1 rounded-xl font-mono font-bold ${p.stock <= 5 ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-600'}`}>
                        {p.stock}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => { setFormData(p); setShowForm(true); window.scrollTo({top:0, behavior:'smooth'}) }} className="p-2 text-slate-300 hover:text-primary active-scale transition-colors">
                        <span className="material-symbols-outlined">edit_square</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* VIEW 2: CARDS (Hanya muncul di Layar Kecil / di bawah md) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredProducts.map((p) => (
              <div key={p.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex gap-4 items-center active:bg-slate-50 transition-colors">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-50">
                  <img src={p.image_url || '/placeholder.png'} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black text-primary bg-primary-light px-2 py-0.5 rounded-lg uppercase mb-1 inline-block tracking-widest">
                      {p.categories?.name}
                    </span>
                    <button onClick={() => { setFormData(p); setShowForm(true); window.scrollTo({top:0, behavior:'smooth'}) }} className="text-slate-300">
                      <span className="material-symbols-outlined text-xl">edit_square</span>
                    </button>
                  </div>
                  <h4 className="font-bold text-slate-800 truncate leading-tight">{p.name}</h4>
                  <div className="flex justify-between items-end mt-2">
                    <div>
                       <p className="text-xs text-slate-400 font-medium line-through decoration-red-300/50">Rp {p.price.toLocaleString()}</p>
                       <p className="text-sm font-extrabold text-primary">Rp {p.reseller_price.toLocaleString()}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-xl text-xs font-black ${p.stock <= 5 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                      STOK: {p.stock}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-6xl text-slate-200">sentiment_dissatisfied</span>
              <p className="text-slate-400 mt-2 font-medium">Tanaman tidak ditemukan...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}