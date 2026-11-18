// GET ?year=2026&month=2026-11 -> laporan keuangan tahunan + buku kas bulan terpilih
import { route } from '@/lib/api';
import prisma from '@/lib/prisma';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export default route({
  GET: async (req, res) => {
    const now = new Date();
    const year = Number(req.query.year) || now.getFullYear();
    const month = (req.query.month as string) || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const yStart = new Date(year, 0, 1);
    const yEnd = new Date(year + 1, 0, 1);
    const [payments, expenses] = await Promise.all([
      prisma.invoice.findMany({
        where: { status: 'LUNAS', paidAt: { gte: yStart, lt: yEnd } },
        include: { tenant: { include: { room: true } } },
      }),
      prisma.expense.findMany({ where: { date: { gte: yStart, lt: yEnd } } }),
    ]);

    const monthly = MONTHS.map((label, i) => {
      const income = payments.filter((p) => p.paidAt!.getMonth() === i).reduce((s, p) => s + p.amount, 0);
      const expense = expenses.filter((e) => e.date.getMonth() === i).reduce((s, e) => s + e.amount, 0);
      return { label, income, expense, profit: income - expense };
    });

    const byCategory: Record<string, number> = {};
    expenses.forEach((e) => (byCategory[e.category] = (byCategory[e.category] || 0) + e.amount));

    const byMethod: Record<string, number> = {};
    payments.forEach((p) => (byMethod[p.method || 'LAINNYA'] = (byMethod[p.method || 'LAINNYA'] || 0) + p.amount));

    // buku kas bulan terpilih
    const [my, mm] = month.split('-').map(Number);
    const inMonth = (d: Date) => d.getFullYear() === my && d.getMonth() === mm - 1;
    const ledger = [
      ...payments
        .filter((p) => inMonth(p.paidAt!))
        .map((p) => ({
          date: p.paidAt,
          type: 'MASUK',
          desc: `Sewa ${p.tenant.room.name} – ${p.tenant.name}`,
          ref: p.receiptNo,
          amount: p.amount,
          token: p.receiptToken,
        })),
      ...expenses
        .filter((e) => inMonth(e.date))
        .map((e) => ({ date: e.date, type: 'KELUAR', desc: e.note || e.category, ref: e.category, amount: e.amount, id: e.id })),
    ].sort((a, b) => +new Date(a.date!) - +new Date(b.date!));

    const totalIncome = monthly.reduce((s, m) => s + m.income, 0);
    const totalExpense = monthly.reduce((s, m) => s + m.expense, 0);
    res.json({ year, month, monthly, byCategory, byMethod, ledger, totalIncome, totalExpense, profit: totalIncome - totalExpense });
  },
});
