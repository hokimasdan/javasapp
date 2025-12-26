'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      alert("Login Gagal: " + error.message)
    } else {
      // Cek Role di tabel profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user?.id)
        .single()

      alert(`Selamat Datang, Anda masuk sebagai ${profile?.role || 'kasir'}`)
      router.push('/dashboard') // Semuanya ke dashboard, tapi menu akan difilter oleh Sidebar
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl shadow-primary/10 p-8 md:p-12 border border-slate-100">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary rounded-[2rem] flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-primary/30">
            <div className="h-15 w-10 rounded-xl bg-primary overflow-hidden">
        <img src="/logoj.png" className="w-full h-full object-cover" alt="Logo" />
        </div>
          </div>
          <h1 className="text-3xl font-black text-primary tracking-tight">JAVAS APP</h1>
         <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mt-2">Nursery Management System</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">Email Terdaftar</label>
            <input required type="email" placeholder="admin@javas.com" 
              className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-primary font-bold text-sm"
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">Kata Sandi</label>
            <input required type="password" placeholder="••••••••" 
              className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-primary font-bold text-sm"
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>

          <button disabled={loading} type="submit" className="w-full bg-primary text-white py-5 rounded-[2rem] font-black shadow-xl shadow-primary/20 active-scale transition-all mt-4">
            {loading ? 'MENGECEK DATA...' : 'MASUK KE SISTEM'}
          </button>
        </form>

        <p className="text-center text-[10px] text-slate-300 font-bold mt-10 uppercase tracking-widest">
          © 2025 Javasapp v1.0 Developeb By DASA COM
        </p>
      </div>
    </div>
  )
}