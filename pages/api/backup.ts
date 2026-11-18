// pages/api/backup.ts — Export (GET) & Import/Restore (POST) seluruh database & laporan
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const [rooms, tenants, invoices, expenses, waLogs, settings] = await Promise.all([
        prisma.room.findMany({ orderBy: { id: 'asc' } }),
        prisma.tenant.findMany({ orderBy: { id: 'asc' } }),
        prisma.invoice.findMany({ orderBy: { id: 'asc' } }),
        prisma.expense.findMany({ orderBy: { id: 'asc' } }),
        prisma.waLog.findMany({ orderBy: { id: 'asc' } }),
        prisma.setting.findMany({ orderBy: { key: 'asc' } }),
      ]);

      const payload = {
        app: 'kost-sistem-management',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        counts: {
          rooms: rooms.length,
          tenants: tenants.length,
          invoices: invoices.length,
          expenses: expenses.length,
          waLogs: waLogs.length,
          settings: settings.length,
        },
        data: { rooms, tenants, invoices, expenses, waLogs, settings },
      };

      if (req.query.download === '1') {
        const dateStr = new Date().toISOString().slice(0, 10);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="backup-kost-kios-${dateStr}.json"`);
        return res.send(JSON.stringify(payload, null, 2));
      }

      return res.json(payload);
    }

    if (req.method === 'POST') {
      const body = req.body;
      const d = body?.data || body;
      if (!d || !Array.isArray(d.rooms) || !Array.isArray(d.tenants) || !Array.isArray(d.invoices)) {
        return res.status(400).json({ message: 'Format file backup tidak valid atau rusak.' });
      }

      await prisma.$transaction(async (tx) => {
        // Bersihkan data lama dengan urutan relasi yang aman
        await tx.waLog.deleteMany();
        await tx.invoice.deleteMany();
        await tx.tenant.deleteMany();
        await tx.room.deleteMany();
        await tx.expense.deleteMany();
        await tx.setting.deleteMany();

        // Pulihkan Kamar & Kios
        for (const r of d.rooms) {
          await tx.room.create({
            data: {
              id: r.id,
              name: r.name,
              type: r.type || 'KAMAR',
              price: Number(r.price),
              size: r.size || '',
              facility: r.facility || '',
              createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
            },
          });
        }

        // Pulihkan Penyewa
        for (const t of d.tenants) {
          await tx.tenant.create({
            data: {
              id: t.id,
              name: t.name,
              phone: t.phone,
              idNumber: t.idNumber || '',
              roomId: t.roomId,
              moveInDate: new Date(t.moveInDate),
              status: t.status || 'AKTIF',
              note: t.note || '',
              createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
            },
          });
        }

        // Pulihkan Tagihan & Pembayaran
        for (const inv of d.invoices) {
          await tx.invoice.create({
            data: {
              id: inv.id,
              tenantId: inv.tenantId,
              periodIndex: inv.periodIndex,
              periodStart: new Date(inv.periodStart),
              periodEnd: new Date(inv.periodEnd),
              dueDate: new Date(inv.dueDate),
              amount: Number(inv.amount),
              status: inv.status || 'BELUM_BAYAR',
              paidAt: inv.paidAt ? new Date(inv.paidAt) : null,
              method: inv.method || null,
              receiptNo: inv.receiptNo || null,
              receiptToken: inv.receiptToken,
              lastNotified: inv.lastNotified ? new Date(inv.lastNotified) : null,
              createdAt: inv.createdAt ? new Date(inv.createdAt) : new Date(),
            },
          });
        }

        // Pulihkan Pengeluaran
        for (const e of d.expenses || []) {
          await tx.expense.create({
            data: {
              id: e.id,
              date: new Date(e.date),
              category: e.category,
              amount: Number(e.amount),
              note: e.note || '',
              createdAt: e.createdAt ? new Date(e.createdAt) : new Date(),
            },
          });
        }

        // Pulihkan Riwayat WA
        for (const w of d.waLogs || []) {
          await tx.waLog.create({
            data: {
              id: w.id,
              phone: w.phone,
              message: w.message,
              type: w.type,
              status: w.status,
              createdAt: w.createdAt ? new Date(w.createdAt) : new Date(),
            },
          });
        }

        // Pulihkan Pengaturan & Template
        for (const s of d.settings || []) {
          await tx.setting.create({
            data: {
              key: s.key,
              value: s.value,
            },
          });
        }
      });

      return res.json({
        ok: true,
        restored: {
          rooms: d.rooms.length,
          tenants: d.tenants.length,
          invoices: d.invoices.length,
          expenses: (d.expenses || []).length,
        },
      });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ message: 'Method tidak diizinkan' });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ message: e?.message || 'Gagal memproses backup/restore' });
  }
}
