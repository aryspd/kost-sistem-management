// GET /api/cron/reminder?key=CRON_SECRET
// Jalankan 1x sehari (Windows Task Scheduler / cron-job.org / Vercel Cron).
// - membuat tagihan baru (H-7 jatuh tempo)
// - mengirim pengingat WA untuk tagihan H-3, H-0, dan yang terlambat (maks 1x per hari per tagihan)
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { daysBetween, generateInvoices, invoiceState, startOfDay } from '@/lib/billing';
import { buildMsgTagihan, sendWhatsApp } from '@/lib/whatsapp';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.query.key !== (process.env.CRON_SECRET || 'rahasia-cron'))
    return res.status(401).json({ message: 'Kunci cron salah' });

  const created = await generateInvoices(prisma);
  const today = startOfDay(new Date());
  const unpaid = await prisma.invoice.findMany({
    where: { status: 'BELUM_BAYAR', tenant: { status: 'AKTIF' } },
    include: { tenant: { include: { room: true } } },
  });

  const results = [];
  for (const inv of unpaid) {
    const diff = daysBetween(today, inv.dueDate);
    const shouldRemind = diff === 3 || diff === 0 || diff < 0;
    const alreadyToday = inv.lastNotified && startOfDay(inv.lastNotified).getTime() === today.getTime();
    if (!shouldRemind || alreadyToday) continue;
    const late = invoiceState(inv) === 'TERLAMBAT';
    const r = await sendWhatsApp(inv.tenant.phone, await buildMsgTagihan(inv, late), 'PENGINGAT');
    await prisma.invoice.update({ where: { id: inv.id }, data: { lastNotified: new Date() } });
    results.push({ tenant: inv.tenant.name, diff, ...r });
  }
  res.json({ createdInvoices: created, reminders: results.length, results });
}
