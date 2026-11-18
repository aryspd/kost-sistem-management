// POST   -> tandai tagihan LUNAS (+ kirim kwitansi WA)
// DELETE -> batalkan pelunasan
import { idParam, route } from '@/lib/api';
import prisma from '@/lib/prisma';
import { makeReceiptNo } from '@/lib/billing';
import { getSettings } from '@/lib/config';
import { buildMsgKwitansi, receiptPdfUrl, sendWhatsApp } from '@/lib/whatsapp';

export default route({
  POST: async (req, res) => {
    const id = idParam(req);
    const { method = 'TUNAI', paidAt, amount, notify = true } = req.body || {};
    const inv = await prisma.invoice.findUnique({ where: { id } });
    if (!inv) return res.status(404).json({ message: 'Tagihan tidak ditemukan' });
    if (inv.status === 'LUNAS') return res.status(400).json({ message: 'Tagihan sudah lunas' });

    let date = new Date();
    if (paidAt) {
      const [y, m, d] = String(paidAt).split('-').map(Number);
      date = new Date(y, m - 1, d, new Date().getHours(), new Date().getMinutes());
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        status: 'LUNAS',
        method,
        paidAt: date,
        amount: amount ? Number(amount) : undefined,
        receiptNo: makeReceiptNo(id, date),
      },
      include: { tenant: { include: { room: true } } },
    });

    let wa = null;
    if (notify) {
      const cfg = await getSettings();
      const msg = await buildMsgKwitansi(updated);
      wa = await sendWhatsApp(updated.tenant.phone, msg, 'KWITANSI', receiptPdfUrl(updated, cfg.baseUrl));
    }
    res.json({ invoice: updated, wa });
  },
  DELETE: async (req, res) => {
    const updated = await prisma.invoice.update({
      where: { id: idParam(req) },
      data: { status: 'BELUM_BAYAR', paidAt: null, method: null, receiptNo: null },
    });
    res.json(updated);
  },
});
