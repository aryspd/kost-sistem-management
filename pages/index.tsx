import { useState } from 'react';
import Link from 'next/link';
import {
  BedDouble, Store, Users, TrendingUp, TrendingDown, AlertTriangle, ArrowRight, Wallet, CalendarClock, CheckCircle2, MessageCircle,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Layout from '@/components/Layout';
import PayModal from '@/components/PayModal';
import { api, Avatar, Empty, LoadingBlock, StateBadge, useData, useToast, useWa } from '@/components/ui';
import { fmtShort, rupiah } from '@/lib/format';

const short = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}jt` : n >= 1e3 ? `${Math.round(n / 1e3)}rb` : `${n}`);

export default function Dashboard() {
  const { data, loading, reload } = useData<any>('/api/dashboard');
  const [pay, setPay] = useState<any>(null);
  const toast = useToast();
  const wa = useWa();

  const remind = async (inv: any) => {
    try {
      wa(await api(`/api/invoices/${inv.id}/notify`, 'POST', { type: 'tagihan' }));
    } catch (e: any) {
      toast('error', e.message);
    }
  };

  const hour = new Date().getHours();
  const greet = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 18 ? 'Selamat sore' : 'Selamat malam';

  if (loading || !data)
    return (
      <Layout title="Dashboard">
        <LoadingBlock />
      </Layout>
    );

  const s = data.stats;
  const occ = s.totalRooms ? Math.round((s.occupied / s.totalRooms) * 100) : 0;
  const cards = [
    { label: 'Pemasukan Bulan Ini', value: rupiah(s.incomeMonth), icon: TrendingUp, grad: 'from-emerald-500 to-teal-500' },
    { label: 'Pengeluaran Bulan Ini', value: rupiah(s.expenseMonth), icon: TrendingDown, grad: 'from-rose-500 to-pink-500' },
    { label: 'Piutang Jatuh Tempo', value: rupiah(s.receivable), icon: Wallet, grad: 'from-amber-500 to-orange-500', note: `${s.lateCount} tagihan terlambat` },
    { label: 'Penyewa Aktif', value: `${s.activeTenants} penyewa`, icon: Users, grad: 'from-brand-500 to-indigo-500', note: `${s.occupiedKamar}/${s.totalKamar} kamar • ${s.occupiedKios}/${s.totalKios} kios` },
  ];

  return (
    <Layout title={`${greet}, Admin 👋`} subtitle="Ringkasan kondisi kost Anda hari ini">
      {s.lateCount > 0 && (
        <Link href="/tagihan?status=TERLAMBAT" className="mb-6 flex items-center gap-4 rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-orange-50 p-4 transition hover:shadow-soft">
          <div className="rounded-xl bg-rose-100 p-2.5 text-rose-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-rose-800">Ada {s.lateCount} tagihan yang terlambat dibayar</p>
            <p className="text-sm text-rose-600">Klik untuk melihat dan kirim pengingat WhatsApp.</p>
          </div>
          <ArrowRight className="h-5 w-5 text-rose-500" />
        </Link>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card relative overflow-hidden p-5">
            <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-10 ${c.grad}`} />
            <div className={`mb-4 inline-flex rounded-xl bg-gradient-to-br p-2.5 text-white shadow-lg ${c.grad}`}>
              <c.icon className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-slate-500">{c.label}</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{c.value}</p>
            {c.note && <p className="mt-1 text-xs text-slate-400">{c.note}</p>}
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="card p-6 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Arus Kas 6 Bulan Terakhir</h2>
              <p className="text-sm text-slate-500">Pemasukan vs pengeluaran</p>
            </div>
            <Link href="/keuangan" className="text-sm font-semibold text-brand-600 hover:underline">
              Detail →
            </Link>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.chart} margin={{ left: -10, right: 10 }}>
                <defs>
                  <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={short} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => rupiah(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                <Area type="monotone" dataKey="income" name="Pemasukan" stroke="#10b981" strokeWidth={2.5} fill="url(#gIn)" />
                <Area type="monotone" dataKey="expense" name="Pengeluaran" stroke="#f43f5e" strokeWidth={2.5} fill="url(#gOut)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-bold text-slate-900">Tingkat Hunian</h2>
          <p className="text-sm text-slate-500">Kamar terisi saat ini</p>
          <div className="my-6 flex items-center justify-center">
            <div className="relative h-40 w-40">
              <svg viewBox="0 0 36 36" className="h-40 w-40 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#eef2ff" strokeWidth="3.2" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="url(#occ)" strokeWidth="3.2" strokeLinecap="round" strokeDasharray={`${occ} 100`} />
                <defs>
                  <linearGradient id="occ">
                    <stop offset="0%" stopColor="#3b63f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-slate-900">{occ}%</span>
                <span className="text-xs text-slate-500">terisi</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-brand-50 p-3">
              <p className="text-xl font-bold text-brand-700">{s.occupiedKamar}/{s.totalKamar}</p>
              <p className="text-xs text-brand-600">Kamar Terisi</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3">
              <p className="text-xl font-bold text-emerald-700">{s.occupiedKios}/{s.totalKios}</p>
              <p className="text-xs text-emerald-600">Kios Disewa</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href="/kamar" className="btn-ghost w-full">
              <BedDouble className="h-4 w-4" /> Kamar
            </Link>
            <Link href="/kios" className="btn-ghost w-full">
              <Store className="h-4 w-4" /> Kios
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="card xl:col-span-3">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-brand-600" />
              <h2 className="font-bold text-slate-900">Tagihan Mendatang & Tertunggak</h2>
            </div>
            <Link href="/tagihan" className="text-sm font-semibold text-brand-600 hover:underline">
              Semua →
            </Link>
          </div>
          {data.upcoming.length === 0 ? (
            <Empty icon={CheckCircle2} title="Semua tagihan sudah lunas 🎉" text="Tidak ada tagihan yang perlu ditindaklanjuti." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.upcoming.map((inv: any) => (
                <li key={inv.id} className="flex flex-wrap items-center gap-3 p-4 sm:flex-nowrap">
                  <Avatar name={inv.tenant.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-800">{inv.tenant.name}</p>
                    <p className="text-xs text-slate-500">
                      {inv.tenant.room.name} • Jatuh tempo {fmtShort(inv.dueDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{rupiah(inv.amount)}</p>
                    <StateBadge state={inv.state} />
                  </div>
                  <div className="flex gap-1.5">
                    <button title="Kirim pengingat WA" className="btn-wa btn-sm" onClick={() => remind(inv)}>
                      <MessageCircle className="h-4 w-4" />
                    </button>
                    <button className="btn-success btn-sm" onClick={() => setPay(inv)}>
                      Bayar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card xl:col-span-2">
          <div className="flex items-center gap-2 border-b border-slate-100 p-5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <h2 className="font-bold text-slate-900">Pembayaran Terakhir</h2>
          </div>
          {data.recent.length === 0 ? (
            <Empty icon={Wallet} title="Belum ada pembayaran" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.recent.map((inv: any) => (
                <li key={inv.id} className="flex items-center gap-3 p-4">
                  <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{inv.tenant.name}</p>
                    <p className="text-xs text-slate-500">
                      {fmtShort(inv.paidAt)} • {inv.method}
                    </p>
                  </div>
                  <a href={`/kwitansi/${inv.receiptToken}`} target="_blank" className="text-right" rel="noreferrer">
                    <p className="text-sm font-bold text-emerald-600">+{rupiah(inv.amount)}</p>
                    <p className="text-xs text-brand-600 hover:underline">Kwitansi</p>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <PayModal invoice={pay} onClose={() => setPay(null)} onDone={reload} />
    </Layout>
  );
}
