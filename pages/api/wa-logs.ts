import { route } from '@/lib/api';
import prisma from '@/lib/prisma';
import { getSettings } from '@/lib/config';

export default route({
  GET: async (_req, res) => {
    const cfg = await getSettings();
    res.json({
      mode: cfg.fonnteToken ? 'auto' : 'link',
      logs: await prisma.waLog.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
    });
  },
});
