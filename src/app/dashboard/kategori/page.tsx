'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function KategoriPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [newCategory, setNewCategory] = useState('')

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name')
    setCategories(data || [])
  }

  useEffect(() => { fetchCategories() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('categories').insert([{ name: newCategory }])
    if (error) alert('Error: ' + error.message)
    else {
      setNewCategory('')
      fetchCategories()
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Hapus kategori ini?')) {
      await supabase.from('categories').delete().eq('id', id)
      fetchCategories()
    }
  }

  return (
    <div className="p-8 bg-background-light min-h-screen text-black">
      <h1 className="text-3xl font-bold text-primary mb-6">Manajemen Kategori</h1>
      
      {/* Form Tambah */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-8 bg-white p-4 rounded-2xl shadow-sm border border-emerald-100">
        <input 
          required type="text" value={newCategory}
          placeholder="Nama kategori baru (misal: Tanaman Gantung)"
          className="flex-1 border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-primary"
          onChange={(e) => setNewCategory(e.target.value)}
        />
        <button type="submit" className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold">Tambah</button>
      </form>

      {/* Daftar Kategori */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat: any) => (
          <div key={cat.id} className="bg-white p-4 rounded-xl shadow-sm border border-emerald-50 flex justify-between items-center">
            <span className="font-semibold">{cat.name}</span>
            <button onClick={() => handleDelete(cat.id)} className="text-slate-300 hover:text-red-500">
              <span className="material-symbols-outlined">delete</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}