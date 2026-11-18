// lib/api.ts — helper kecil untuk API route
import type { NextApiRequest, NextApiResponse } from 'next';

type H = (req: NextApiRequest, res: NextApiResponse) => Promise<any> | any;

export function route(handlers: Partial<Record<'GET' | 'POST' | 'PUT' | 'DELETE', H>>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const h = handlers[req.method as keyof typeof handlers];
    if (!h) {
      res.setHeader('Allow', Object.keys(handlers));
      return res.status(405).json({ message: 'Method tidak diizinkan' });
    }
    try {
      await h(req, res);
    } catch (e: any) {
      console.error(e);
      const msg = e?.code === 'P2002' ? 'Data sudah ada (duplikat)' : e?.message || 'Terjadi kesalahan server';
      res.status(500).json({ message: msg });
    }
  };
}

export const idParam = (req: NextApiRequest) => Number(req.query.id);
