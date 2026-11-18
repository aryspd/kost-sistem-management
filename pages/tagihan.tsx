import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Search, ReceiptText, MessageCircle, FileText, Undo2, AlertTriangle, Clock, Wallet } from 'lucide-react';
import Layout from '@/components/Layout';
import PayModal from '@/components/PayModal';
import { api, Avatar, Empty, LoadingBlock, StateBadge, useData, useToast, useWa } from '@/components/ui';
import { fmtShort, rupiah } from '@/lib/format';

const TABS = [
  { v: 'BELUM', label: 'Belum Lunas' },
  { v: 'TERLAMBAT', label: 'Terlambat' },
  { v: 'LUNAS', label: 'Lunas' },
  { v: 'SEMUA', label: 'Semua' },
];

export default function Tagihan() {
  const router = useRouter();
  const [status, setStatus] = useState('BELUM');
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [pay, setPay] = useState<any>(null);
  const toast = useToast();
  const wa = useWa();

  useEffect(() => {
    if (router.query.status) setStatus(String(router.query.status));
  }, [router.query.status]);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data, loading, reload } = useData<any>(`/api/invoices?status=${status}&q=${encodeURIComponent(debounced)}`);

  const notify = async (inv: any) => {
    try {
      wa(await api(`/api/invoices/${inv.id}/notify`, 'POST'));
    } catch (e: any) {
      toast('error', e.message);
    }
  };
  const cancel = async (inv: any) => {
    if (!confirm(`Batalkan pelunasan ${inv.receiptNo}?`)) return;
    try {
      await api(`/api/invoices/${inv.id}/pay`, 'DELETE');
      toast('success', 'Pelunasan dibatalkan');
      reload();
    } catch (e: any) {
      toast('error', e.message);
    }
  };

  const c = data?.counts;

  return (
    <Layout title="Tagihan & Pembayaran" subtitle="Tagihan dibuat otomatis berdasarkan tanggal masuk setiap penghuni">
      {c && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: 'Tagihan Belum Lunas', value: c.belum, icon: Clock, cls: 'bg-brand-50 text-brand-600' },
            { label: 'Tagihan Terlambat', value: c.terlambat, icon: AlertTriangle, cls: 'bg-rose-50 text-rose-600' },
            { label: 'Total Piutang', value: rupiah(c.totalPiutang), icon: Wallet, cls: 'bg-amber-50 text-amber-600' },
          ].map((x) => (
            <div key={x.label} className="card flex items-center gap-4 p-5">
              <div className={`rounded-xl p-3 ${x.cls}`}>
                <x.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">{x.label}</p>
                <p className="text-xl font-extrabold text-slate-900">{x.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
            {TABS.map((t) => (
              <button
                key={t.v}
                onClick={() => setStatus(t.v)}
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  status === t.v ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="relative md:w-72">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input className="input pl-10" placeholder="Cari nama / kamar…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>

        {loading && !data ? (
          <LoadingBlock />
        ) : data.rows.length === 0 ? (
          <Empty icon={ReceiptText} title="Tidak ada tagihan" text="Tagihan baru otomatis muncul 7 hari sebelum tanggal jatuh tempo penghuni." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/70">
                <tr>
                  <th className="th">Penghuni</th>
                  <th className="th">Periode</th>
                  <th className="th">Jatuh Tempo</th>
                  <th className="th text-right">Jumlah</th>
                  <th className="th">Status</th>
                  <th className="th text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.rows.map((inv: any) => (
                  <tr key={inv.id} className="transition hover:bg-slate-50/60">
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <Avatar name={inv.tenant.name} className="h-9 w-9" />
                        <div>
                          <p className="font-semibold text-slate-800">{inv.tenant.name}</p>
                          <p className="text-xs text-slate-500">{inv.tenant.room.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="td whitespace-nowrap text-slate-600">
                      <p className="text-xs font-semibold text-slate-400">Bulan ke-{inv.periodIndex + 1}</p>
                      {fmtShort(inv.periodStart)} – {fmtShort(inv.periodEnd)}
                    </td>
                    <td className="td whitespace-nowrap">{fmtShort(inv.dueDate)}</td>
                    <td className="td whitespace-nowrap text-right font-bold text-slate-900">{rupiah(inv.amount)}</td>
                    <td className="td">
                      <StateBadge state={inv.state} />
                      {inv.status === 'LUNAS' && (
                        <p className="mt-1 text-xs text-slate-400">
                          {fmtShort(inv.paidAt)} • {inv.method}
                        </p>
                      )}
                    </td>
                    <td className="td">
                      <div className="flex justify-end gap-1.5">
                        {inv.status === 'LUNAS' ? (
                          <>
                            <a href={`/kwitansi/${inv.receiptToken}`} target="_blank" rel="noreferrer" className="btn-ghost btn-sm">
                              <FileText className="h-4 w-4" /> Kwitansi
                            </a>
                            <button className="btn-wa btn-sm" title="Kirim kwitansi via WA" onClick={() => notify(inv)}>
                              <MessageCircle className="h-4 w-4" />
                            </button>
                            <button className="btn-danger btn-sm" title="Batalkan pelunasan" onClick={() => cancel(inv)}>
                              <Undo2 className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button className="btn-wa btn-sm" title="Kirim tagihan via WA" onClick={() => notify(inv)}>
                              <MessageCircle className="h-4 w-4" /> Ingatkan
                            </button>
                            <button className="btn-success btn-sm" onClick={() => setPay(inv)}>
                              Bayar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <PayModal invoice={pay} onClose={() => setPay(null)} onDone={reload} />
    </Layout>
  );
}
