'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function PengaturanPage() {
  const [loading, setLoading] = useState(false)
  const [storeData, setStoreData] = useState({
    store_name: '',
    address: '',
    phone: '',
    logo_url: ''
  })

  // 1. Fungsi Ambil Data Toko
  const fetchStoreSettings = async () => {
    const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single()
    if (data) {
      setStoreData({
        store_name: data.store_name || '',
        address: data.address || '',
        phone: data.phone || '',
        logo_url: data.logo_url || ''
      })
    }
  }

  useEffect(() => { fetchStoreSettings() }, [])

  // 2. Fungsi Upload & Kompres Logo (Max 100kb, Persegi)
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      // Logika Kompresi Sederhana via Canvas (Tanpa Library Luar agar Aman di Vercel)
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event: any) => {
        const img = new Image()
        img.src = event.target.result
        img.onload = async () => {
          const canvas = document.createElement('canvas')
          const size = Math.min(img.width, img.height)
          canvas.width = 500 // Ukuran standar logo (persegi)
          canvas.height = 500
          
          const ctx = canvas.getContext('2d')
          if (ctx) {
            // Crop Tengah Otomatis
            ctx.drawImage(img, (img.width - size)/2, (img.height - size)/2, size, size, 0, 0, 500, 500)
            
            // Konversi ke Blob (Kompresi Kualitas 0.7 agar < 100kb)
            canvas.toBlob(async (blob) => {
              if (blob) {
                const fileName = `logo_store_${Date.now()}.jpg`
                const { data: uploadData, error: uploadError } = await supabase.storage
                  .from('assets')
                  .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true })

                if (uploadError) throw uploadError

                // Ambil URL Publik
                const { data: urlData } = supabase.storage.from('assets').getPublicUrl(fileName)
                setStoreData({ ...storeData, logo_url: urlData.publicUrl })
                alert('Logo berhasil diproses dan diupload!')
              }
            }, 'image/jpeg', 0.7)
          }
        }
      }
    } catch (err: any) {
      alert('Gagal upload logo: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // 3. Fungsi Simpan Teks Identitas
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { error } = await supabase
      .from('settings')
      .update(storeData)
      .eq('id', 1)

    setLoading(false)
    if (error) alert('Gagal menyimpan: ' + error.message)
    else alert('Pengaturan toko berhasil diperbarui!')
  }

  return (
    <div className="p-8 bg-background-light min-h-screen text-black">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 text-center lg:text-left">
          <h1 className="text-3xl font-bold text-primary tracking-tight">Profil & Identitas Toko</h1>
          <p className="text-slate-500">Data ini akan muncul di Struk Belanja dan Invoice Javas Nursery.</p>
        </header>

        <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 overflow-hidden">
          <form onSubmit={handleSaveSettings} className="grid grid-cols-1 md:grid-cols-3">
            
            {/* KOLOM KIRI: Upload Logo */}
            <div className="p-8 bg-emerald-50/50 border-r border-emerald-50 flex flex-col items-center justify-center text-center">
              <div className="relative group">
                <div className="w-40 h-40 bg-white rounded-3xl border-2 border-dashed border-emerald-200 flex items-center justify-center overflow-hidden shadow-inner mb-4">
                  {storeData.logo_url ? (
                    <img src={storeData.logo_url} alt="Logo Toko" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-4xl text-emerald-200">add_photo_alternate</span>
                  )}
                </div>
                <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-all rounded-3xl">
                  <span className="text-white text-xs font-bold">GANTI LOGO</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
              </div>
              <h4 className="font-bold text-primary mb-1 uppercase text-xs">Logo Toko</h4>
              <p className="text-[10px] text-slate-400">Otomatis persegi & kompres <br/> (Maks 100kb)</p>
            </div>

            {/* KOLOM KANAN: Detail Toko */}
            <div className="md:col-span-2 p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-primary uppercase mb-2 tracking-widest">Nama Toko Resmi</label>
                  <input 
                    required type="text" 
                    value={storeData.store_name}
                    className="w-full border-b-2 border-emerald-50 p-2 outline-none focus:border-primary bg-transparent text-lg font-bold transition-all"
                    onChange={(e) => setStoreData({...storeData, store_name: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-primary uppercase mb-2 tracking-widest">Nomor Kontak / WA</label>
                  <input 
                    required type="text" 
                    value={storeData.phone}
                    className="w-full border-b-2 border-emerald-50 p-2 outline-none focus:border-primary bg-transparent font-mono transition-all"
                    onChange={(e) => setStoreData({...storeData, phone: e.target.value})}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-primary uppercase mb-2 tracking-widest">Alamat Lengkap Toko</label>
                  <textarea 
                    required rows={3}
                    value={storeData.address}
                    className="w-full border-2 border-emerald-50 rounded-2xl p-4 outline-none focus:border-primary bg-emerald-50/20 transition-all text-sm"
                    onChange={(e) => setStoreData({...storeData, address: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50">
                <button 
                  type="submit" disabled={loading}
                  className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-primary-dark transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">save</span>
                  {loading ? 'Menyimpan...' : 'SIMPAN IDENTITAS TOKO'}
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}