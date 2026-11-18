import { useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Zap, Link2, Send, CheckCheck, XCircle, BellRing, Clock, Settings } from 'lucide-react';
import Layout from '@/components/Layout';
import { api, Avatar, Empty, LoadingBlock, StateBadge, useData, useToast, useWa } from '@/components/ui';
import { fmtShort, rupiah } from '@/lib/format';

export default function Notifikasi() {
  const { data: inv, loading, reload } = useData<any>('/api/invoices?status=BELUM');
  const { data: logs, reload: reloadLogs } = useData<any>('/api/wa-logs');
  const toast = useToast();
  const wa = useWa();
  const [busy, setBusy] = useState<number | null>(null);

  const targets = (inv?.rows || []).filter((r: any) => r.state === 'TERLAMBAT' || r.state === 'JATUH_TEMPO');

  const send = async (r: any) => {
    setBusy(r.id);
    try {
      wa(await api(`/api/invoices/${r.id}/notify`, 'POST', { type: 'tagihan' }));
      reload();
      reloadLogs();
    } catch (e: any) {
      toast('error', e.message);
    } finally {
      setBusy(null);
    }
  };

  const auto = logs?.mode === 'auto';

  return (
    <Layout
      title="Notifikasi WhatsApp"
      subtitle="Kirim pengingat tagihan & kwitansi ke penghuni"
      actions={
        <Link href="/pengaturan" className="btn-ghost">
          <Settings className="h-4 w-4" /> <span className="hidden sm:inline">Ubah Rekening & Template Pesan</span>
        </Link>
      }
    >
      <div className={`mb-6 flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center ${auto ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white' : 'border border-amber-200 bg-amber-50'}`}>
        <div className={`rounded-xl p-3 ${auto ? 'bg-white/20' : 'bg-amber-100 text-amber-600'}`}>{auto ? <Zap className="h-6 w-6" /> : <Link2 className="h-6 w-6" />}</div>
        <div className="flex-1">
          <p className={`font-bold ${auto ? '' : 'text-amber-900'}`}>{auto ? 'Mode Otomatis aktif (Fonnte)' : 'Mode Manual (link wa.me)'}</p>
          <p className={`text-sm ${auto ? 'text-white/85' : 'text-amber-700'}`}>
            {auto
              ? 'Pesan & file PDF kwitansi dikirim langsung dari server tanpa perlu membuka WhatsApp.'
              : 'Pesan disiapkan otomatis, Anda cukup klik "Buka WhatsApp" lalu Kirim. Isi FONNTE_TOKEN di file .env untuk pengiriman otomatis + lampiran PDF.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="card xl:col-span-3">
          <div className="flex items-center gap-2 border-b border-slate-100 p-5">
            <BellRing className="h-5 w-5 text-amber-500" />
            <h2 className="font-bold text-slate-900">Perlu Diingatkan</h2>
            <span className="ml-auto rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">{targets.length}</span>
          </div>
          {loading && !inv ? (
            <LoadingBlock />
          ) : targets.length === 0 ? (
            <Empty icon={CheckCheck} title="Tidak ada yang perlu diingatkan" text="Tagihan yang jatuh tempo ≤ 3 hari lagi atau terlambat akan muncul di sini." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {targets.map((r: any) => (
                <li key={r.id} className="flex flex-wrap items-center gap-3 p-4 sm:flex-nowrap">
                  <Avatar name={r.tenant.name} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800">{r.tenant.name}</p>
                    <p className="text-xs text-slate-500">
                      {r.tenant.room.name} • {rupiah(r.amount)} • jatuh tempo {fmtShort(r.dueDate)}
                    </p>
                    {r.lastNotified && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-green-600">
                        <Clock className="h-3 w-3" /> Terakhir diingatkan {fmtShort(r.lastNotified)}
                      </p>
                    )}
                  </div>
                  <StateBadge state={r.state} />
                  <button className="btn-wa btn-sm" disabled={busy === r.id} onClick={() => send(r)}>
                    <Send className="h-3.5 w-3.5" /> Kirim
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card xl:col-span-2">
          <div className="flex items-center gap-2 border-b border-slate-100 p-5">
            <MessageCircle className="h-5 w-5 text-green-600" />
            <h2 className="font-bold text-slate-900">Riwayat Pesan</h2>
          </div>
          {!logs || logs.logs.length === 0 ? (
            <Empty icon={MessageCircle} title="Belum ada pesan" />
          ) : (
            <ul className="max-h-[560px] divide-y divide-slate-100 overflow-y-auto">
              {logs.logs.map((l: any) => (
                <li key={l.id} className="p-4">
                  <div className="mb-1 flex items-center gap-2 text-xs">
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-bold text-slate-600">{l.type}</span>
                    <span className="text-slate-500">+{l.phone}</span>
                    <span className="ml-auto flex items-center gap-1 font-semibold">
                      {l.status === 'TERKIRIM' ? (
                        <span className="flex items-center gap-1 text-emerald-600"><CheckCheck className="h-3.5 w-3.5" /> Terkirim</span>
                      ) : l.status === 'GAGAL' ? (
                        <span className="flex items-center gap-1 text-rose-600"><XCircle className="h-3.5 w-3.5" /> Gagal</span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-600"><Link2 className="h-3.5 w-3.5" /> Link</span>
                      )}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-sm text-slate-600">{l.message.replace(/\*/g, '')}</p>
                  <p className="mt-1 text-xs text-slate-400">{new Date(l.createdAt).toLocaleString('id-ID')}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
}
