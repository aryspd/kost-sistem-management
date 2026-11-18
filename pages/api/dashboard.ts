import { route } from '@/lib/api';
import prisma from '@/lib/prisma';
import { generateInvoices, invoiceState } from '@/lib/billing';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export default route({
  GET: async (_req, res) => {
    await generateInvoices(prisma);
    const now = new Date();
    const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const sixAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [rooms, activeTenants, unpaid, paid6, exp6, recent] = await Promise.all([
      prisma.room.findMany({ include: { tenants: { where: { status: 'AKTIF' } } } }),
      prisma.tenant.count({ where: { status: 'AKTIF' } }),
      prisma.invoice.findMany({
        where: { status: 'BELUM_BAYAR' },
        include: { tenant: { include: { room: true } } },
        orderBy: { dueDate: 'asc' },
      }),
      prisma.invoice.findMany({ where: { status: 'LUNAS', paidAt: { gte: sixAgo } } }),
      prisma.expense.findMany({ where: { date: { gte: sixAgo } } }),
      prisma.invoice.findMany({
        where: { status: 'LUNAS' },
        include: { tenant: { include: { room: true } } },
        orderBy: { paidAt: 'desc' },
        take: 5,
      }),
    ]);

    const chart = Array.from({ length: 6 }, (_, k) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + k, 1);
      const same = (x: Date) => x.getFullYear() === d.getFullYear() && x.getMonth() === d.getMonth();
      return {
        label: `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
        income: paid6.filter((p) => same(p.paidAt!)).reduce((s, p) => s + p.amount, 0),
        expense: exp6.filter((e) => same(e.date)).reduce((s, e) => s + e.amount, 0),
      };
    });

    const unpaidWithState = unpaid.map((i) => ({ ...i, state: invoiceState(i) }));
    const occupied = rooms.filter((r) => r.tenants.length > 0).length;
    const kamarRooms = rooms.filter((r) => r.type !== 'KIOS');
    const kiosRooms = rooms.filter((r) => r.type === 'KIOS');

    res.json({
      stats: {
        totalRooms: rooms.length,
        occupied,
        totalKamar: kamarRooms.length,
        occupiedKamar: kamarRooms.filter((r) => r.tenants.length > 0).length,
        totalKios: kiosRooms.length,
        occupiedKios: kiosRooms.filter((r) => r.tenants.length > 0).length,
        activeTenants,
        incomeMonth: paid6.filter((p) => p.paidAt! >= mStart).reduce((s, p) => s + p.amount, 0),
        expenseMonth: exp6.filter((e) => e.date >= mStart).reduce((s, e) => s + e.amount, 0),
        receivable: unpaid.filter((i) => i.dueDate <= now).reduce((s, i) => s + i.amount, 0),
        lateCount: unpaidWithState.filter((i) => i.state === 'TERLAMBAT').length,
      },
      chart,
      upcoming: unpaidWithState.slice(0, 6),
      recent,
    });
  },
});
