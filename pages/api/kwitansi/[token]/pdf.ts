// GET /api/kwitansi/:token/pdf  (publik, dipakai untuk lampiran WhatsApp & unduhan)
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { buildReceiptPdf } from '@/lib/receiptPdf';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const inv = await prisma.invoice.findUnique({
    where: { receiptToken: String(req.query.token) },
    include: { tenant: { include: { room: true } } },
  });
  if (!inv || inv.status !== 'LUNAS') return res.status(404).send('Kwitansi tidak ditemukan');

  const bytes = await buildReceiptPdf(inv);
  const fname = `kwitansi-${(inv.receiptNo || inv.id).toString().replace(/\//g, '-')}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `${req.query.download ? 'attachment' : 'inline'}; filename="${fname}"`);
  res.send(Buffer.from(bytes));
}
