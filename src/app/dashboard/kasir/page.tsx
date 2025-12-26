'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function KasirPage() {
  // Memberi label <any[]> agar Satpam TypeScript mengizinkan data masuk
  const [products, setProducts] = useState<any[]>([]) 
  const [cart, setCart] = useState<any[]>([]) 
  const [search, setSearch] = useState('')
  const [isReseller, setIsReseller] = useState(false)

  // Ambil data produk
  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').gt('stock', 0)
    setProducts(data || [])
  }

  useEffect(() => { fetchProducts() }, [])

  // Fungsi Tambah ke Keranjang
  const addToCart = (product: any) => {
    const existing = cart.find((item: any) => item.id === product.id)
    if (existing) {
      setCart(cart.map((item: any) => 
        item.id === product.id ? { ...item, qty: item.qty + 1 } : item
      ))
    } else {
      setCart([...cart, { ...product, qty: 1 }])
    }
  }

  // Hitung Total
  const calculateTotal = () => {
    return cart.reduce((sum, item: any) => {
      const price = isReseller ? (item.reseller_price || 0) : (item.price || 0)
      return sum + (price * item.qty)
    }, 0)
  }

  // Proses Bayar
  const handleCheckout = async () => {
    if (cart.length === 0) return alert('Keranjang kosong!')

    const total = calculateTotal()
    
    // 1. Simpan ke tabel transactions
    const { data: trx, error: trxErr } = await supabase
      .from('transactions')
      .insert([{ total_price: total, cash_received: total }])
      .select()

    // Cek apakah transaksi berhasil dibuat
    if (trxErr || !trx || trx.length === 0) {
      return alert('Gagal simpan transaksi: ' + (trxErr?.message || 'Data tidak kembali'))
    }

    const transactionId = trx[0].id

    // 2. Simpan detail & Kurangi stok
    for (const item of cart) {
      await supabase.from('transaction_items').insert([{
        transaction_id: transactionId,
        product_id: item.id,
        quantity: item.qty,
        subtotal: (isReseller ? item.reseller_price : item.price) * item.qty,
        price_type: isReseller ? 'reseller' : 'umum'
      }])

      await supabase.from('products').update({ stock: item.stock - item.qty }).eq('id', item.id)
    }

    alert('Transaksi Berhasil!')
    setCart([])
    fetchProducts()
  }

  return (
    <div className="flex h-screen bg-background-light text-black">
      {/* KIRI: Daftar Produk */}
      <div className="flex-1 p-6 overflow-y-auto">
        <h1 className="text-2xl font-bold text-primary mb-4">Kasir Javas</h1>
        <input 
          type="text" placeholder="Cari tanaman..." 
          className="w-full p-3 rounded-xl border border-emerald-100 mb-6 outline-none focus:ring-2 focus:ring-primary bg-white text-black"
          onChange={(e) => setSearch(e.target.value.toLowerCase())}
        />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {products.filter((p:any) => p.name.toLowerCase().includes(search)).map((product: any) => (
            <div key={product.id} onClick={() => addToCart(product)} className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-50 cursor-pointer hover:border-primary transition-all">
              <p className="font-bold">{product.name}</p>
              <p className="text-xs text-slate-400">Stok: {product.stock}</p>
              <p className="text-primary font-bold mt-2">Rp {product.price.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* KANAN: Keranjang & Pembayaran */}
      <div className="w-96 bg-white border-l border-emerald-100 p-6 flex flex-col">
        <h2 className="text-xl font-bold mb-4">Keranjang</h2>
        
        <div className="flex items-center justify-between mb-4 p-3 bg-emerald-50 rounded-xl">
          <span className="text-sm font-bold text-primary">Mode Reseller?</span>
          <input type="checkbox" checked={isReseller} onChange={() => setIsReseller(!isReseller)} className="w-5 h-5 accent-primary" />
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
          {cart.map((item: any) => (
            <div key={item.id} className="flex justify-between items-center text-sm border-b pb-2">
              <div>
                <p className="font-bold">{item.name}</p>
                <p className="text-xs text-slate-500">{item.qty} x Rp {(isReseller ? item.reseller_price : item.price).toLocaleString()}</p>
              </div>
              <button onClick={() => setCart(cart.filter((i:any) => i.id !== item.id))} className="text-red-400">
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            </div>
          ))}
        </div>

        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between text-lg font-bold mb-6">
            <span>Total</span>
            <span className="text-primary">Rp {calculateTotal().toLocaleString()}</span>
          </div>
          <button 
            onClick={handleCheckout}
            className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-primary-dark transition-all"
          >
            Proses Bayar
          </button>
        </div>
      </div>
    </div>
  )
}