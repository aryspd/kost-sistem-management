import { idParam, route } from '@/lib/api';
import prisma from '@/lib/prisma';

export default route({
  DELETE: async (req, res) => {
    await prisma.expense.delete({ where: { id: idParam(req) } });
    res.json({ ok: true });
  },
});
