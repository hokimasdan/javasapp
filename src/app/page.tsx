'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      alert('Gagal Masuk: ' + error.message)
    } else {
      // Pindah ke Ruang Utama setelah berhasil login
      router.push('/dashboard') 
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-primary px-4">
      <div className="text-center mb-8 flex flex-col items-center">
        <div className="bg-white p-4 rounded-full mb-4 shadow-lg">
          <img src="/logo.png" alt="Logo Javas" className="h-24 w-24 object-contain" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Selamat Datang di Javasapp</h1>
        <p className="text-primary-light text-sm mt-1">Sistem Manajemen Javas Nursery</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-primary mb-1 text-black">Email</label>
            <input 
              type="email" 
              placeholder="nama@email.com" 
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-black outline-none focus:ring-2 focus:ring-primary/50 transition-all bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-primary mb-1 text-black">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-black outline-none focus:ring-2 focus:ring-primary/50 transition-all bg-white"
            />
          </div>

          <button 
            onClick={handleLogin}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-xl transition duration-300 shadow-lg mt-2"
          >
            Masuk Sekarang
          </button>
        </div>
      </div>
    </div>
  )
}