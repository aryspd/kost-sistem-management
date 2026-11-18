import { route } from '@/lib/api';
import prisma from '@/lib/prisma';
import { generateInvoices, invoiceState, nextDueDate } from '@/lib/billing';

export default route({
  GET: async (_req, res) => {
    await generateInvoices(prisma);
    const tenants = await prisma.tenant.findMany({
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
      include: { room: true, invoices: { where: { status: 'BELUM_BAYAR' } } },
    });
    res.json(
      tenants.map(({ invoices, ...t }) => {
        const late = invoices.filter((i) => invoiceState(i) === 'TERLAMBAT');
        return {
          ...t,
          nextDue: t.status === 'AKTIF' ? nextDueDate(t.moveInDate) : null,
          unpaidCount: invoices.length,
          unpaidTotal: invoices.reduce((s, i) => s + i.amount, 0),
          lateCount: late.length,
        };
      }),
    );
  },
  POST: async (req, res) => {
    const { name, phone, idNumber, roomId, moveInDate, note } = req.body || {};
    if (!name || !phone || !roomId || !moveInDate)
      return res.status(400).json({ message: 'Nama, No. WA, kamar dan tanggal masuk wajib diisi' });

    const occupied = await prisma.tenant.count({ where: { roomId: Number(roomId), status: 'AKTIF' } });
    if (occupied) return res.status(400).json({ message: 'Kamar tersebut sudah terisi' });

    const [y, m, d] = String(moveInDate).split('-').map(Number);
    const tenant = await prisma.tenant.create({
      data: {
        name,
        phone,
        idNumber: idNumber || '',
        note: note || '',
        roomId: Number(roomId),
        moveInDate: new Date(y, m - 1, d),
      },
    });
    await generateInvoices(prisma, tenant.id);
    res.status(201).json(tenant);
  },
});
