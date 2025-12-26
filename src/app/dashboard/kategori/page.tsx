'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Interface agar lolos Vercel (Type Safety)
interface Category {
  id: number;
  name: string;
}

export default function KategoriPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false) // Toggle untuk mobile

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name', { ascending: true })
    setCategories(data || [])
  }

  useEffect(() => { fetchCategories() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingId) {
        const { error } = await supabase
          .from('categories')
          .update({ name })
          .eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('categories').insert([{ name }])
        if (error) throw error
      }

      setName('')
      setEditingId(null)
      setShowForm(false)
      fetchCategories()
    } catch (error: any) {
      alert('Terjadi kesalahan: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingId(category.id)
    setName(category.name)
    setShowForm(true) // Otomatis buka form saat edit
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-primary tracking-tight">Manajemen Kategori</h1>
          <p className="text-slate-500 text-sm">Total {categories.length} pengelompokan tanaman.</p>
        </div>
        
        <button 
          onClick={() => { setShowForm(!showForm); if(showForm) { setEditingId(null); setName(''); } }}
          className="md:hidden flex items-center justify-center gap-2 bg-primary text-white font-bold py-3 rounded-2xl active-scale shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined">{showForm ? 'close' : 'add_circle'}</span>
          {showForm ? 'Tutup Form' : 'Tambah Kategori'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* FORM INPUT (KIRI / SLIDE DOWN DI MOBILE) */}
        <div className={`${showForm ? 'block' : 'hidden'} lg:block lg:col-span-1 sticky top-24 z-20`}>
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="text-lg font-black text-primary mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined">{editingId ? 'edit_note' : 'category'}</span>
              {editingId ? 'Edit Kategori' : 'Kategori Baru'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">Nama Kategori</label>
                <input 
                  required 
                  type="text" 
                  placeholder="Contoh: Aglonema, Pupuk..."
                  value={name}
                  className="w-full border-none bg-slate-50 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-primary transition-all text-sm font-bold"
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <button 
                  type="submit" disabled={loading}
                  className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary-dark active-scale transition-all disabled:opacity-50"
                >
                  {loading ? 'MENYIMPAN...' : editingId ? 'UPDATE PERUBAHAN' : 'SIMPAN KATEGORI'}
                </button>
                
                {editingId && (
                  <button 
                    type="button" 
                    onClick={() => { setEditingId(null); setName(''); setShowForm(false); }}
                    className="w-full bg-slate-100 text-slate-500 py-3 rounded-2xl font-bold text-xs active-scale"
                  >
                    BATALKAN EDIT
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* LIST KATEGORI (KANAN) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50 bg-slate-50/30">
              <h3 className="text-sm font-black text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                <span className="material-symbols-outlined text-lg">format_list_bulleted</span>
                Daftar Kategori
              </h3>
            </div>
            
            {/* VIEW TABLE (Desktop) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <th className="px-8 py-4">No</th>
                    <th className="px-8 py-4">Nama Kategori</th>
                    <th className="px-8 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {categories.map((cat, index) => (
                    <tr key={cat.id} className={`group hover:bg-slate-50 transition-all ${editingId === cat.id ? 'bg-primary-light/30' : ''}`}>
                      <td className="px-8 py-5 text-xs text-slate-300 font-mono font-bold">{String(index + 1).padStart(2, '0')}</td>
                      <td className="px-8 py-5 font-bold text-slate-700">{cat.name}</td>
                      <td className="px-8 py-5 text-center">
                        <button 
                          onClick={() => handleEdit(cat)}
                          className="p-2 text-slate-300 hover:text-primary active-scale transition-colors"
                        >
                          <span className="material-symbols-outlined">edit_square</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* VIEW CARDS (Mobile) */}
            <div className="md:hidden divide-y divide-slate-50">
              {categories.length === 0 ? (
                <div className="p-10 text-center text-slate-300 italic text-sm">Belum ada kategori.</div>
              ) : (
                categories.map((cat, index) => (
                  <div key={cat.id} className="flex items-center justify-between p-5 active:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black text-slate-200 font-mono">{index + 1}</span>
                      <span className="font-bold text-slate-700">{cat.name}</span>
                    </div>
                    <button 
                      onClick={() => handleEdit(cat)}
                      className="w-10 h-10 flex items-center justify-center text-slate-300 active-scale"
                    >
                      <span className="material-symbols-outlined text-xl">edit_square</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}