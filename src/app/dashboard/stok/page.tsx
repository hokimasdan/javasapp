'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function StokPage() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  
  // 1. Sinkronkan State dengan Database (Tambah sku dan cost_price)
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
    const { data: p } = await supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false })
    const { data: c } = await supabase.from('categories').select('*').order('name', { ascending: true })
    setProducts(p || [])
    setCategories(c || [])
  }

  useEffect(() => { fetchData() }, [])

  // 2. Fungsi Download Template CSV
  const downloadTemplate = () => {
    const headers = "sku,name,category_id,cost_price,price,reseller_price,stock\n";
    const example = "AGL-001,Aglonema Suksom,ISI_ID_KATEGORI_DISINI,35000,55000,50000,10";
    const blob = new Blob([headers + example], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_stok_javas.csv';
    a.click();
  }

  // 3. Fungsi Upload Massal CSV
  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').slice(1); // Lewati header
      const newProducts = rows.filter(row => row.trim() !== '').map(row => {
        const [sku, name, category_id, cost_price, price, reseller_price, stock] = row.split(',');
        return { 
          sku, 
          name, 
          category_id, 
          cost_price: Number(cost_price), 
          price: Number(price), 
          reseller_price: Number(reseller_price), 
          stock: Number(stock) 
        };
      });

      const { error } = await supabase.from('products').insert(newProducts);
      if (error) alert('Gagal upload massal: ' + error.message);
      else {
        alert(`${newProducts.length} produk berhasil ditambahkan!`);
        fetchData();
      }
      setLoading(false);
    };
    reader.readAsText(file);
  }

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
              if (error) return alert('Gagal upload gambar: ' + error.message)
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
      setFormData({ id: null, sku: '', name: '', category_id: '', cost_price: 0, price: 0, reseller_price: 0, stock: 0, image_url: '' })
      fetchData()
      setShowForm(false)
      if (!id) window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    setLoading(false)
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search) || 
    p.categories?.name.toLowerCase().includes(search) ||
    p.sku?.toLowerCase().includes(search)
  )

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* HEADER UTAMA DENGAN TOMBOL CSV */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary">Stok Tanaman</h1>
          <p className="text-slate-500 text-sm">Ada {products.length} koleksi di Javas Nursery</p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <button onClick={downloadTemplate} className="bg-white border border-primary text-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 active-scale">
            <span className="material-symbols-outlined text-sm">download</span> Template CSV
          </button>
          <label className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg active-scale">
            <span className="material-symbols-outlined text-sm">upload_file</span> CSV Massal
            <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
          </label>
          <button 
            onClick={() => { setShowForm(!showForm); if(!showForm) setFormData({id:null, sku: '', name:'', category_id:'', cost_price: 0, price:0, reseller_price:0, stock:0, image_url:''}) }} 
            className="bg-primary text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 active-scale shadow-lg"
          >
            <span className="material-symbols-outlined text-xl">{showForm ? 'close' : 'add_circle'}</span>
            {showForm ? 'Batal' : 'Tambah Baru'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* FORM INPUT DENGAN KOLOM BARU */}
        <div className={`${showForm ? 'block' : 'hidden'} lg:block lg:col-span-1 sticky top-24 z-20`}>
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <h3 className="font-bold mb-5 text-primary flex items-center gap-2">
              <span className="material-symbols-outlined">{formData.id ? 'edit_note' : 'add_task'}</span>
              {formData.id ? 'Edit Produk' : 'Produk Baru'}
            </h3>
            
            <form onSubmit={handleSave} className="space-y-4">
              {/* Upload Image Section (Sama seperti sebelumnya) */}
              <div className="relative group mx-auto w-32 h-32 mb-6 text-center">
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

              <input required type="text" placeholder="SKU (Contoh: AGL-001)" className="w-full p-3.5 bg-slate-50 rounded-2xl border border-transparent focus:border-primary text-sm font-bold" value={formData.sku} onChange={(e)=>setFormData({...formData, sku: e.target.value})} />
              
              <input required type="text" placeholder="Nama Tanaman" className="w-full p-3.5 bg-slate-50 rounded-2xl border border-transparent focus:border-primary text-sm" value={formData.name} onChange={(e)=>setFormData({...formData, name: e.target.value})} />

              <select required className="w-full p-3.5 bg-slate-50 rounded-2xl border border-transparent focus:border-primary text-sm appearance-none" value={formData.category_id} onChange={(e)=>setFormData({...formData, category_id: e.target.value})}>
                <option value="">Pilih Kategori</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              <div className="grid grid-cols-1 gap-3">
                <input required type="number" placeholder="Harga Modal (Cost)" className="w-full p-3.5 bg-orange-50 rounded-2xl border border-transparent focus:border-orange-500 text-sm" value={formData.cost_price || ''} onChange={(e)=>setFormData({...formData, cost_price: Number(e.target.value)})} />
                <div className="grid grid-cols-2 gap-2">
                  <input required type="number" placeholder="Harga Umum" className="w-full p-3.5 bg-slate-50 rounded-2xl border border-transparent focus:border-primary text-sm" value={formData.price || ''} onChange={(e)=>setFormData({...formData, price: Number(e.target.value)})} />
                  <input required type="number" placeholder="Harga Reseller" className="w-full p-3.5 bg-slate-50 rounded-2xl border border-transparent focus:border-primary text-sm" value={formData.reseller_price || ''} onChange={(e)=>setFormData({...formData, reseller_price: Number(e.target.value)})} />
                </div>
              </div>

              <input required type="number" placeholder="Jumlah Stok" className="w-full p-3.5 bg-slate-50 rounded-2xl border border-transparent focus:border-primary text-sm font-bold" value={formData.stock || ''} onChange={(e)=>setFormData({...formData, stock: Number(e.target.value)})} />

              <button type="submit" disabled={loading} className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg active-scale">
                {loading ? 'Menyimpan...' : 'SIMPAN PRODUK'}
              </button>
            </form>
          </div>
        </div>

        {/* LIST PRODUK DENGAN SKU */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 sticky top-4 md:top-0 z-30">
            <span className="material-symbols-outlined text-slate-400 ml-2">search</span>
            <input type="text" placeholder="Cari nama, SKU, atau kategori..." className="flex-1 outline-none text-sm font-medium" onChange={(e) => setSearch(e.target.value.toLowerCase())} />
          </div>

          <div className="hidden md:block bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden text-black">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                  <th className="px-6 py-5">Produk</th>
                  <th className="px-6 py-5">Kategori</th>
                  <th className="px-6 py-5 text-right">Harga</th>
                  <th className="px-6 py-5 text-center">Stok</th>
                  <th className="px-6 py-5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4 text-black">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden">
                          <img src={p.image_url || '/placeholder.png'} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-[10px] font-mono font-bold text-slate-400 leading-none">{p.sku}</p>
                          <p className="font-bold text-slate-800">{p.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className="text-[10px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded-full">{p.categories?.name}</span></td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-[9px] text-slate-400 uppercase font-bold leading-none">Price: Rp {p.price.toLocaleString()}</p>
                      <p className="text-[9px] text-orange-400 uppercase font-bold">Cost: Rp {p.cost_price.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-lg font-mono font-bold ${p.stock <= 5 ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-600'}`}>{p.stock}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => { setFormData(p); setShowForm(true); window.scrollTo({top:0, behavior:'smooth'}) }} className="text-slate-300 hover:text-primary active-scale">
                        <span className="material-symbols-outlined">edit_square</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Versi Card Mobile juga akan otomatis mengikuti filter search SKU */}
        </div>
      </div>
    </div>
  )
}