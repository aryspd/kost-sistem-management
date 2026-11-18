import { route } from '@/lib/api';
import prisma from '@/lib/prisma';

export default route({
  GET: async (req, res) => {
    const type = req.query.type as string | undefined; // KAMAR | KIOS | undefined (semua)
    const rooms = await prisma.room.findMany({
      where: type ? { type } : undefined,
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
      include: { tenants: { where: { status: 'AKTIF' }, select: { id: true, name: true, phone: true, note: true } } },
    });
    res.json(rooms);
  },
  POST: async (req, res) => {
    const { name, price, facility, type = 'KAMAR', size = '' } = req.body || {};
    if (!name || !price) return res.status(400).json({ message: 'Nama dan harga sewa wajib diisi' });
    const room = await prisma.room.create({
      data: {
        name: String(name).trim(),
        type: type === 'KIOS' ? 'KIOS' : 'KAMAR',
        price: Number(price),
        size: String(size || '').trim(),
        facility: facility || '',
      },
    });
    res.status(201).json(room);
  },
});
