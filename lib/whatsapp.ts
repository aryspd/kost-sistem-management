// lib/whatsapp.ts — pengiriman notifikasi WhatsApp dengan template dinamis dari Pengaturan
import prisma from './prisma';
import { getSettings, AppSettings, resolveProfile } from './config';
import { fmtDate, normalizePhone, rupiah } from './format';

type InvoiceFull = {
  id: number;
  amount: number;
  dueDate: Date;
  periodStart: Date;
  periodEnd: Date;
  paidAt: Date | null;
  method: string | null;
  receiptNo: string | null;
  receiptToken: string;
  tenant: { name: string; phone: string; room: { name: string; type?: string } };
};

export const receiptUrl = (inv: { receiptToken: string }, baseUrl = 'http://localhost:3000') =>
  `${baseUrl.replace(/\/$/, '')}/kwitansi/${inv.receiptToken}`;
export const receiptPdfUrl = (inv: { receiptToken: string }, baseUrl = 'http://localhost:3000') =>
  `${baseUrl.replace(/\/$/, '')}/api/kwitansi/${inv.receiptToken}/pdf`;

export function renderTemplate(tpl: string, inv: InvoiceFull, cfg: AppSettings) {
  const isKios = inv.tenant.room.type === 'KIOS';
  const profile = resolveProfile(cfg, inv.tenant.room.type);
  const vars: Record<string, string> = {
    '{nama}': inv.tenant.name,
    '{unit}': inv.tenant.room.name,
    '{kamar}': inv.tenant.room.name,
    '{jenis_unit}': isKios ? 'kios' : 'kost',
    '{label_unit}': isKios ? 'Kios      ' : 'Kamar     ',
    '{ikon_unit}': isKios ? '🏪' : '🏠',
    '{periode}': `${fmtDate(inv.periodStart)} s/d ${fmtDate(inv.periodEnd)}`,
    '{jatuh_tempo}': fmtDate(inv.dueDate),
    '{jumlah}': rupiah(inv.amount),
    '{rekening}': profile.bank,
    '{nama_properti}': profile.name,
    '{nama_kost}': profile.name,
    '{nama_pengelola}': profile.manager,
    '{alamat_kost}': profile.address,
    '{telp_kost}': profile.phone,
    '{no_kwitansi}': inv.receiptNo || '-',
    '{metode}': inv.method || '-',
    '{tanggal_bayar}': fmtDate(inv.paidAt),
    '{link_kwitansi}': receiptUrl(inv, cfg.baseUrl),
  };
  let out = tpl;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(k).join(v);
  }
  return out;
}

export async function buildMsgTagihan(inv: InvoiceFull, late = false) {
  const cfg = await getSettings();
  const tpl = late ? cfg.templateTerlambat : cfg.templateTagihan;
  return renderTemplate(tpl, inv, cfg);
}

export async function buildMsgKwitansi(inv: InvoiceFull) {
  const cfg = await getSettings();
  return renderTemplate(cfg.templateKwitansi, inv, cfg);
}

export type SendResult = { mode: 'auto' | 'link'; ok: boolean; link: string; error?: string };

export async function sendWhatsApp(
  phone: string,
  message: string,
  type: 'TAGIHAN' | 'PENGINGAT' | 'KWITANSI',
  fileUrl?: string,
): Promise<SendResult> {
  const cfg = await getSettings();
  const target = normalizePhone(phone);
  const link = `https://wa.me/${target}?text=${encodeURIComponent(message)}`;
  const token = cfg.fonnteToken;

  if (!token) {
    await prisma.waLog.create({ data: { phone: target, message, type, status: 'LINK' } });
    return { mode: 'link', ok: true, link };
  }

  try {
    const body = new URLSearchParams({ target, message, countryCode: '62' });
    if (fileUrl) {
      body.set('url', fileUrl);
      body.set('filename', 'kwitansi.pdf');
    }
    const res = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { Authorization: token },
      body,
    });
    const json: any = await res.json().catch(() => ({}));
    const ok = json?.status === true;
    await prisma.waLog.create({ data: { phone: target, message, type, status: ok ? 'TERKIRIM' : 'GAGAL' } });
    return { mode: 'auto', ok, link, error: ok ? undefined : json?.reason || 'Gagal mengirim' };
  } catch (e: any) {
    await prisma.waLog.create({ data: { phone: target, message, type, status: 'GAGAL' } });
    return { mode: 'auto', ok: false, link, error: e.message };
  }
}
