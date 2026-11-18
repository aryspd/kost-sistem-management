import { route } from '@/lib/api';
import { SESSION_COOKIE } from '@/lib/auth';

export default route({
  POST: async (_req, res) => {
    res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
    res.json({ ok: true });
  },
});
