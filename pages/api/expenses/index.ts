import { route } from '@/lib/api';
import prisma from '@/lib/prisma';

export default route({
  GET: async (req, res) => {
    const { month } = req.query as { month?: string }; // YYYY-MM
    let where = {};
    if (month) {
      const [y, m] = month.split('-').map(Number);
      where = { date: { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) } };
    }
    res.json(await prisma.expense.findMany({ where, orderBy: { date: 'desc' } }));
  },
  POST: async (req, res) => {
    const { date, category, amount, note } = req.body || {};
    if (!date || !category || !amount) return res.status(400).json({ message: 'Tanggal, kategori, jumlah wajib diisi' });
    const [y, m, d] = String(date).split('-').map(Number);
    const e = await prisma.expense.create({
      data: { date: new Date(y, m - 1, d), category, amount: Number(amount), note: note || '' },
    });
    res.status(201).json(e);
  },
});
