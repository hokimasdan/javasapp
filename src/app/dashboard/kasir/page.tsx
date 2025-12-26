'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function KasirPage() {
  const [products, setProducts] = useState<any[]>([])
  const [cart, setCart] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [isReseller, setIsReseller] = useState(false)
  
  // Fitur Diskon & Bayar
  const [discountType, setDiscountType] = useState<'rp' | '%'>('rp')
  const [discountValue, setDiscountValue] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris' | 'transfer'>('cash')
  const [cashAmount, setCashAmount] = useState(0)

  // Fitur Modal Struk
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastTrx, setLastTrx] = useState<any>(null)

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').gt('stock', 0)
    setProducts(data || [])
  }

  useEffect(() => { fetchProducts() }, [])

  const addToCart = (product: any) => {
    const existing = cart.find((item: any) => item.id === product.id)
    if (existing) {
      updateQty(product.id, existing.qty + 1)
    } else {
      setCart([...cart, { ...product, qty: 1 }])
    }
  }

  const updateQty = (id: string, newQty: number) => {
    if (newQty < 1) return;
    setCart(cart.map(item => item.id === id ? { ...item, qty: newQty } : item))
  }

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => {
      const price = isReseller ? (item.reseller_price || 0) : (item.price || 0)
      return sum + (price * item.qty)
    }, 0)
  }

  const discountAmount = discountType === '%' 
    ? (calculateSubtotal() * discountValue / 100) 
    : discountValue;

  const grandTotal = calculateSubtotal() - discountAmount;
  const changeAmount = cashAmount > 0 ? cashAmount - grandTotal : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) return alert('Keranjang kosong!')
    if (paymentMethod === 'cash' && cashAmount < grandTotal) return alert('Uang bayar kurang!')

    const { data: trx, error: trxErr } = await supabase
      .from('transactions')
      .insert([{ 
        total_price: grandTotal, 
        cash_received: cashAmount || grandTotal,
        payment_method: paymentMethod
      }])
      .select()

    if (trxErr || !trx) return alert('Gagal: ' + trxErr?.message)

    for (const item of cart) {
      await supabase.from('transaction_items').insert([{
        transaction_id: trx[0].id,
        product_id: item.id,
        quantity: item.qty,
        subtotal: (isReseller ? item.reseller_price : item.price) * item.qty,
        price_type: isReseller ? 'reseller' : 'umum'
      }])
      await supabase.from('products').update({ stock: item.stock - item.qty }).eq('id', item.id)
    }

    // Simpan data untuk struk sebelum direset
    setLastTrx({
      id: trx[0].id,
      items: [...cart],
      total: grandTotal,
      discount: discountAmount,
      method: paymentMethod,
      cash: cashAmount,
      change: changeAmount,
      date: new Date().toLocaleString('id-ID')
    })

    setShowReceipt(true)
    setCart([]); setDiscountValue(0); setCashAmount(0); fetchProducts();
  }

  // Fungsi Kirim WA
  const sendWhatsApp = () => {
    const phone = prompt("Masukkan Nomor WA Pembeli (contoh: 62812xxx):");
    if (!phone) return;
    
    let text = `*NOTA JAVAS NURSERY*\nID: #${lastTrx.id.substring(0,5)}\nTgl: ${lastTrx.date}\n--------------------------\n`;
    lastTrx.items.forEach((item: any) => {
      text += `${item.name} x${item.qty}\n`;
    });
    text += `--------------------------\n*Total: Rp ${lastTrx.total.toLocaleString()}*\nMetode: ${lastTrx.method}\n\nTerima kasih sudah belanja!`;
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  }

  return (
    <div className="flex h-screen bg-background-light text-black overflow-hidden">
      {/* KIRI: Daftar Produk */}
      <div className="flex-1 p-6 overflow-y-auto">
        <h1 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
           <span className="material-symbols-outlined">potted_plant</span> Javas Kasir
        </h1>
        <input 
          type="text" placeholder="Cari tanaman..." 
          className="w-full p-3 rounded-xl border border-emerald-100 mb-6 bg-white text-black outline-none focus:ring-2 focus:ring-primary"
          onChange={(e) => setSearch(e.target.value.toLowerCase())}
        />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-20">
          {products.filter((p:any) => p.name.toLowerCase().includes(search)).map((product: any) => (
            <div key={product.id} onClick={() => addToCart(product)} className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-50 cursor-pointer hover:border-primary transition-all active:scale-95">
              <p className="font-bold">{product.name}</p>
              <p className="text-xs text-slate-400">Stok: {product.stock}</p>
              <p className="text-primary font-bold mt-2">Rp {product.price.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* KANAN: Sidebar Kasir */}
      <div className="w-[400px] bg-white border-l border-emerald-100 p-6 flex flex-col shadow-2xl overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">shopping_basket</span> Keranjang
        </h2>
        
        {/* List Belanjaan */}
        <div className="flex-1 space-y-3 mb-6">
          {cart.length === 0 && <p className="text-center text-slate-300 mt-10">Belum ada belanjaan</p>}
          {cart.map((item: any) => (
            <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-sm leading-tight">{item.name}</span>
                <button onClick={() => setCart(cart.filter(i => i.id !== item.id))} className="text-red-300 hover:text-red-500">
                   <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 bg-white border border-emerald-100 rounded-lg px-2 py-1">
                  <button onClick={() => updateQty(item.id, item.qty - 1)} className="text-primary font-bold px-1">-</button>
                  <span className="font-mono text-sm w-6 text-center">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, item.qty + 1)} className="text-primary font-bold px-1">+</button>
                </div>
                <span className="font-mono text-sm font-bold">Rp {((isReseller ? item.reseller_price : item.price) * item.qty).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Form Bayar */}
        <div className="border-t pt-4 space-y-4">
          <div className="flex gap-2">
            <select value={discountType} onChange={(e:any) => setDiscountType(e.target.value)} className="border rounded-xl px-2 py-1 bg-white text-xs font-bold">
              <option value="rp">Rp</option>
              <option value="%">%</option>
            </select>
            <input 
              type="number" placeholder="Diskon" 
              className="flex-1 border rounded-xl p-2 outline-none text-right font-mono text-sm"
              onChange={(e) => setDiscountValue(Number(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {['cash', 'qris', 'transfer'].map((m) => (
              <button 
                key={m} 
                onClick={() => setPaymentMethod(m as any)}
                className={`py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${paymentMethod === m ? 'bg-primary text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="bg-emerald-50 p-4 rounded-2xl space-y-1">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Subtotal</span>
              <span>Rp {calculateSubtotal().toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-primary border-t pt-2 mt-1">
              <span>TOTAL</span>
              <span className="font-mono">Rp {grandTotal.toLocaleString()}</span>
            </div>
          </div>

          {paymentMethod === 'cash' && (
            <div className="space-y-2">
              <input 
                type="number" placeholder="Jumlah Bayar" 
                className="w-full border-2 border-primary/10 rounded-xl p-3 outline-none focus:border-primary font-mono text-lg bg-white"
                onChange={(e) => setCashAmount(Number(e.target.value))}
              />
              <div className="flex justify-between px-3 py-2 bg-orange-50 rounded-xl text-orange-700">
                <span className="text-xs font-bold uppercase">Kembali</span>
                <span className="font-mono font-bold">Rp {changeAmount.toLocaleString()}</span>
              </div>
            </div>
          )}

          <button 
            onClick={handleCheckout}
            className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-primary-dark transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">shopping_cart_checkout</span>
            PROSES BAYAR
          </button>
        </div>
      </div>

      {/* MODAL STRUK (Hanya muncul setelah sukses bayar) */}
      {showReceipt && lastTrx && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl transform transition-all scale-100">
            {/* Tampilan Struk */}
            <div id="printable-receipt" className="p-8 bg-white text-black font-mono text-sm leading-tight">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold uppercase tracking-widest">Javas Nursery</h3>
                <p className="text-[10px]">Jl. Kebun Hijau No. 41</p>
                <p className="text-[10px] mb-2">0812-xxxx-xxxx</p>
                <p className="border-b border-dashed border-slate-300 pb-2">------------------------</p>
              </div>
              
              <div className="space-y-2 mb-4">
                <p className="text-[10px] flex justify-between">
                  <span>ID: #{lastTrx.id.substring(0,8)}</span>
                  <span>{lastTrx.date}</span>
                </p>
                <p className="border-b border-dashed border-slate-300">------------------------</p>
                {lastTrx.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-[11px]">
                    <span className="flex-1">{item.name} x{item.qty}</span>
                    <span>Rp {((isReseller ? item.reseller_price : item.price) * item.qty).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 border-t border-dashed border-slate-300 pt-2">
                <div className="flex justify-between text-[11px]">
                  <span>Diskon:</span>
                  <span>-Rp {lastTrx.discount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2">
                  <span>TOTAL:</span>
                  <span>Rp {lastTrx.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[10px] pt-1">
                  <span>Bayar ({lastTrx.method}):</span>
                  <span>Rp {(lastTrx.cash || lastTrx.total).toLocaleString()}</span>
                </div>
                {lastTrx.method === 'cash' && (
                  <div className="flex justify-between text-[10px]">
                    <span>Kembali:</span>
                    <span>Rp {lastTrx.change.toLocaleString()}</span>
                  </div>
                )}
              </div>
              
              <div className="text-center mt-8 text-[10px] italic">
                <p>Terima kasih sudah belanja</p>
                <p>Tanaman sehat, hati senang!</p>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="p-4 bg-slate-50 grid grid-cols-2 gap-3">
              <button 
                onClick={() => window.print()} 
                className="bg-slate-800 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">print</span> Cetak
              </button>
              <button 
                onClick={sendWhatsApp} 
                className="bg-green-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">share</span> Kirim WA
              </button>
              <button 
                onClick={() => setShowReceipt(false)} 
                className="col-span-2 bg-white text-slate-500 border border-slate-200 py-2 rounded-xl font-bold text-xs"
              >
                Tutup Halaman
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* CSS Khusus untuk Print (Agar hanya struk yang dicetak) */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #printable-receipt, #printable-receipt * { visibility: visible; }
          #printable-receipt { 
            position: absolute; 
            left: 0; top: 0; width: 80mm; 
            margin: 0; padding: 10px;
          }
        }
      `}</style>
    </div>
  )
}