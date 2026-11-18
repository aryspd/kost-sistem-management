import { idParam, route } from '@/lib/api';
import prisma from '@/lib/prisma';
import { generateInvoices, invoiceState } from '@/lib/billing';

export default route({
  GET: async (req, res) => {
    const t = await prisma.tenant.findUnique({
      where: { id: idParam(req) },
      include: { room: true, invoices: { orderBy: { periodIndex: 'desc' } } },
    });
    if (!t) return res.status(404).json({ message: 'Penghuni tidak ditemukan' });
    res.json({ ...t, invoices: t.invoices.map((i) => ({ ...i, state: invoiceState(i) })) });
  },
  PUT: async (req, res) => {
    const id = idParam(req);
    const { name, phone, idNumber, roomId, moveInDate, note, status } = req.body || {};
    const old = await prisma.tenant.findUnique({ where: { id } });
    if (!old) return res.status(404).json({ message: 'Penghuni tidak ditemukan' });

    if (roomId && Number(roomId) !== old.roomId && (status ?? old.status) === 'AKTIF') {
      const occupied = await prisma.tenant.count({ where: { roomId: Number(roomId), status: 'AKTIF' } });
      if (occupied) return res.status(400).json({ message: 'Kamar tujuan sudah terisi' });
    }

    let newMoveIn: Date | undefined;
    if (moveInDate) {
      const [y, m, d] = String(moveInDate).split('-').map(Number);
      newMoveIn = new Date(y, m - 1, d);
    }

    const t = await prisma.tenant.update({
      where: { id },
      data: { name, phone, idNumber, note, status, roomId: roomId ? Number(roomId) : undefined, moveInDate: newMoveIn },
    });

    // tanggal masuk berubah -> susun ulang tagihan yang belum dibayar
    if (newMoveIn && newMoveIn.getTime() !== old.moveInDate.getTime()) {
      await prisma.invoice.deleteMany({ where: { tenantId: id, status: 'BELUM_BAYAR' } });
    }
    // penghuni keluar -> hapus tagihan mendatang yang belum jatuh tempo
    if (status === 'KELUAR') {
      await prisma.invoice.deleteMany({ where: { tenantId: id, status: 'BELUM_BAYAR', dueDate: { gt: new Date() } } });
    }
    await generateInvoices(prisma, id);
    res.json(t);
  },
  DELETE: async (req, res) => {
    await prisma.tenant.delete({ where: { id: idParam(req) } });
    res.json({ ok: true });
  },
});
