// pages/api/export-csv.ts — Unduh laporan dalam format CSV yang siap dibuka di Microsoft Excel
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { EXPENSE_CATEGORIES, fmtShort } from '@/lib/format';

function toCsvRow(cols: (string | number | null | undefined)[]) {
  return cols
    .map((c) => {
      const s = String(c ?? '').replace(/"/g, '""');
      return `"${s}"`;
    })
    .join(';'); // titik-koma (;) agar langsung rapi per kolom di Excel Indonesia
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const type = String(req.query.type || 'keuangan');
  const year = Number(req.query.year) || new Date().getFullYear();
  const dateStr = new Date().toISOString().slice(0, 10);

  // BOM UTF-8 + sep=; supaya Excel otomatis mengenali pemisah kolom & karakter Indonesia
  const lines: string[] = ['sep=;'];

  if (type === 'tagihan') {
    const invoices = await prisma.invoice.findMany({
      include: { tenant: { include: { room: true } } },
      orderBy: [{ status: 'asc' }, { dueDate: 'desc' }],
    });
    lines.push(
      toCsvRow([
        'No. Kwitansi',
        'Nama Penyewa',
        'No. WhatsApp',
        'Tipe Unit',
        'Nama Unit',
        'Bulan Ke',
        'Periode Mulai',
        'Periode Selesai',
        'Jatuh Tempo',
        'Jumlah (Rp)',
        'Status',
        'Tanggal Bayar',
        'Metode Pembayaran',
      ]),
    );
    for (const i of invoices) {
      lines.push(
        toCsvRow([
          i.receiptNo || '-',
          i.tenant.name,
          i.tenant.phone,
          i.tenant.room.type,
          i.tenant.room.name,
          i.periodIndex + 1,
          fmtShort(i.periodStart),
          fmtShort(i.periodEnd),
          fmtShort(i.dueDate),
          i.amount,
          i.status,
          i.paidAt ? fmtShort(i.paidAt) : '-',
          i.method || '-',
        ]),
      );
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="laporan-tagihan-${dateStr}.csv"`);
    return res.send('\uFEFF' + lines.join('\r\n'));
  }

  // Default: Laporan Buku Kas & Keuangan Lengkap
  const yStart = new Date(year, 0, 1);
  const yEnd = new Date(year + 1, 0, 1);
  const [payments, expenses] = await Promise.all([
    prisma.invoice.findMany({
      where: { status: 'LUNAS', paidAt: { gte: yStart, lt: yEnd } },
      include: { tenant: { include: { room: true } } },
    }),
    prisma.expense.findMany({ where: { date: { gte: yStart, lt: yEnd } } }),
  ]);

  const ledger = [
    ...payments.map((p) => ({
      date: p.paidAt!,
      jenis: 'PEMASUKAN',
      kategori: p.tenant.room.type === 'KIOS' ? 'Sewa Kios' : 'Sewa Kamar Kost',
      keterangan: `${p.tenant.room.name} - ${p.tenant.name}`,
      ref: p.receiptNo || '-',
      metode: p.method || '-',
      masuk: p.amount,
      keluar: 0,
    })),
    ...expenses.map((e) => ({
      date: e.date,
      jenis: 'PENGELUARAN',
      kategori: EXPENSE_CATEGORIES[e.category]?.label || e.category,
      keterangan: e.note || EXPENSE_CATEGORIES[e.category]?.label || e.category,
      ref: e.category,
      metode: '-',
      masuk: 0,
      keluar: e.amount,
    })),
  ].sort((a, b) => +new Date(a.date) - +new Date(b.date));

  lines.push(
    toCsvRow([
      'Tanggal',
      'Jenis Transaksi',
      'Kategori',
      'Keterangan',
      'No. Ref / Kwitansi',
      'Metode',
      'Pemasukan (Rp)',
      'Pengeluaran (Rp)',
      'Saldo Berjalan (Rp)',
    ]),
  );

  let saldo = 0;
  for (const row of ledger) {
    saldo += row.masuk - row.keluar;
    lines.push(
      toCsvRow([
        fmtShort(row.date),
        row.jenis,
        row.kategori,
        row.keterangan,
        row.ref,
        row.metode,
        row.masuk,
        row.keluar,
        saldo,
      ]),
    );
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="laporan-keuangan-${year}-${dateStr}.csv"`);
  return res.send('\uFEFF' + lines.join('\r\n'));
}
