'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function StokPage() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  
  const [formData, setFormData] = useState({
    id: null,
    sku: '',
    name: '',
    category_id: '',
    cost_price: 0,
    price: 0,
    reseller_price: 0,
    stock: 0,
    image_url: ''
  })

  // Perbaikan Query: Mengantisipasi jika join category gagal agar produk tetap muncul
  const fetchData = async () => {
    setLoading(true)
    try {
      // Kita ambil data produk dan categories secara terpisah jika join bermasalah
      const { data: p, error: pErr } = await supabase
        .from('products')
        .select('*, categories(name)')
        .order('created_at', { ascending: false })
      
      if (pErr) throw pErr

      const { data: c } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true })

      setProducts(p || [])
      setCategories(c || [])
    } catch (err: any) {
      console.error("Fetch Error:", err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const downloadTemplate = () => {
    const headers = "sku,name,category_id,cost_price,price,reseller_price,stock\n";
    const example = "AGL-001,Aglonema Suksom,PASTE_ID_KATEGORI_DISINI,35000,55000,50000,10";
    const blob = new Blob([headers + example], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_stok_javas.csv';
    a.click();
  }

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split('\n').slice(1);
        const newProducts = rows.filter(row => row.trim() !== '').map(row => {
          const [sku, name, category_id, cost_price, price, reseller_price, stock] = row.split(',');
          return { 
            sku, name, category_id, 
            cost_price: Number(cost_price), 
            price: Number(price), 
            reseller_price: Number(reseller_price), 
            stock: Number(stock) 
          };
        });

        const { error } = await supabase.from('products').insert(newProducts);
        if (error) throw error
        
        alert(`Berhasil! ${newProducts.length} produk ditambahkan secara massal.`);
        fetchData();
      } catch (err: any) {
        alert('Gagal Upload CSV: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    
    try {
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
                const { error: upErr } = await supabase.storage.from('products').upload(fileName, blob)
                if (upErr) throw upErr
                
                const { data } = supabase.storage.from('products').getPublicUrl(fileName)
                setFormData({ ...formData, image_url: data.publicUrl })
                alert('Foto berhasil diupload ke server!')
              }
            }, 'image/jpeg', 0.7)
          }
        }
      }
    } catch (err: any) {
      alert('Gagal Upload Foto: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { id, ...payload } = formData
      const { error } = id 
        ? await supabase.from('products').update(payload).eq('id', id)
        : await supabase.from('products').insert([payload])
      
      if (error) throw error

      alert(id ? 'Produk berhasil diperbarui!' : 'Produk baru berhasil disimpan!')
      
      // Reset Form & Refresh Data
      setFormData({ id: null, sku: '', name: '', category_id: '', cost_price: 0, price: 0, reseller_price: 0, stock: 0, image_url: '' })
      await fetchData() // Pastikan data ditarik ulang
      setShowForm(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: any) {
      alert('Gagal Simpan Produk: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Perbaikan Filter: Memastikan tidak error jika p.categories null
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search) || 
    p.categories?.name?.toLowerCase().includes(search) ||
    p.sku?.toLowerCase().includes(search)
  )

  return (
    <div className="min-h-screen pb-24 md:pb-8 bg-slate-50 p-4 md:p-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-primary uppercase">Manajemen Stok</h1>
          <p className="text-slate-500 text-sm font-bold">Total {products.length} koleksi tanaman</p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <button onClick={downloadTemplate} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 active-scale shadow-sm">
            <span className="material-symbols-outlined text-sm">download</span> Template CSV
          </button>
          <label className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 cursor-pointer shadow-lg active-scale">
            <span className="material-symbols-outlined text-sm">upload_file</span> CSV Massal
            <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
          </label>
          <button 
            onClick={() => { setShowForm(!showForm); if(!showForm) setFormData({id:null, sku: '', name:'', category_id:'', cost_price: 0, price:0, reseller_price:0, stock:0, image_url:''}) }} 
            className="bg-primary text-white px-6 py-3 rounded-2xl font-black uppercase text-xs flex items-center gap-2 active-scale shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-xl">{showForm ? 'close' : 'add_circle'}</span>
            {showForm ? 'Batal' : 'Tambah Produk'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* FORM TAMBAH/EDIT */}
        <div className={`${showForm ? 'block' : 'hidden'} lg:block lg:col-span-1 sticky top-8 z-20`}>
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100">
            <h3 className="font-black mb-6 text-primary flex items-center gap-2 uppercase tracking-tight">
              <span className="material-symbols-outlined">{formData.id ? 'edit_note' : 'add_task'}</span>
              {formData.id ? 'Edit Produk' : 'Produk Baru'}
            </h3>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="relative group mx-auto w-32 h-32 mb-6 text-center">
                <div className="w-full h-full rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden shadow-inner">
                  {formData.image_url ? (
                    <img src={formData.image_url} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-4xl text-slate-300">image</span>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 bg-primary text-white p-2.5 rounded-2xl shadow-xl cursor-pointer active-scale">
                  <span className="material-symbols-outlined text-sm">photo_camera</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Kode SKU</label>
                   <input required type="text" placeholder="AGL-001" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20" value={formData.sku} onChange={(e)=>setFormData({...formData, sku: e.target.value})} />
                </div>
                
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Nama Tanaman</label>
                   <input required type="text" placeholder="Nama lengkap..." className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm outline-none focus:ring-2 focus:ring-primary/20" value={formData.name} onChange={(e)=>setFormData({...formData, name: e.target.value})} />
                </div>

                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Kategori</label>
                   <select required className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm outline-none appearance-none" value={formData.category_id} onChange={(e)=>setFormData({...formData, category_id: e.target.value})}>
                     <option value="">-- Pilih --</option>
                     {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Harga Modal</label>
                    <input required type="number" className="w-full p-4 bg-orange-50 rounded-2xl border-none text-sm font-bold text-orange-700 outline-none" value={formData.cost_price || ''} onChange={(e)=>setFormData({...formData, cost_price: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Stok</label>
                    <input required type="number" className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm font-black outline-none" value={formData.stock || ''} onChange={(e)=>setFormData({...formData, stock: Number(e.target.value)})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Harga Umum</label>
                    <input required type="number" className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm font-bold outline-none" value={formData.price || ''} onChange={(e)=>setFormData({...formData, price: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Reseller</label>
                    <input required type="number" className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm font-bold outline-none" value={formData.reseller_price || ''} onChange={(e)=>setFormData({...formData, reseller_price: Number(e.target.value)})} />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-primary text-white font-black py-5 rounded-[2rem] shadow-lg shadow-primary/20 active-scale transition-all uppercase text-xs mt-4">
                {loading ? 'MEMPROSES...' : formData.id ? 'UPDATE PRODUK' : 'SIMPAN PRODUK'}
              </button>
            </form>
          </div>
        </div>

        {/* DAFTAR PRODUK (TABLE) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center gap-3 sticky top-4 z-10">
            <span className="material-symbols-outlined text-slate-400 ml-2">search</span>
            <input type="text" placeholder="Cari nama, SKU, atau kategori..." className="flex-1 outline-none text-sm font-bold bg-transparent" onChange={(e) => setSearch(e.target.value.toLowerCase())} />
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
                    <th className="px-8 py-6">Produk</th>
                    <th className="px-8 py-6">Kategori</th>
                    <th className="px-8 py-6 text-right">Harga (Modal/Jual)</th>
                    <th className="px-8 py-6 text-center">Stok</th>
                    <th className="px-8 py-6 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <span className="material-symbols-outlined text-6xl text-slate-200">potted_plant</span>
                        <p className="text-slate-400 font-bold mt-2 uppercase text-xs">Belum ada data tanaman</p>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden shadow-sm border border-white">
                              <img src={p.image_url || '/placeholder.png'} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-primary bg-primary-light px-2 py-0.5 rounded-lg inline-block mb-1">{p.sku || 'NO-SKU'}</p>
                              <p className="font-black text-slate-800 leading-tight">{p.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-4 uppercase font-black text-[10px] text-slate-400 tracking-tighter">
                          {p.categories?.name || 'Umum'}
                        </td>
                        <td className="px-8 py-4 text-right">
                          <p className="font-black text-slate-800 text-sm">Rp {p.price.toLocaleString()}</p>
                          <p className="text-[10px] text-orange-500 font-bold leading-none">Modal: Rp {p.cost_price.toLocaleString()}</p>
                        </td>
                        <td className="px-8 py-4 text-center">
                          <span className={`px-4 py-1.5 rounded-xl font-black text-xs ${p.stock <= 5 ? 'bg-red-50 text-red-500 shadow-sm border border-red-100' : 'bg-slate-50 text-slate-600'}`}>
                            {p.stock}
                          </span>
                        </td>
                        <td className="px-8 py-4 text-center">
                          <button onClick={() => { setFormData(p); setShowForm(true); window.scrollTo({top:0, behavior:'smooth'}) }} className="w-10 h-10 rounded-xl text-slate-300 hover:text-primary hover:bg-primary-light transition-all active-scale">
                            <span className="material-symbols-outlined text-xl">edit_square</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}