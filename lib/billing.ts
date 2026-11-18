// lib/billing.ts — inti logika tagihan berdasarkan TANGGAL MASUK penghuni
//
// Aturan:
//  - Penghuni masuk tgl 15 Jan  -> periode 1: 15 Jan – 14 Feb, jatuh tempo 15 Jan (bayar di muka)
//                               -> periode 2: 15 Feb – 14 Mar, jatuh tempo 15 Feb, dst.
//  - Jika tanggal masuk 29/30/31 dan bulan tsb lebih pendek, jatuh tempo = tanggal terakhir bulan itu.
//  - Tagihan dibuat otomatis H-7 sebelum jatuh tempo.

import type { PrismaClient } from '@prisma/client';

export const GENERATE_AHEAD_DAYS = 7; // tagihan muncul 7 hari sebelum jatuh tempo
export const DUE_SOON_DAYS = 3; // status "Segera Jatuh Tempo" jika <= 3 hari

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Tambah n bulan dengan mempertahankan tanggal asli (di-clamp ke akhir bulan). */
export function addMonthsKeepDay(base: Date, n: number, day = base.getDate()) {
  const y = base.getFullYear();
  const m = base.getMonth() + n;
  const lastDay = new Date(y, m + 1, 0).getDate();
  return new Date(y, m, Math.min(day, lastDay));
}

export function periodFor(moveIn: Date, index: number) {
  const day = moveIn.getDate();
  const start = addMonthsKeepDay(moveIn, index, day);
  const nextStart = addMonthsKeepDay(moveIn, index + 1, day);
  const end = new Date(nextStart.getFullYear(), nextStart.getMonth(), nextStart.getDate() - 1);
  return { start, end, due: start };
}

export const daysBetween = (a: Date, b: Date) =>
  Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000);

export type InvoiceState = 'LUNAS' | 'TERLAMBAT' | 'JATUH_TEMPO' | 'BELUM_BAYAR';

export function invoiceState(inv: { status: string; dueDate: Date | string }): InvoiceState {
  if (inv.status === 'LUNAS') return 'LUNAS';
  const diff = daysBetween(new Date(), new Date(inv.dueDate)); // hari menuju jatuh tempo
  if (diff < 0) return 'TERLAMBAT';
  if (diff <= DUE_SOON_DAYS) return 'JATUH_TEMPO';
  return 'BELUM_BAYAR';
}

/** Tanggal jatuh tempo berikutnya untuk seorang penghuni (dari hari ini). */
export function nextDueDate(moveIn: Date, from = new Date()) {
  const today = startOfDay(from);
  for (let i = 0; i < 1200; i++) {
    const { due } = periodFor(moveIn, i);
    if (due >= today) return due;
  }
  return today;
}

/**
 * Buat semua tagihan yang belum ada untuk penghuni aktif,
 * mulai dari periode pertama sampai periode yang jatuh temponya <= hari ini + 7 hari.
 * Aman dipanggil berulang (idempoten).
 */
export async function generateInvoices(prisma: PrismaClient, tenantId?: number) {
  const limit = startOfDay(new Date());
  limit.setDate(limit.getDate() + GENERATE_AHEAD_DAYS);

  const tenants = await prisma.tenant.findMany({
    where: { status: 'AKTIF', ...(tenantId ? { id: tenantId } : {}) },
    include: { room: true, invoices: { select: { periodIndex: true } } },
  });

  let created = 0;
  for (const t of tenants) {
    const existing = new Set(t.invoices.map((i) => i.periodIndex));
    for (let idx = 0; idx < 1200; idx++) {
      const p = periodFor(t.moveInDate, idx);
      if (p.due > limit) break;
      if (existing.has(idx)) continue;
      await prisma.invoice.create({
        data: {
          tenantId: t.id,
          periodIndex: idx,
          periodStart: p.start,
          periodEnd: p.end,
          dueDate: p.due,
          amount: t.room.price,
        },
      });
      created++;
    }
  }
  return created;
}

export function makeReceiptNo(id: number, paidAt: Date) {
  const ym = `${paidAt.getFullYear()}${String(paidAt.getMonth() + 1).padStart(2, '0')}`;
  return `KW/${ym}/${String(id).padStart(5, '0')}`;
}
