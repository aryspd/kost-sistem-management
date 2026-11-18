// pages/kwitansi/[token].tsx — halaman kwitansi PUBLIK (dibuka penghuni dari link WhatsApp)
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { Download, Printer, CheckCircle2, Building2 } from 'lucide-react';
import prisma from '@/lib/prisma';
import { getSettings, resolveProfile } from '@/lib/config';
import { terbilangRupiah } from '@/lib/receiptPdf';
import { fmtDate, rupiah } from '@/lib/format';

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const inv = await prisma.invoice.findUnique({
    where: { receiptToken: String(params?.token) },
    include: { tenant: { include: { room: true } } },
  });
  if (!inv || inv.status !== 'LUNAS') return { notFound: true };
  const cfg = await getSettings();
  const kost = resolveProfile(cfg, inv.tenant.room.type);
  return {
    props: {
      inv: JSON.parse(JSON.stringify(inv)),
      kost,
      terbilang: terbilangRupiah(inv.amount),
    },
  };
};

export default function Kwitansi({ inv, kost, terbilang }: any) {
  const unitLabel = inv.tenant.room.type === 'KIOS' ? 'Sewa kios' : 'Sewa kamar';
  const rows = [
    ['Telah terima dari', inv.tenant.name],
    ['No. WhatsApp', inv.tenant.phone],
    ['Untuk pembayaran', `${unitLabel} ${inv.tenant.room.name}`],
    ['Periode', `${fmtDate(inv.periodStart)} s/d ${fmtDate(inv.periodEnd)}`],
    ['Metode pembayaran', inv.method],
    ['Tanggal bayar', fmtDate(inv.paidAt, true)],
  ];
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-brand-50 px-4 py-10 print:bg-white print:p-0">
      <Head>
        <title>Kwitansi {inv.receiptNo} – {kost.name}</title>
      </Head>

      <div className="no-print mx-auto mb-5 flex max-w-3xl flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> Pembayaran terverifikasi
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="btn-ghost">
            <Printer className="h-4 w-4" /> Cetak
          </button>
          <a href={`/api/kwitansi/${inv.receiptToken}/pdf?download=1`} className="btn-primary">
            <Download className="h-4 w-4" /> Unduh PDF
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl print:rounded-none print:shadow-none">
        <div className="relative flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-brand-600 to-indigo-600 px-8 py-7 text-white">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/15 p-2.5">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xl font-extrabold">{kost.name}</p>
              <p className="text-xs text-brand-100">
                {kost.address} • Telp {kost.phone}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold tracking-widest">KWITANSI</p>
            <p className="text-sm text-brand-100">{inv.receiptNo}</p>
          </div>
        </div>

        <div className="relative px-8 py-8">
          <div className="pointer-events-none absolute right-10 top-10 rotate-[-14deg] rounded-xl border-4 border-emerald-500/70 px-5 py-2 text-3xl font-black tracking-widest text-emerald-500/70">
            LUNAS
          </div>
          <dl className="space-y-3">
            {rows.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[150px_1fr] gap-2 border-b border-dashed border-slate-200 pb-3 text-sm sm:grid-cols-[200px_1fr]">
                <dt className="text-slate-500">{k}</dt>
                <dd className="font-semibold text-slate-900">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 rounded-2xl bg-brand-50 p-4 text-sm italic text-brand-900">Terbilang: {terbilang}</div>

          <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
            <div className="rounded-2xl border-2 border-brand-600 px-6 py-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Jumlah</p>
              <p className="text-3xl font-extrabold text-brand-700">{rupiah(inv.amount)}</p>
            </div>
            <div className="text-center text-sm">
              <p className="text-slate-500">Hormat kami,</p>
              <div className="h-14" />
              <p className="border-t border-slate-300 pt-1 font-semibold text-slate-800">{kost.manager}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-50 px-8 py-3 text-center text-xs text-slate-400">
          Kwitansi ini dibuat otomatis oleh sistem dan sah tanpa tanda tangan basah.
        </div>
      </div>
    </div>
  );
}
