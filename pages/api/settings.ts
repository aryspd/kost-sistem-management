import { route } from '@/lib/api';
import prisma from '@/lib/prisma';
import {
  DEFAULT_TEMPLATE_KWITANSI,
  DEFAULT_TEMPLATE_TAGIHAN,
  DEFAULT_TEMPLATE_TERLAMBAT,
  getSettings,
} from '@/lib/config';

const KEYS = [
  'name',
  'manager',
  'address',
  'phone',
  'bank',
  'kiosName',
  'kiosManager',
  'kiosAddress',
  'kiosPhone',
  'kiosBank',
  'baseUrl',
  'fonnteToken',
  'templateTagihan',
  'templateTerlambat',
  'templateKwitansi',
] as const;

export default route({
  GET: async (_req, res) => {
    const settings = await getSettings();
    res.json({
      ...settings,
      defaults: {
        templateTagihan: DEFAULT_TEMPLATE_TAGIHAN,
        templateTerlambat: DEFAULT_TEMPLATE_TERLAMBAT,
        templateKwitansi: DEFAULT_TEMPLATE_KWITANSI,
      },
    });
  },
  PUT: async (req, res) => {
    const body = req.body || {};
    for (const k of KEYS) {
      if (body[k] !== undefined) {
        const val = String(body[k]);
        await prisma.setting.upsert({
          where: { key: k },
          create: { key: k, value: val },
          update: { value: val },
        });
      }
    }
    res.json(await getSettings());
  },
});
