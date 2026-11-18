import { route } from '@/lib/api';
import prisma from '@/lib/prisma';
import { generateInvoices, invoiceState } from '@/lib/billing';

export default route({
  GET: async (req, res) => {
    await generateInvoices(prisma);
    const { status = 'SEMUA', q = '' } = req.query as Record<string, string>;

    const list = await prisma.invoice.findMany({
      where: {
        ...(status === 'LUNAS' ? { status: 'LUNAS' } : status === 'SEMUA' ? {} : { status: 'BELUM_BAYAR' }),
        ...(q
          ? { OR: [{ tenant: { name: { contains: q } } }, { tenant: { room: { name: { contains: q } } } }] }
          : {}),
      },
      include: { tenant: { include: { room: true } } },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
      take: 500,
    });

    let rows = list.map((i) => ({ ...i, state: invoiceState(i) }));
    if (status === 'TERLAMBAT') rows = rows.filter((r) => r.state === 'TERLAMBAT');
    if (status === 'LUNAS') rows.sort((a, b) => +new Date(b.paidAt!) - +new Date(a.paidAt!));

    const all = await prisma.invoice.findMany({ where: { status: 'BELUM_BAYAR' } });
    const counts = {
      belum: all.length,
      terlambat: all.filter((i) => invoiceState(i) === 'TERLAMBAT').length,
      totalPiutang: all.reduce((s, i) => s + i.amount, 0),
    };
    res.json({ rows, counts });
  },
});
