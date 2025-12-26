'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function PengaturanPage() {
  const [users, setUsers] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({ email: '', full_name: '', role: 'kasir' })

  // Fungsi mengambil daftar profil dari database
  const fetchUsers = async () => {
    const { data, error } = await supabase.from('profiles').select('*')
    if (error) console.error(error)
    else setUsers(data || [])
  }

  useEffect(() => { fetchUsers() }, [])

  return (
    <div className="p-8 bg-background-light min-h-screen text-black">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary">Pengaturan Pengguna</h1>
          <p className="text-slate-500">Kelola siapa saja yang bisa mengakses Javasapp</p>
        </div>
        <button 
          onClick={() => alert('Info: Untuk keamanan, pendaftaran akun baru dilakukan melalui Dashboard Supabase > Auth, lalu edit perannya di sini.')}
          className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md"
        >
          <span className="material-symbols-outlined">person_add</span>
          Tambah User Baru
        </button>
      </div>

      {/* Tabel Daftar Pengguna */}
      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-emerald-50 border-b border-emerald-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-primary uppercase">Nama Lengkap</th>
              <th className="px-6 py-4 text-xs font-bold text-primary uppercase">Role / Hak Akses</th>
              <th className="px-6 py-4 text-xs font-bold text-primary uppercase text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-50">
            {users.map((user: any) => (
              <tr key={user.id} className="hover:bg-emerald-50/50 transition-colors">
                <td className="px-6 py-4 font-bold">{user.full_name || 'Tanpa Nama'}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                    user.role === 'pemilik' ? 'bg-purple-100 text-purple-700' :
                    user.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                   <button className="text-slate-300 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">edit_square</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}