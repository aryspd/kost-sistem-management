// lib/config.ts — identitas Kost & Kios terpisah + template pesan WhatsApp
import prisma from './prisma';

export const DEFAULT_TEMPLATE_TAGIHAN = [
  'Halo *{nama}* 👋',
  '',
  '🔔 Pengingat tagihan sewa {jenis_unit} *{nama_properti}*.',
  '',
  '{ikon_unit} {label_unit} : {unit}',
  '📅 Periode    : {periode}',
  '⏰ Jatuh tempo: *{jatuh_tempo}*',
  '💰 Jumlah     : *{jumlah}*',
  '',
  'Pembayaran dapat ditransfer ke:',
  '🏦 *{rekening}*',
  '',
  'Mohon kirim bukti transfer setelah membayar. Terima kasih 🙏',
  '— {nama_pengelola}',
].join('\n');

export const DEFAULT_TEMPLATE_TERLAMBAT = [
  'Halo *{nama}* 👋',
  '',
  '⚠️ Tagihan sewa {jenis_unit} Anda di *{nama_properti}* *sudah melewati jatuh tempo*.',
  '',
  '{ikon_unit} {label_unit} : {unit}',
  '📅 Periode    : {periode}',
  '⏰ Jatuh tempo: *{jatuh_tempo}*',
  '💰 Jumlah     : *{jumlah}*',
  '',
  'Mohon segera melakukan pembayaran ke:',
  '🏦 *{rekening}*',
  '',
  'Terima kasih atas kerja samanya 🙏',
  '— {nama_pengelola}',
].join('\n');

export const DEFAULT_TEMPLATE_KWITANSI = [
  'Halo *{nama}* 👋',
  '',
  '✅ *Pembayaran sewa {jenis_unit} telah kami terima.* Terima kasih!',
  '',
  '🧾 No. Kwitansi : {no_kwitansi}',
  '{ikon_unit} {label_unit}  : {unit}',
  '📅 Periode      : {periode}',
  '💰 Jumlah       : *{jumlah}*',
  '💳 Metode       : {metode}',
  '🗓️ Tanggal bayar: {tanggal_bayar}',
  '',
  '📎 Kwitansi resmi dapat dilihat & diunduh di:',
  '{link_kwitansi}',
  '',
  '— {nama_pengelola}',
].join('\n');

export const kost = {
  // Identitas Kost (Kamar)
  name: process.env.KOST_NAME || 'Kost Harmoni',
  manager: process.env.KOST_MANAGER || `Pengelola ${process.env.KOST_NAME || 'Kost Harmoni'}`,
  address: process.env.KOST_ADDRESS || 'Jl. Melati No. 12, Yogyakarta',
  phone: process.env.KOST_PHONE || '081234567890',
  bank: process.env.KOST_BANK || 'BCA 1234567890 a.n. Pengelola Kost',

  // Identitas Kios (Terpisah)
  kiosName: process.env.KIOS_NAME || 'Kios Harmoni Niaga',
  kiosManager: process.env.KIOS_MANAGER || 'Pengelola Kios Harmoni',
  kiosAddress: process.env.KIOS_ADDRESS || 'Jl. Melati No. 12 (Area Depan), Yogyakarta',
  kiosPhone: process.env.KIOS_PHONE || '081298765432',
  kiosBank: process.env.KIOS_BANK || 'Mandiri 1370012345678 a.n. Pengelola Kios',

  // Pengaturan Umum
  baseUrl: (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, ''),
  fonnteToken: process.env.FONNTE_TOKEN || '',
  templateTagihan: DEFAULT_TEMPLATE_TAGIHAN,
  templateTerlambat: DEFAULT_TEMPLATE_TERLAMBAT,
  templateKwitansi: DEFAULT_TEMPLATE_KWITANSI,
};

export type AppSettings = typeof kost;

/** Mengambil profil properti sesuai tipe unit (KAMAR atau KIOS) */
export function resolveProfile(cfg: AppSettings, unitType?: string) {
  if (unitType === 'KIOS') {
    return {
      name: cfg.kiosName || cfg.name,
      manager: cfg.kiosManager || `Pengelola ${cfg.kiosName || cfg.name}`,
      address: cfg.kiosAddress || cfg.address,
      phone: cfg.kiosPhone || cfg.phone,
      bank: cfg.kiosBank || cfg.bank,
    };
  }
  return {
    name: cfg.name,
    manager: cfg.manager || `Pengelola ${cfg.name}`,
    address: cfg.address,
    phone: cfg.phone,
    bank: cfg.bank,
  };
}

export async function getSettings(): Promise<AppSettings> {
  try {
    const rows = await prisma.setting.findMany();
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value;
    const kostName = map.name || kost.name;
    const kiosName = map.kiosName || kost.kiosName;
    return {
      name: kostName,
      manager: map.manager || `Pengelola ${kostName}`,
      address: map.address || kost.address,
      phone: map.phone || kost.phone,
      bank: map.bank || kost.bank,

      kiosName,
      kiosManager: map.kiosManager || `Pengelola ${kiosName}`,
      kiosAddress: map.kiosAddress || map.address || kost.kiosAddress,
      kiosPhone: map.kiosPhone || map.phone || kost.kiosPhone,
      kiosBank: map.kiosBank || kost.kiosBank,

      baseUrl: (map.baseUrl || kost.baseUrl).replace(/\/$/, ''),
      fonnteToken: map.fonnteToken !== undefined ? map.fonnteToken : kost.fonnteToken,
      templateTagihan: map.templateTagihan || DEFAULT_TEMPLATE_TAGIHAN,
      templateTerlambat: map.templateTerlambat || DEFAULT_TEMPLATE_TERLAMBAT,
      templateKwitansi: map.templateKwitansi || DEFAULT_TEMPLATE_KWITANSI,
    };
  } catch {
    return kost;
  }
}
