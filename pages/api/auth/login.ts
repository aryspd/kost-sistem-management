import { route } from '@/lib/api';
import { createSession, SESSION_COOKIE } from '@/lib/auth';

export default route({
  POST: async (req, res) => {
    const { username, password } = req.body || {};
    const U = process.env.ADMIN_USERNAME || 'admin';
    const P = process.env.ADMIN_PASSWORD || 'admin123';
    if (username !== U || password !== P) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }
    const token = await createSession(username);
    res.setHeader(
      'Set-Cookie',
      `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 86400}`,
    );
    res.json({ ok: true });
  },
});
