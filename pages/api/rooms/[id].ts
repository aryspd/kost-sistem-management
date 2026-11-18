import { idParam, route } from '@/lib/api';
import prisma from '@/lib/prisma';

export default route({
  PUT: async (req, res) => {
    const { name, price, facility, type, size } = req.body || {};
    const room = await prisma.room.update({
      where: { id: idParam(req) },
      data: {
        name,
        price: Number(price),
        facility,
        ...(type ? { type } : {}),
        ...(size !== undefined ? { size } : {}),
      },
    });
    res.json(room);
  },
  DELETE: async (req, res) => {
    const used = await prisma.tenant.count({ where: { roomId: idParam(req) } });
    if (used) return res.status(400).json({ message: 'Unit ini masih memiliki data penyewa, tidak bisa dihapus' });
    await prisma.room.delete({ where: { id: idParam(req) } });
    res.json({ ok: true });
  },
});
