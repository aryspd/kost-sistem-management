// POST { type: 'tagihan' | 'kwitansi' } -> kirim / buat link WhatsApp
import { idParam, route } from '@/lib/api';
import prisma from '@/lib/prisma';
import { invoiceState } from '@/lib/billing';
import { getSettings } from '@/lib/config';
import { buildMsgKwitansi, buildMsgTagihan, receiptPdfUrl, sendWhatsApp } from '@/lib/whatsapp';

export default route({
  POST: async (req, res) => {
    const inv = await prisma.invoice.findUnique({
      where: { id: idParam(req) },
      include: { tenant: { include: { room: true } } },
    });
    if (!inv) return res.status(404).json({ message: 'Tagihan tidak ditemukan' });

    const cfg = await getSettings();
    const type = req.body?.type === 'kwitansi' || inv.status === 'LUNAS' ? 'kwitansi' : 'tagihan';
    const wa =
      type === 'kwitansi'
        ? await sendWhatsApp(inv.tenant.phone, await buildMsgKwitansi(inv), 'KWITANSI', receiptPdfUrl(inv, cfg.baseUrl))
        : await sendWhatsApp(
            inv.tenant.phone,
            await buildMsgTagihan(inv, invoiceState(inv) === 'TERLAMBAT'),
            'TAGIHAN',
          );

    if (type === 'tagihan') await prisma.invoice.update({ where: { id: inv.id }, data: { lastNotified: new Date() } });
    res.json(wa);
  },
});
