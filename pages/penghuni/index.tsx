import { useState } from 'react';
import Link from 'next/link';
import { Plus, Users, Phone, CalendarDays, Search, ChevronRight, BedDouble, Store } from 'lucide-react';
import Layout from '@/components/Layout';
import TenantForm from '@/components/TenantForm';
import { Avatar, Empty, LoadingBlock, StateBadge, useData } from '@/components/ui';
import { fmtShort, rupiah } from '@/lib/format';

export default function Penghuni() {
  const { data, loading, reload } = useData<any[]>('/api/tenants');
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('AKTIF');

  const list = (data || []).filter(
    (t) => (filter === 'SEMUA' || t.status === filter) && (t.name + t.room.name + t.phone).toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <Layout
      title="Data Penghuni"
      subtitle="Tanggal masuk menentukan tanggal jatuh tempo bulanan"
      actions={
        <button className="btn-primary" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Tambah Penghuni</span>
        </button>
      }
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input className="input pl-10" placeholder="Cari nama, kamar, atau nomor WA…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input sm:w-48" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="AKTIF">Penghuni Aktif</option>
          <option value="KELUAR">Sudah Keluar</option>
          <option value="SEMUA">Semua</option>
        </select>
      </div>

      {loading && !data ? (
        <div className="card">
          <LoadingBlock />
        </div>
      ) : list.length === 0 ? (
        <div className="card">
          <Empty
            icon={Users}
            title="Belum ada penghuni"
            text="Tambahkan penghuni baru. Tagihan pertama akan otomatis dibuat sesuai tanggal masuk."
            action={
              <button className="btn-primary" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" /> Tambah Penghuni
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((t) => (
            <Link key={t.id} href={`/penghuni/${t.id}`} className="card group p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex items-start gap-3">
                <Avatar name={t.name} className="h-12 w-12 text-base" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-slate-900">{t.name}</p>
                  <p className="flex items-center gap-1.5 text-sm text-slate-500">
                    {t.room.type === 'KIOS' ? <Store className="h-3.5 w-3.5 text-emerald-600" /> : <BedDouble className="h-3.5 w-3.5 text-brand-600" />}{' '}
                    {t.room.name} • {rupiah(t.room.price)}
                  </p>
                </div>
                <StateBadge state={t.status} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="flex items-center gap-1 text-xs text-slate-400">
                    <CalendarDays className="h-3.5 w-3.5" /> Tanggal masuk
                  </p>
                  <p className="font-semibold text-slate-700">{fmtShort(t.moveInDate)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">Jatuh tempo berikutnya</p>
                  <p className="font-semibold text-slate-700">{t.nextDue ? fmtShort(t.nextDue) : '-'}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Phone className="h-3.5 w-3.5" /> {t.phone}
                </span>
                {t.lateCount > 0 ? (
                  <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600">
                    {t.lateCount} terlambat • {rupiah(t.unpaidTotal)}
                  </span>
                ) : t.unpaidCount > 0 ? (
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-600">{t.unpaidCount} tagihan</span>
                ) : (
                  <span className="flex items-center text-xs font-semibold text-emerald-600">
                    Lancar <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <TenantForm open={open} onClose={() => setOpen(false)} onSaved={reload} />
    </Layout>
  );
}
