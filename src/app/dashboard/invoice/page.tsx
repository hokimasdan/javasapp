'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function InvoicePage() {
  const [products, setProducts] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [cart, setCart] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([]) // Untuk Hapus Massal

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_whatsapp: '',
    due_date: '',
    due_date_notes: '',
    status: 'pending'
  })

  const fetchData = async () => {
    const { data: p } = await supabase.from('products').select('*').gt('stock', 0)
    const { data: i } = await supabase.from('invoices').select('*').order('created_at', { ascending: false })
    setProducts(p || [])
    setInvoices(i || [])
  }

  useEffect(() => { fetchData() }, [])

  // Fungsi Keranjang & Jumlah Barang
  const addToCart = (p: any) => {
    const ex = cart.find(i => i.id === p.id)
    if (ex) updateQty(p.id, ex.qty + 1)
    else setCart([...cart, { ...p, qty: 1 }])
  }

  const updateQty = (id: string, newQty: number) => {
    if (newQty < 1) return;
    setCart(cart.map(i => i.id === id ? { ...i, qty: newQty } : i))
  }

  const calculateTotal = () => cart.reduce((s, i) => s + (i.price * i.qty), 0)

  // FITUR: SIMPAN INVOICE
  const handleSaveInvoice = async () => {
    if (!formData.customer_name || cart.length === 0) return alert('Lengkapi data pelanggan dan barang!')
    setLoading(true)

    const { data: inv, error: invErr } = await supabase
      .from('invoices')
      .insert([{
        customer_name: formData.customer_name,
        customer_whatsapp: formData.customer_whatsapp,
        total_amount: calculateTotal(),
        status: formData.status,
        due_date: formData.due_date || null,
        due_date_notes: formData.due_date_notes
      }])
      .select()

    if (invErr) return alert(invErr.message)

    for (const item of cart) {
      await supabase.from('invoice_items').insert([{
        invoice_id: inv[0].id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.qty,
        price: item.price,
        subtotal: item.price * item.qty
      }])
      await supabase.from('products').update({ stock: item.stock - item.qty }).eq('id', item.id)
    }

    alert('Invoice Berhasil Terbit!'); setIsCreating(false); setCart([]); fetchData(); setLoading(false)
  }

  // FITUR: LUNASKAN TAGIHAN
  const markAsLunas = async (id: string) => {
    const { error } = await supabase.from('invoices').update({ status: 'lunas' }).eq('id', id)
    if (error) alert('Gagal melunaskan tagihan')
    else fetchData()
  }

  // FITUR: HAPUS MASSAL
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return alert('Pilih invoice yang akan dihapus')
    if (!confirm(`Hapus ${selectedIds.length} invoice terpilih? Stok akan dikembalikan.`)) return

    for (const id of selectedIds) {
      const { data: items } = await supabase.from('invoice_items').select('*').eq('invoice_id', id)
      if (items) {
        for (const item of items) {
          const { data: p } = await supabase.from('products').select('stock').eq('id', item.product_id).single()
          await supabase.from('products').update({ stock: (p?.stock || 0) + item.quantity }).eq('id', item.product_id)
        }
      }
      await supabase.from('invoices').delete().eq('id', id)
    }
    setSelectedIds([]); fetchData(); alert('Berhasil dihapus massal!')
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  return (
    <div className="p-8 bg-background-light min-h-screen text-black">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary">Invoice Grosir</h1>
          <p className="text-slate-500 text-sm">Kelola tagihan partai besar Javas Nursery.</p>
        </div>
        <div className="flex gap-3">
          {!isCreating && selectedIds.length > 0 && (
            <button onClick={handleBulkDelete} className="bg-red-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg flex items-center gap-2">
              <span className="material-symbols-outlined">delete_sweep</span> Hapus ({selectedIds.length})
            </button>
          )}
          <button onClick={() => setIsCreating(!isCreating)} className="bg-primary text-white px-6 py-3 rounded-2xl font-bold shadow-lg">
            {isCreating ? 'Batal' : 'Buat Invoice Baru'}
          </button>
        </div>
      </div>

      {isCreating ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* KIRI: CARI & PILIH BARANG */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100">
              <input 
                type="text" placeholder="Cari tanaman untuk grosir..." 
                className="w-full p-4 mb-6 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-primary"
                onChange={(e) => setSearch(e.target.value.toLowerCase())}
              />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2">
                {products.filter(p => p.name.toLowerCase().includes(search)).map(p => (
                  <div key={p.id} onClick={() => addToCart(p)} className="p-4 bg-white border rounded-2xl cursor-pointer hover:border-primary transition-all shadow-sm flex flex-col justify-between">
                    <div>
                      <p className="font-bold text-sm leading-tight mb-1">{p.name}</p>
                      <p className="text-primary font-bold text-xs">Rp {p.price.toLocaleString()}</p>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">Stok: {p.stock}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* KANAN: FORM & KERANJANG */}
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-emerald-100 h-fit flex flex-col">
            <h3 className="font-bold mb-4 text-primary">Detail Tagihan</h3>
            <div className="space-y-3 mb-6">
              <input placeholder="Nama Pelanggan/PT" className="w-full p-3 bg-slate-50 border rounded-xl text-sm" onChange={(e)=>setFormData({...formData, customer_name: e.target.value})} />
              <input placeholder="No WhatsApp (628xxx)" className="w-full p-3 bg-slate-50 border rounded-xl text-sm" onChange={(e)=>setFormData({...formData, customer_whatsapp: e.target.value})} />
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-widest">Jatuh Tempo</label>
                <input type="date" className="w-full p-3 bg-slate-50 border rounded-xl text-sm mb-2" onChange={(e)=>setFormData({...formData, due_date: e.target.value})} />
                <textarea 
                  placeholder="Catatan Jatuh Tempo (Misal: Bayar 2x)" 
                  className="w-full p-3 bg-slate-50 border rounded-xl text-xs outline-none" 
                  rows={2}
                  onChange={(e)=>setFormData({...formData, due_date_notes: e.target.value})}
                />
              </div>
            </div>

            {/* LIST BARANG DI KERANJANG */}
            <div className="border-t border-b py-4 my-2 space-y-3 max-h-60 overflow-y-auto">
              {cart.length === 0 && <p className="text-center text-slate-300 text-xs py-4 italic">Belum ada barang dipilih</p>}
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-emerald-50/50 p-2 rounded-xl">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold leading-tight">{item.name}</span>
                    <span className="text-[10px] text-primary">Rp {item.price.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white rounded-lg px-2 border">
                    <button onClick={()=>updateQty(item.id, item.qty-1)} className="text-primary font-bold p-1">-</button>
                    <span className="text-xs font-mono w-4 text-center">{item.qty}</span>
                    <button onClick={()=>updateQty(item.id, item.qty+1)} className="text-primary font-bold p-1">+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <div className="flex justify-between font-bold text-lg mb-4 text-primary">
                <span>Total</span>
                <span>Rp {calculateTotal().toLocaleString()}</span>
              </div>
              <button onClick={handleSaveInvoice} disabled={loading} className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg">
                {loading ? 'PROSES...' : 'TERBITKAN INVOICE'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* TABEL DAFTAR INVOICE (DENGAN CHECKBOX HAPUS MASSAL & TOMBOL LUNAS) */
        <div className="bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-emerald-50 text-primary font-bold uppercase text-[10px]">
              <tr>
                <th className="px-6 py-4 w-10 text-center">
                  <input type="checkbox" onChange={(e) => setSelectedIds(e.target.checked ? invoices.map(i => i.id) : [])} />
                </th>
                <th className="px-6 py-4">Pelanggan</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Jatuh Tempo & Catatan</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50">
              {invoices.map((inv: any) => (
                <tr key={inv.id} className={`hover:bg-emerald-50/20 transition-all ${selectedIds.includes(inv.id) ? 'bg-emerald-50' : ''}`}>
                  <td className="px-6 py-4 text-center">
                    <input type="checkbox" checked={selectedIds.includes(inv.id)} onChange={() => toggleSelect(inv.id)} />
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold">{inv.customer_name}</p>
                    <p className="text-[10px] text-slate-400 italic">{inv.customer_whatsapp || '-'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase ${inv.status === 'lunas' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-[10px]">{inv.due_date ? new Date(inv.due_date).toLocaleDateString('id-ID') : '-'}</p>
                    <p className="text-[10px] text-slate-500 line-clamp-1">{inv.due_date_notes || '-'}</p>
                  </td>
                  <td className="px-6 py-4 font-bold text-primary">Rp {Number(inv.total_amount).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      {inv.status === 'pending' && (
                        <button onClick={()=>markAsLunas(inv.id)} className="bg-green-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-sm">
                          LUNASKAN
                        </button>
                      )}
                      <button className="p-2 text-slate-300 hover:text-primary"><span className="material-symbols-outlined text-sm">visibility</span></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}