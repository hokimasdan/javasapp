'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function StokPage() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  
  // Fitur Baru: State untuk seleksi massal
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  
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

  const fetchData = async () => {
    setLoading(true)
    try {
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

  // --- LOGIKA SELEKSI MASSAL ---
  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredProducts.map(p => p.id))
    }
  }

  // --- LOGIKA HAPUS MASSAL ---
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    
    const confirmDelete = confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} produk terpilih? \n\nPerhatian: Produk yang sudah memiliki riwayat penjualan tidak dapat dihapus untuk menjaga validitas data keuangan.`);
    
    if (!confirmDelete) return

    setLoading(true)
    try {
      // Supabase akan otomatis melakukan 'rollback' (menolak delete) 
      // jika ada data terkait di tabel lain (Foreign Key Constraint)
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', selectedIds)

      if (error) {
        if (error.code === '23503') {
          throw new Error('Beberapa produk tidak bisa dihapus karena sudah ada dalam riwayat penjualan/transaksi. Sebaiknya update stok menjadi 0 saja.')
        }
        throw error
      }

      alert('Berhasil menghapus produk terpilih.')
      setSelectedIds([])
      fetchData()
    } catch (err: any) {
      alert('Gagal Hapus: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // (Fungsi downloadTemplate, handleCSVUpload, handleImageUpload tetap sama seperti sebelumnya)
  const downloadTemplate = () => {
    const headers = "sku,name,category_id,cost_price,price,reseller_price,stock\n";
    const example = "AGL-001,Aglonema Suksom,ID_KATEGORI,35000,55000,50000,10";
    const blob = new Blob([headers + example], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_stok.csv';
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
          return { sku, name, category_id, cost_price: Number(cost_price), price: Number(price), reseller_price: Number(reseller_price), stock: Number(stock) };
        });
        const { error } = await supabase.from('products').insert(newProducts);
        if (error) throw error
        alert(`Berhasil! ${newProducts.length} produk ditambahkan.`);
        fetchData();
      } catch (err: any) { alert('Gagal Upload CSV: ' + err.message); }
      finally { setLoading(false); }
    };
    reader.readAsText(file);
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    try {
      const reader = new FileReader(); reader.readAsDataURL(file);
      reader.onload = (event: any) => {
        const img = new Image(); img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas'); const size = Math.min(img.width, img.height);
          canvas.width = 600; canvas.height = 600; const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, (img.width - size)/2, (img.height - size)/2, size, size, 0, 0, 600, 600)
            canvas.toBlob(async (blob) => {
              if (blob) {
                const fileName = `prod_${Date.now()}.jpg`
                const { error: upErr } = await supabase.storage.from('products').upload(fileName, blob)
                if (upErr) throw upErr
                const { data } = supabase.storage.from('products').getPublicUrl(fileName)
                setFormData({ ...formData, image_url: data.publicUrl })
              }
            }, 'image/jpeg', 0.7)
          }
        }
      }
    } catch (err: any) { alert('Gagal Upload Foto: ' + err.message) }
    finally { setLoading(false) }
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
      alert(id ? 'Produk diperbarui!' : 'Produk disimpan!')
      setFormData({ id: null, sku: '', name: '', category_id: '', cost_price: 0, price: 0, reseller_price: 0, stock: 0, image_url: '' })
      await fetchData()
      setShowForm(false)
    } catch (err: any) { alert('Gagal Simpan: ' + err.message) }
    finally { setLoading(false) }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search) || 
    p.categories?.name?.toLowerCase().includes(search) ||
    p.sku?.toLowerCase().includes(search)
  )

  return (
    <div className="min-h-screen pb-24 md:pb-8 bg-slate-50 p-4 md:p-8 font-sans">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-primary uppercase">Manajemen Stok</h1>
          <p className="text-slate-500 text-sm font-bold">Total {products.length} koleksi tanaman</p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {/* Tombol Hapus Massal - Hanya muncul jika ada yang dipilih */}
          {selectedIds.length > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="bg-red-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 active-scale shadow-lg shadow-red-200"
            >
              <span className="material-symbols-outlined text-sm">delete_sweep</span>
              Hapus ({selectedIds.length})
            </button>
          )}

          <button onClick={downloadTemplate} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 active-scale shadow-sm">
            <span className="material-symbols-outlined text-sm">download</span> Template
          </button>
          <label className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 cursor-pointer shadow-lg active-scale">
            <span className="material-symbols-outlined text-sm">upload_file</span> CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
          </label>
          <button 
            onClick={() => { setShowForm(!showForm); if(!showForm) setFormData({id:null, sku: '', name:'', category_id:'', cost_price: 0, price:0, reseller_price:0, stock:0, image_url:''}) }} 
            className="bg-primary text-white px-6 py-3 rounded-2xl font-black uppercase text-xs flex items-center gap-2 active-scale shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-xl">{showForm ? 'close' : 'add_circle'}</span>
            {showForm ? 'Batal' : 'Tambah'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* FORM (Kiri) */}
        <div className={`${showForm ? 'block' : 'hidden'} lg:block lg:col-span-1 sticky top-8 z-20`}>
           <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100">
             <h3 className="font-black mb-6 text-primary flex items-center gap-2 uppercase tracking-tight">
               <span className="material-symbols-outlined">{formData.id ? 'edit_note' : 'add_task'}</span>
               {formData.id ? 'Edit Produk' : 'Produk Baru'}
             </h3>
             <form onSubmit={handleSave} className="space-y-4">
                <div className="relative group mx-auto w-32 h-32 mb-6">
                  <div className="w-full h-full rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
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

                <div className="space-y-3">
                  <input required placeholder="Kode SKU" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20" value={formData.sku} onChange={(e)=>setFormData({...formData, sku: e.target.value})} />
                  <input required placeholder="Nama Tanaman" className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm outline-none focus:ring-2 focus:ring-primary/20" value={formData.name} onChange={(e)=>setFormData({...formData, name: e.target.value})} />
                  <select required className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm outline-none appearance-none" value={formData.category_id} onChange={(e)=>setFormData({...formData, category_id: e.target.value})}>
                    <option value="">-- Kategori --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <input required type="number" placeholder="Modal" className="p-4 bg-orange-50 rounded-2xl border-none text-sm font-bold text-orange-700 outline-none" value={formData.cost_price || ''} onChange={(e)=>setFormData({...formData, cost_price: Number(e.target.value)})} />
                    <input required type="number" placeholder="Stok" className="p-4 bg-slate-50 rounded-2xl border-none text-sm font-black outline-none" value={formData.stock || ''} onChange={(e)=>setFormData({...formData, stock: Number(e.target.value)})} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input required type="number" placeholder="Harga Jual" className="p-4 bg-slate-50 rounded-2xl border-none text-sm font-bold outline-none" value={formData.price || ''} onChange={(e)=>setFormData({...formData, price: Number(e.target.value)})} />
                    <input required type="number" placeholder="Reseller" className="p-4 bg-slate-50 rounded-2xl border-none text-sm font-bold outline-none" value={formData.reseller_price || ''} onChange={(e)=>setFormData({...formData, reseller_price: Number(e.target.value)})} />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-primary text-white font-black py-5 rounded-[2rem] shadow-lg shadow-primary/20 active-scale uppercase text-xs">
                  {loading ? 'MEMPROSES...' : 'SIMPAN PRODUK'}
                </button>
             </form>
           </div>
        </div>

        {/* TABEL (Kanan) */}
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
                    <th className="px-6 py-6 text-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                        checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="px-4 py-6">Produk</th>
                    <th className="px-4 py-6">Kategori</th>
                    <th className="px-4 py-6 text-right">Harga</th>
                    <th className="px-4 py-6 text-center">Stok</th>
                    <th className="px-4 py-6 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className={`hover:bg-slate-50/50 transition-all ${selectedIds.includes(p.id) ? 'bg-blue-50/30' : ''}`}>
                      <td className="px-6 py-4 text-center">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                          checked={selectedIds.includes(p.id)}
                          onChange={() => handleSelectOne(p.id)}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-4">
                          <img src={p.image_url || '/placeholder.png'} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                          <div>
                            <p className="text-[9px] font-black text-primary bg-blue-50 px-1.5 py-0.5 rounded inline-block mb-1">{p.sku}</p>
                            <p className="font-black text-slate-800 text-sm leading-tight">{p.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 uppercase font-black text-[10px] text-slate-400">
                        {p.categories?.name || 'Umum'}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <p className="font-black text-slate-800 text-sm">Rp {p.price.toLocaleString()}</p>
                        <p className="text-[10px] text-orange-500 font-bold">Modal: {p.cost_price.toLocaleString()}</p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-3 py-1 rounded-lg font-black text-[10px] ${p.stock <= 5 ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-600'}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button onClick={() => { setFormData(p); setShowForm(true); window.scrollTo({top:0, behavior:'smooth'}) }} className="text-slate-300 hover:text-primary active-scale p-2">
                          <span className="material-symbols-outlined text-lg">edit_square</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}