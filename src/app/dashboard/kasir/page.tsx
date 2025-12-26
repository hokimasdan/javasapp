'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Interface sederhana agar Vercel tidak error saat build (Type Safety)
interface Product {
  id: string;
  name: string;
  price: number;
  reseller_price: number;
  stock: number;
  image_url?: string;
}

interface CartItem extends Product {
  qty: number;
}

export default function KasirPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [isReseller, setIsReseller] = useState(false)
  const [showCartMobile, setShowCartMobile] = useState(false) // State khusus Mobile
  
  // Fitur Diskon & Bayar
  const [discountType, setDiscountType] = useState<'rp' | '%'>('rp')
  const [discountValue, setDiscountValue] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris' | 'transfer'>('cash')
  const [cashAmount, setCashAmount] = useState(0)

  // Fitur Modal Struk
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastTrx, setLastTrx] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').gt('stock', 0).order('name', { ascending: true })
    setProducts(data || [])
  }

  useEffect(() => { fetchProducts() }, [])

  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.id === product.id)
    if (existing) {
      if (existing.qty + 1 > product.stock) return alert('Stok tidak mencukupi!')
      updateQty(product.id, existing.qty + 1)
    } else {
      setCart([...cart, { ...product, qty: 1 }])
    }
  }

  const updateQty = (id: string, newQty: number) => {
    if (newQty < 1) return;
    const item = cart.find(i => i.id === id);
    if (item && newQty > item.stock) return alert('Stok tidak mencukupi!');
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

  const grandTotal = Math.max(0, calculateSubtotal() - discountAmount);
  const changeAmount = cashAmount > 0 ? cashAmount - grandTotal : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) return alert('Keranjang masih kosong!')
    if (paymentMethod === 'cash' && cashAmount < grandTotal) return alert('Uang bayar kurang!')
    
    setLoading(true)
    try {
      const { data: trx, error: trxErr } = await supabase
        .from('transactions')
        .insert([{ 
          total_price: grandTotal, 
          cash_received: cashAmount || grandTotal,
          payment_method: paymentMethod
        }])
        .select()

      if (trxErr || !trx) throw new Error(trxErr?.message)

      // Proses per item (Update Stok & Insert Detail)
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

      setLastTrx({
        id: trx[0].id,
        items: [...cart],
        total: grandTotal,
        subtotal: calculateSubtotal(),
        discount: discountAmount,
        method: paymentMethod,
        cash: cashAmount,
        change: changeAmount,
        isReseller,
        date: new Date().toLocaleString('id-ID')
      })

      setShowReceipt(true)
      setCart([]); setDiscountValue(0); setCashAmount(0); fetchProducts();
      setShowCartMobile(false)
    } catch (err: any) {
      alert('Gagal Transaksi: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const sendWhatsApp = () => {
    const phone = prompt("Nomor WA Pembeli (628xxx):", "62");
    if (!phone) return;
    
    let text = `*NOTA JAVAS NURSERY*\nID: #${lastTrx.id.substring(0,8)}\nTgl: ${lastTrx.date}\n--------------------------\n`;
    lastTrx.items.forEach((item: any) => {
      text += `${item.name}\n${item.qty}x @ Rp ${(isReseller ? item.reseller_price : item.price).toLocaleString()}\n`;
    });
    text += `--------------------------\n*Total: Rp ${lastTrx.total.toLocaleString()}*\nMetode: ${lastTrx.method.toUpperCase()}\n\nTerima kasih sudah belanja!`;
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-80px)] md:h-screen bg-slate-50 overflow-hidden">
      
      {/* BAGIAN KIRI: DAFTAR PRODUK */}
      <div className="flex-1 flex flex-col min-w-0 bg-white md:bg-transparent">
        <div className="p-4 md:p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-xl md:text-2xl font-black text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-3xl">local_florist</span>
              JAVAS KASIR
            </h1>
            
            {/* Toggle Reseller */}
            <button 
              onClick={() => setIsReseller(!isReseller)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-xs transition-all active-scale ${isReseller ? 'bg-orange-100 text-orange-600 border border-orange-200' : 'bg-slate-100 text-slate-500'}`}
            >
              <span className="material-symbols-outlined text-sm">{isReseller ? 'verified' : 'person'}</span>
              {isReseller ? 'HARGA RESELLER' : 'HARGA UMUM'}
            </button>
          </div>

          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">search</span>
            <input 
              type="text" placeholder="Cari tanaman atau barcode..." 
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-none bg-white md:bg-white shadow-sm outline-none focus:ring-2 focus:ring-primary transition-all text-sm font-medium"
              onChange={(e) => setSearch(e.target.value.toLowerCase())}
            />
          </div>
        </div>

        {/* Grid Produk */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-24 md:pb-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {products.filter(p => p.name.toLowerCase().includes(search)).map((product) => (
              <div 
                key={product.id} 
                onClick={() => addToCart(product)} 
                className="bg-white p-3 md:p-4 rounded-[2rem] shadow-sm border border-transparent hover:border-primary cursor-pointer transition-all active-scale group relative overflow-hidden"
              >
                <div className="aspect-square rounded-2xl bg-slate-50 mb-3 overflow-hidden border border-slate-100">
                  <img src={product.image_url || '/placeholder.png'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={product.name} />
                </div>
                <p className="font-bold text-slate-800 text-sm leading-tight truncate">{product.name}</p>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-primary font-black text-sm">
                    Rp {(isReseller ? product.reseller_price : product.price).toLocaleString()}
                  </p>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${product.stock < 10 ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400'}`}>
                    Stok: {product.stock}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BAGIAN KANAN: KERANJANG (Desktop: Sidebar, Mobile: Drawer) */}
      <div className={`
        fixed inset-0 z-50 transition-all duration-300 md:relative md:translate-x-0 md:inset-auto md:z-auto
        ${showCartMobile ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        {/* Overlay Mobile */}
        <div className="absolute inset-0 bg-black/50 md:hidden" onClick={() => setShowCartMobile(false)} />

        <div className="absolute right-0 top-0 bottom-0 w-[85%] md:w-[400px] bg-white border-l border-slate-100 flex flex-col shadow-2xl overflow-hidden rounded-l-[2.5rem] md:rounded-none">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
            <h2 className="text-lg font-black flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">shopping_basket</span> 
              KERANJANG ({cart.length})
            </h2>
            <button onClick={() => setShowCartMobile(false)} className="md:hidden text-slate-400">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale">
                <span className="material-symbols-outlined text-8xl">shopping_cart</span>
                <p className="font-bold mt-2">Keranjang Kosong</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="group relative bg-slate-50 p-4 rounded-[1.5rem] border border-transparent hover:border-emerald-100 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-bold text-slate-800 text-sm flex-1 pr-4">{item.name}</span>
                    <button onClick={() => setCart(cart.filter(i => i.id !== item.id))} className="text-slate-300 hover:text-red-500 transition-colors">
                       <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl px-2 py-1 shadow-sm">
                      <button onClick={() => updateQty(item.id, item.qty - 1)} className="w-8 h-8 flex items-center justify-center text-primary font-black hover:bg-slate-50 rounded-lg">-</button>
                      <span className="font-black text-sm w-4 text-center">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, item.qty + 1)} className="w-8 h-8 flex items-center justify-center text-primary font-black hover:bg-slate-50 rounded-lg">+</button>
                    </div>
                    <span className="font-black text-sm text-slate-700">Rp {((isReseller ? item.reseller_price : item.price) * item.qty).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout Panel */}
          <div className="p-6 bg-white border-t border-slate-100 space-y-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex gap-1 border border-slate-100 rounded-2xl p-1 bg-slate-50">
                <select value={discountType} onChange={(e:any) => setDiscountType(e.target.value)} className="bg-transparent text-[10px] font-black px-2 outline-none">
                  <option value="rp">Rp</option>
                  <option value="%">%</option>
                </select>
                <input 
                  type="number" placeholder="Diskon" 
                  className="w-full bg-white rounded-xl px-3 py-2 outline-none text-right font-bold text-xs"
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                />
              </div>
              <div className="flex items-center justify-between px-4 bg-primary/5 rounded-2xl">
                 <span className="text-[10px] font-black text-primary">METODE:</span>
                 <select value={paymentMethod} onChange={(e:any) => setPaymentMethod(e.target.value)} className="bg-transparent text-[10px] font-black text-primary outline-none uppercase">
                    <option value="cash">CASH</option>
                    <option value="qris">QRIS</option>
                    <option value="transfer">BANK</option>
                 </select>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-5 rounded-[2rem] space-y-1 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="material-symbols-outlined text-4xl">payments</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold opacity-60 uppercase tracking-widest">
                <span>Subtotal Belanja</span>
                <span>Rp {calculateSubtotal().toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-end pt-2">
                <span className="text-xs font-bold opacity-60">TOTAL BAYAR</span>
                <span className="text-2xl font-black tracking-tight">Rp {grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {paymentMethod === 'cash' && (
              <div className="space-y-3">
                <input 
                  type="number" placeholder="Masukkan Uang Tunai..." 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 outline-none focus:border-primary font-black text-xl text-center transition-all"
                  value={cashAmount || ''}
                  onChange={(e) => setCashAmount(Number(e.target.value))}
                />
                {cashAmount >= grandTotal && (
                  <div className="flex justify-between px-5 py-3 bg-orange-50 border border-orange-100 rounded-2xl text-orange-700 animate-pulse">
                    <span className="text-[10px] font-black uppercase tracking-widest">Kembalian</span>
                    <span className="font-black">Rp {changeAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}

            <button 
              onClick={handleCheckout}
              disabled={loading || cart.length === 0}
              className="w-full bg-primary text-white py-5 rounded-[2rem] font-black shadow-lg shadow-primary/30 hover:bg-primary-dark transition-all flex items-center justify-center gap-3 active-scale disabled:opacity-50"
            >
              <span className="material-symbols-outlined">check_circle</span>
              {loading ? 'MEMPROSES...' : 'SELESAIKAN PEMBAYARAN'}
            </button>
          </div>
        </div>
      </div>

      {/* Floating Cart Button (Mobile Only) */}
      {cart.length > 0 && !showCartMobile && (
        <button 
          onClick={() => setShowCartMobile(true)}
          className="fixed bottom-6 right-6 md:hidden bg-primary text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center z-40 animate-bounce active-scale"
        >
          <div className="relative">
            <span className="material-symbols-outlined text-2xl">shopping_cart</span>
            <span className="absolute -top-3 -right-3 bg-orange-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">
              {cart.length}
            </span>
          </div>
        </button>
      )}

      {/* MODAL STRUK (Native App Style) */}
      {showReceipt && lastTrx && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-y-auto">
          <div className="bg-white rounded-[3rem] w-full max-w-sm overflow-hidden shadow-2xl my-auto">
            <div id="printable-receipt" className="p-8 bg-white text-slate-800 font-mono text-sm leading-tight border-b-8 border-slate-50">
              <div className="text-center mb-6">
                <div className="bg-primary w-12 h-12 rounded-2xl flex items-center justify-center text-white mx-auto mb-3 shadow-lg">
                   <span className="material-symbols-outlined text-3xl">local_florist</span>
                </div>
                <h3 className="text-xl font-black uppercase tracking-tighter">Javas Nursery</h3>
                <p className="text-[9px] opacity-60 uppercase tracking-widest">Bandar Lampung, Indonesia</p>
                <p className="text-[10px] font-bold mt-1">WA: 0812-xxxx-xxxx</p>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-[9px] font-bold opacity-40 uppercase tracking-widest">
                  <span>Nota #{lastTrx.id.substring(0,8)}</span>
                  <span>{lastTrx.date}</span>
                </div>
                <div className="border-t border-dashed border-slate-200" />
                {lastTrx.items.map((item: any) => (
                  <div key={item.id} className="flex flex-col gap-1">
                    <span className="font-bold text-xs">{item.name}</span>
                    <div className="flex justify-between text-[11px] opacity-70">
                       <span>{item.qty}x @ Rp {(lastTrx.isReseller ? item.reseller_price : item.price).toLocaleString()}</span>
                       <span className="font-bold">Rp {((lastTrx.isReseller ? item.reseller_price : item.price) * item.qty).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t border-dashed border-slate-200 pt-4">
                <div className="flex justify-between text-xs opacity-60">
                  <span>Subtotal:</span>
                  <span>Rp {lastTrx.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-red-500 font-bold">
                  <span>Diskon:</span>
                  <span>-Rp {lastTrx.discount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-black text-xl pt-2 border-t border-slate-50 mt-2">
                  <span>TOTAL:</span>
                  <span className="text-primary">Rp {lastTrx.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[10px] pt-3 font-bold opacity-60 uppercase">
                  <span>Metode Bayar:</span>
                  <span>{lastTrx.method}</span>
                </div>
                {lastTrx.method === 'cash' && (
                   <div className="space-y-1">
                      <div className="flex justify-between text-[10px] opacity-60 font-bold uppercase">
                        <span>Tunai:</span>
                        <span>Rp {lastTrx.cash.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs font-black text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                        <span>KEMBALIAN:</span>
                        <span>Rp {lastTrx.change.toLocaleString()}</span>
                      </div>
                   </div>
                )}
              </div>
              
              <div className="text-center mt-10 text-[9px] font-bold opacity-40 uppercase tracking-[0.2em]">
                <p>Terima kasih atas kunjungannya</p>
                <p className="mt-1">Tanaman sehat, hati senang!</p>
              </div>
            </div>

            {/* Tombol Aksi Modal */}
            <div className="p-6 bg-slate-50 grid grid-cols-2 gap-3">
              <button 
                onClick={() => window.print()} 
                className="bg-slate-800 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 active-scale"
              >
                <span className="material-symbols-outlined text-xl">print</span> 
              </button>
              <button 
                onClick={sendWhatsApp} 
                className="bg-green-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 active-scale"
              >
                <span className="material-symbols-outlined text-xl">share</span> WA
              </button>
              <button 
                onClick={() => setShowReceipt(false)} 
                className="col-span-2 bg-white text-slate-500 border-2 border-slate-200 py-3 rounded-2xl font-black text-xs active-scale uppercase tracking-widest"
              >
                Selesai / Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* CSS untuk Struk Print */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #printable-receipt, #printable-receipt * { visibility: visible; }
          #printable-receipt { 
            position: fixed; left: 0; top: 0; width: 100%; margin: 0; padding: 20px;
          }
        }
      `}</style>
    </div>
  )
}