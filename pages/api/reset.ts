// pages/api/reset.ts — Reset data transaksi/operasional dengan verifikasi kode keamanan,
// tanpa menghapus template pesan WhatsApp & pengaturan identitas kost/kios.
import { route } from '@/lib/api';
import prisma from '@/lib/prisma';

export default route({
  POST: async (req, res) => {
    const { securityCode, password, keepRooms = false } = req.body || {};
    const adminPass = process.env.ADMIN_PASSWORD || 'admin123';

    if (String(securityCode || '').trim().toUpperCase() !== 'RESET-DATA') {
      return res.status(400).json({ message: 'Kode keamanan salah. Ketik tepat: RESET-DATA' });
    }
    if (String(password || '') !== adminPass) {
      return res.status(401).json({ message: 'Password Admin salah!' });
    }

    await prisma.$transaction(async (tx) => {
      // Hapus seluruh data yang terisi (log WA, tagihan/kwitansi, pengeluaran, penyewa)
      await tx.waLog.deleteMany();
      await tx.invoice.deleteMany();
      await tx.expense.deleteMany();
      await tx.tenant.deleteMany();

      // Jika user tidak mencentang "Pertahankan daftar Kamar & Kios", hapus juga unitnya
      if (!keepRooms) {
        await tx.room.deleteMany();
      }
      // Catatan: Tabel `Setting` (template pesan WA & pengaturan identitas/rekening) TIDAK dihapus
      // sehingga template bawaan / contoh tetap tersimpan utuh.
    });

    res.json({ ok: true });
  },
});
