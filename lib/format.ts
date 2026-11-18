// lib/format.ts — helper format angka, tanggal, nomor HP (aman dipakai di client & server)

export const rupiah = (n: number | null | undefined) =>
  'Rp ' + Math.round(Number(n || 0)).toLocaleString('id-ID');

export const fmtDate = (d: string | Date | null | undefined, withDay = false) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', {
    ...(withDay ? { weekday: 'long' } : {}),
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const fmtShort = (d: string | Date | null | undefined) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

export const toInputDate = (d: string | Date) => {
  const x = new Date(d);
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${x.getFullYear()}-${m}-${day}`;
};

/** 0812xxxx / +62812xxxx / 62812xxxx -> 62812xxxx */
export const normalizePhone = (p: string) => {
  let s = (p || '').replace(/[^0-9]/g, '');
  if (s.startsWith('0')) s = '62' + s.slice(1);
  if (s.startsWith('8')) s = '62' + s;
  return s;
};

export const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

export const EXPENSE_CATEGORIES: Record<string, { label: string; color: string }> = {
  LISTRIK: { label: 'Listrik', color: '#f59e0b' },
  AIR: { label: 'Air (PDAM)', color: '#06b6d4' },
  INTERNET: { label: 'Internet / WiFi', color: '#8b5cf6' },
  PERBAIKAN: { label: 'Perbaikan', color: '#ef4444' },
  KEBERSIHAN: { label: 'Kebersihan', color: '#10b981' },
  GAJI: { label: 'Gaji Penjaga', color: '#ec4899' },
  LAINNYA: { label: 'Lainnya', color: '#64748b' },
};

export const PAY_METHODS = ['TUNAI', 'TRANSFER', 'QRIS'] as const;
