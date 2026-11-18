import Link from 'next/link';
import {
  BedDouble, UserPlus, CalendarClock, ReceiptText, BellRing, Banknote, FileCheck2, MessageCircle, Wallet, ArrowDown, ArrowRight,
} from 'lucide-react';
import Layout from '@/components/Layout';

const STEPS = [
  { icon: BedDouble, color: 'from-slate-500 to-slate-700', title: 'Atur Kamar', text: 'Admin mendaftarkan kamar beserta harga sewa per bulan dan fasilitasnya.', href: '/kamar' },
  { icon: UserPlus, color: 'from-brand-500 to-indigo-600', title: 'Daftarkan Penghuni', text: 'Input nama, No. WhatsApp, kamar, dan TANGGAL MASUK penghuni.', href: '/penghuni' },
  { icon: CalendarClock, color: 'from-violet-500 to-purple-600', title: 'Jatuh Tempo Otomatis', text: 'Sistem menetapkan jatuh tempo setiap bulan di tanggal yang sama dengan tanggal masuk (mis. masuk tgl 15 → bayar tiap tgl 15).' },
  { icon: ReceiptText, color: 'from-cyan-500 to-sky-600', title: 'Tagihan Terbit', text: 'Tagihan bulan berikutnya dibuat otomatis 7 hari sebelum jatuh tempo.', href: '/tagihan' },
  { icon: BellRing, color: 'from-amber-500 to-orange-600', title: 'Pengingat WhatsApp', text: 'Pengingat dikirim H-3, hari H, dan setiap hari saat terlambat (otomatis via cron atau klik manual).', href: '/notifikasi' },
  { icon: Banknote, color: 'from-emerald-500 to-teal-600', title: 'Penghuni Membayar', text: 'Penghuni membayar tunai / transfer / QRIS. Admin klik "Bayar" untuk konfirmasi pelunasan.' },
  { icon: FileCheck2, color: 'from-green-500 to-emerald-600', title: 'Kwitansi Dibuat', text: 'Nomor kwitansi + PDF resmi otomatis dibuat (lengkap dengan terbilang & cap LUNAS).' },
  { icon: MessageCircle, color: 'from-[#25D366] to-green-600', title: 'Kwitansi ke WhatsApp', text: 'Pesan konfirmasi + link/lampiran PDF kwitansi terkirim ke WhatsApp penghuni.' },
  { icon: Wallet, color: 'from-pink-500 to-rose-600', title: 'Laporan Keuangan', text: 'Pembayaran otomatis tercatat sebagai pemasukan; admin mencatat pengeluaran → laba & buku kas.', href: '/keuangan' },
];

export default function Alur() {
  return (
    <Layout title="Alur Sistem Pembayaran Kost" subtitle="Bagaimana sistem ini bekerja dari awal hingga laporan keuangan">
      {/* Timeline */}
      <div className="relative mx-auto max-w-4xl">
        <div className="absolute bottom-6 left-7 top-6 w-0.5 bg-gradient-to-b from-brand-200 via-emerald-200 to-pink-200 md:left-1/2" />
        <div className="space-y-6">
          {STEPS.map((s, i) => {
            const left = i % 2 === 0;
            const Card = (
              <div className="card p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Langkah {i + 1}</p>
                <h3 className="mt-1 text-lg font-bold text-slate-900">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{s.text}</p>
                {s.href && (
                  <Link href={s.href} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline">
                    Buka menu <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            );
            return (
              <div key={s.title} className="relative grid grid-cols-[56px_1fr] items-center gap-4 md:grid-cols-[1fr_56px_1fr]">
                <div className={`hidden md:block ${left ? '' : 'invisible'}`}>{left && Card}</div>
                <div className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ring-4 ring-slate-50 ${s.color}`}>
                  <s.icon className="h-6 w-6" />
                </div>
                <div className="md:hidden">{Card}</div>
                <div className={`hidden md:block ${left ? 'invisible' : ''}`}>{!left && Card}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Siklus bulanan */}
      <div className="card mx-auto mt-12 max-w-4xl p-6">
        <h2 className="text-lg font-bold text-slate-900">Contoh Perhitungan Berdasarkan Tanggal Masuk</h2>
        <p className="mb-5 text-sm text-slate-500">Penghuni masuk 15 Januari, sewa Rp 900.000/bulan</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          {[
            ['Bulan ke-1', '15 Jan – 14 Feb', 'Jatuh tempo 15 Jan'],
            ['Bulan ke-2', '15 Feb – 14 Mar', 'Jatuh tempo 15 Feb'],
            ['Bulan ke-3', '15 Mar – 14 Apr', 'Jatuh tempo 15 Mar'],
            ['Dan seterusnya', 'Setiap tgl 15', 'Tagihan terbit H-7'],
          ].map(([a, b, c], i) => (
            <div key={a} className="relative rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-brand-50/50 p-4">
              <p className="text-xs font-bold text-brand-600">{a}</p>
              <p className="mt-1 font-bold text-slate-900">{b}</p>
              <p className="text-xs text-slate-500">{c}</p>
              {i < 3 && <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 rounded-full bg-white text-slate-400 sm:block" />}
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
          <b>Catatan:</b> penghuni yang masuk tanggal 29, 30, atau 31 akan jatuh tempo di tanggal terakhir pada bulan yang lebih pendek (mis. 28/29 Februari).
        </div>
      </div>

      {/* Status tagihan */}
      <div className="card mx-auto mt-6 max-w-4xl p-6">
        <h2 className="mb-5 text-lg font-bold text-slate-900">Siklus Status Tagihan</h2>
        <div className="flex flex-col items-center gap-3 md:flex-row md:justify-between">
          {[
            ['Belum Bayar', 'bg-slate-100 text-slate-700', '> 3 hari sebelum jatuh tempo'],
            ['Segera Jatuh Tempo', 'bg-amber-100 text-amber-800', '≤ 3 hari, pengingat WA dikirim'],
            ['Terlambat', 'bg-rose-100 text-rose-700', 'Lewat jatuh tempo, diingatkan harian'],
            ['Lunas', 'bg-emerald-100 text-emerald-700', 'Kwitansi terkirim ke WA'],
          ].map(([t, c, d], i, arr) => (
            <div key={t} className="flex flex-col items-center gap-3 md:flex-row">
              <div className="text-center">
                <span className={`inline-block rounded-full px-4 py-2 text-sm font-bold ${c}`}>{t}</span>
                <p className="mt-1.5 max-w-[150px] text-xs text-slate-500">{d}</p>
              </div>
              {i < arr.length - 1 && (
                <>
                  <ArrowRight className="hidden h-5 w-5 text-slate-300 md:block" />
                  <ArrowDown className="h-5 w-5 text-slate-300 md:hidden" />
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
