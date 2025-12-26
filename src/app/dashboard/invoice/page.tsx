'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Product {
  id: string;
  sku: string;
  name: string;
  reseller_price: number;
  stock: number;
}

interface InvoiceItem extends Product {
  qty: number;
}

export default function InvoiceGrosirPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [invoiceId] = useState(`INV-${Date.now().toString().slice(-6)}`)
  
  // Data Pembeli
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    address: ''
  })

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').gt('stock', 0).order('name', { ascending: true })
    setProducts(data || [])
  }

  useEffect(() => { fetchProducts() }, [])

  const addToInvoice = (product: Product) => {
    const existing = invoiceItems.find((item) => item.id === product.id)
    if (existing) {
      updateQty(product.id, existing.qty + 1)
    } else {
      setInvoiceItems([...invoiceItems, { ...product, qty: 1 }])
    }
  }

  const updateQty = (id: string, newQty: number) => {
    if (newQty < 0) return
    if (newQty === 0) {
      setInvoiceItems(invoiceItems.filter(i => i.id !== id))
    } else {
      setInvoiceItems(invoiceItems.map(item => item.id === id ? { ...item, qty: newQty } : item))
    }
  }

  const calculateTotal = () => {
    return invoiceItems.reduce((sum, item) => sum + (item.reseller_price * item.qty), 0)
  }

  const handlePrint = () => {
    if (!customer.name) return alert('Nama Pembeli wajib diisi!')
    window.print()
  }

  const shareWA = () => {
    if (!customer.phone) return alert('Nomor WA Pembeli wajib diisi!')
    let text = `*INVOICE GROSIR JAVAS NURSERY*\nNo: ${invoiceId}\nKepada: ${customer.name}\n\n`
    invoiceItems.forEach(item => {
      text += `- ${item.name} (${item.qty} pcs) : Rp ${(item.reseller_price * item.qty).toLocaleString()}\n`
    })
    text += `\n*TOTAL TAGIHAN: Rp ${calculateTotal().toLocaleString()}*\n\nTerima kasih atas pesanannya, Mas Dan.`
    window.open(`https://wa.me/${customer.phone}?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* HEADER */}
      <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">Invoice Grosir</h1>
          <p className="text-slate-400 text-sm font-bold">Buat penawaran & tagihan borongan Javas Nursery</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={handlePrint} className="flex-1 md:flex-none bg-slate-800 text-white px-6 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 active-scale shadow-lg">
            <span className="material-symbols-outlined text-sm">print</span> CETAK PDF
          </button>
          <button onClick={shareWA} className="flex-1 md:flex-none bg-green-600 text-white px-6 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 active-scale shadow-lg">
            <span className="material-symbols-outlined text-sm">share</span> KIRIM WA
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-6 md:px-8">
        {/* KIRI: INPUT DATA & CARI PRODUK */}
        <div className="lg:col-span-1 space-y-6 no-print">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="font-black text-slate-800 mb-4 uppercase text-xs tracking-widest">Data Pelanggan</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Nama Lengkap Pembeli" className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm" value={customer.name} onChange={(e)=>setCustomer({...customer, name: e.target.value})} />
              <input type="number" placeholder="Nomor WhatsApp (628xxx)" className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm" value={customer.phone} onChange={(e)=>setCustomer({...customer, phone: e.target.value})} />
              <textarea placeholder="Alamat Pengiriman" className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm h-24 resize-none" value={customer.address} onChange={(e)=>setCustomer({...customer, address: e.target.value})} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col h-[400px]">
             <h3 className="font-black text-slate-800 mb-4 uppercase text-xs tracking-widest">Pilih Tanaman</h3>
             <input type="text" placeholder="Cari nama tanaman..." className="w-full p-3 mb-4 bg-slate-50 rounded-xl border-none text-xs font-bold" onChange={(e)=>setSearch(e.target.value.toLowerCase())} />
             <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
                {products.filter(p => p.name.toLowerCase().includes(search)).map(p => (
                  <div key={p.id} onClick={() => addToInvoice(p)} className="flex justify-between items-center p-3 bg-slate-50 hover:bg-primary/5 rounded-2xl cursor-pointer transition-all active-scale group">
                    <div>
                      <p className="font-bold text-slate-700 text-xs">{p.name}</p>
                      <p className="text-[10px] text-primary font-black">Rp {p.reseller_price.toLocaleString()}</p>
                    </div>
                    <span className="material-symbols-outlined text-slate-300 group-hover:text-primary">add_circle</span>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* KANAN: PREVIEW INVOICE */}
        <div className="lg:col-span-2">
          <div id="printable-invoice" className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-100 min-h-[800px] flex flex-col">
            {/* Kop Surat */}
            <div className="flex justify-between items-start mb-10 pb-8 border-b-2 border-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary rounded-[1.5rem] flex items-center justify-center text-white shadow-lg">
                  <span className="material-symbols-outlined text-4xl">potted_plant</span>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-primary tracking-tighter uppercase leading-none">Javas Nursery</h2>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-[0.2em]">Greenhouse & Wholesale</p>
                </div>
              </div>
              <div className="text-right">
                <h3 className="text-3xl font-black text-slate-200 tracking-tighter uppercase mb-2">Invoice</h3>
                <p className="text-xs font-black text-slate-800">#{invoiceId}</p>
                <p className="text-[10px] font-bold text-slate-400">{new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
              </div>
            </div>

            {/* Info Pelanggan */}
            <div className="grid grid-cols-2 gap-8 mb-10">
              <div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Ditujukan Ke:</p>
                <p className="font-black text-slate-800 text-lg uppercase leading-tight">{customer.name || 'Nama Pelanggan'}</p>
                <p className="text-sm font-bold text-slate-500 mt-1">{customer.phone || '08xxxxxx'}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Alamat Kirim:</p>
                <p className="text-sm font-bold text-slate-600 leading-relaxed italic">{customer.address || 'Alamat lengkap pengiriman...'}</p>
              </div>
            </div>

            {/* Tabel Barang */}
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-2 border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="py-4">Tanaman</th>
                    <th className="py-4 text-center">Jumlah</th>
                    <th className="py-4 text-right">Harga</th>
                    <th className="py-4 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {invoiceItems.map((item) => (
                    <tr key={item.id} className="text-sm">
                      <td className="py-5">
                        <p className="font-black text-slate-800">{item.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{item.sku}</p>
                      </td>
                      <td className="py-5 text-center font-bold no-print">
                        <div className="flex items-center justify-center gap-3">
                          <button onClick={()=>updateQty(item.id, item.qty - 1)} className="w-6 h-6 rounded-lg bg-slate-100 text-slate-500">-</button>
                          <span className="w-4">{item.qty}</span>
                          <button onClick={()=>updateQty(item.id, item.qty + 1)} className="w-6 h-6 rounded-lg bg-slate-100 text-slate-500">+</button>
                        </div>
                      </td>
                      <td className="py-5 text-center font-black hidden print:table-cell">{item.qty} pcs</td>
                      <td className="py-5 text-right font-bold text-slate-500">Rp {item.reseller_price.toLocaleString()}</td>
                      <td className="py-5 text-right font-black text-slate-800">Rp {(item.reseller_price * item.qty).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Section */}
            <div className="mt-10 pt-8 border-t-4 border-slate-50 flex flex-col items-end gap-2">
              <div className="flex justify-between w-full max-w-[250px] text-slate-400 font-bold text-xs uppercase">
                <span>Subtotal</span>
                <span>Rp {calculateTotal().toLocaleString()}</span>
              </div>
              <div className="flex justify-between w-full max-w-[250px] text-slate-400 font-bold text-xs uppercase">
                <span>Pajak (0%)</span>
                <span>Rp 0</span>
              </div>
              <div className="flex justify-between w-full max-w-[300px] mt-4 p-4 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20">
                <span className="font-black uppercase tracking-widest">Total Net</span>
                <span className="font-black text-xl tracking-tight">Rp {calculateTotal().toLocaleString()}</span>
              </div>
            </div>

            {/* Footer Nota */}
            <div className="mt-20 grid grid-cols-2 text-center text-[10px] font-bold uppercase tracking-widest text-slate-300">
               <div>
                  <p className="mb-16 italic">Hormat Kami,</p>
                  <p className="text-slate-800">JAVAS NURSERY</p>
               </div>
               <div>
                  <p className="mb-16 italic">Penerima,</p>
                  <p className="text-slate-800">........................</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; background-color: white !important; }
          #printable-invoice, #printable-invoice * { visibility: visible; }
          #printable-invoice { 
            position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0;
            box-shadow: none !important; border: none !important;
          }
          .no-print { display: none !important; }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}