import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeft, Pencil, Trash2, Phone, CalendarDays, BedDouble, IdCard, FileText, MessageCircle } from 'lucide-react';
import Layout from '@/components/Layout';
import TenantForm from '@/components/TenantForm';
import PayModal from '@/components/PayModal';
import { api, Avatar, LoadingBlock, StateBadge, useData, useToast, useWa } from '@/components/ui';
import { fmtDate, fmtShort, rupiah } from '@/lib/format';

export default function DetailPenghuni() {
  const router = useRouter();
  const id = router.query.id as string | undefined;
  const { data: t, loading, reload } = useData<any>(id ? `/api/tenants/${id}` : null);
  const [edit, setEdit] = useState(false);
  const [pay, setPay] = useState<any>(null);
  const toast = useToast();
  const wa = useWa();

  const remove = async () => {
    if (!confirm(`Hapus ${t.name} beserta seluruh riwayat tagihannya?`)) return;
    await api(`/api/tenants/${t.id}`, 'DELETE');
    toast('success', 'Penghuni dihapus');
    router.push('/penghuni');
  };
  const notify = async (inv: any) => {
    try {
      wa(await api(`/api/invoices/${inv.id}/notify`, 'POST'));
    } catch (e: any) {
      toast('error', e.message);
    }
  };

  if (loading || !t)
    return (
      <Layout title="Detail Penghuni">
        <LoadingBlock />
      </Layout>
    );

  const paid = t.invoices.filter((i: any) => i.status === 'LUNAS');
  const unpaid = t.invoices.filter((i: any) => i.status !== 'LUNAS');

  return (
    <Layout
      title="Detail Penghuni"
      actions={
        <Link href="/penghuni" className="btn-ghost">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-brand-600 to-indigo-500" />
          <div className="-mt-10 px-6 pb-6">
            <Avatar name={t.name} className="h-20 w-20 rounded-2xl text-2xl ring-4 ring-white" />
            <div className="mt-3 flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900">{t.name}</h2>
              <StateBadge state={t.status} />
            </div>
            <div className="mt-5 space-y-3 text-sm">
              {[
                [Phone, 'WhatsApp', t.phone],
                [BedDouble, 'Kamar', `${t.room.name} • ${rupiah(t.room.price)}/bln`],
                [CalendarDays, 'Tanggal masuk', fmtDate(t.moveInDate)],
                [CalendarDays, 'Jatuh tempo', `Setiap tanggal ${new Date(t.moveInDate).getDate()}`],
                [IdCard, 'No. KTP', t.idNumber || '-'],
              ].map(([I, k, v]: any) => (
                <div key={k} className="flex items-center gap-3">
                  <div className="rounded-lg bg-slate-100 p-2 text-slate-500">
                    <I className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">{k}</p>
                    <p className="font-semibold text-slate-700">{v}</p>
                  </div>
                </div>
              ))}
              {t.note && <p className="rounded-xl bg-slate-50 p-3 text-slate-600">{t.note}</p>}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button className="btn-ghost" onClick={() => setEdit(true)}>
                <Pencil className="h-4 w-4" /> Edit
              </button>
              <button className="btn-danger" onClick={remove}>
                <Trash2 className="h-4 w-4" /> Hapus
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4">
              <p className="text-xs text-slate-500">Total dibayar</p>
              <p className="text-lg font-extrabold text-emerald-600">{rupiah(paid.reduce((s: number, i: any) => s + i.amount, 0))}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-slate-500">Belum dibayar</p>
              <p className="text-lg font-extrabold text-rose-600">{rupiah(unpaid.reduce((s: number, i: any) => s + i.amount, 0))}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-slate-500">Lama tinggal</p>
              <p className="text-lg font-extrabold text-slate-900">{t.invoices.length} bulan</p>
            </div>
          </div>

          <div className="card">
            <div className="border-b border-slate-100 p-5">
              <h3 className="font-bold text-slate-900">Riwayat Tagihan</h3>
            </div>
            <ol className="relative space-y-1 p-5">
              {t.invoices.map((inv: any) => (
                <li key={inv.id} className="flex flex-wrap items-center gap-3 rounded-xl p-3 hover:bg-slate-50 sm:flex-nowrap">
                  <div className={`h-3 w-3 shrink-0 rounded-full ${inv.status === 'LUNAS' ? 'bg-emerald-500' : inv.state === 'TERLAMBAT' ? 'bg-rose-500' : 'bg-amber-400'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800">
                      Bulan ke-{inv.periodIndex + 1}{' '}
                      <span className="font-normal text-slate-500">
                        ({fmtShort(inv.periodStart)} – {fmtShort(inv.periodEnd)})
                      </span>
                    </p>
                    <p className="text-xs text-slate-500">
                      Jatuh tempo {fmtShort(inv.dueDate)}
                      {inv.paidAt && ` • Dibayar ${fmtShort(inv.paidAt)} (${inv.method})`}
                    </p>
                  </div>
                  <p className="font-bold text-slate-900">{rupiah(inv.amount)}</p>
                  <StateBadge state={inv.state} />
                  <div className="flex gap-1.5">
                    {inv.status === 'LUNAS' ? (
                      <a href={`/kwitansi/${inv.receiptToken}`} target="_blank" rel="noreferrer" className="btn-ghost btn-sm">
                        <FileText className="h-4 w-4" />
                      </a>
                    ) : (
                      <button className="btn-success btn-sm" onClick={() => setPay({ ...inv, tenant: t })}>
                        Bayar
                      </button>
                    )}
                    <button className="btn-wa btn-sm" onClick={() => notify(inv)}>
                      <MessageCircle className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <TenantForm open={edit} onClose={() => setEdit(false)} onSaved={reload} tenant={t} />
      <PayModal invoice={pay} onClose={() => setPay(null)} onDone={reload} />
    </Layout>
  );
}
