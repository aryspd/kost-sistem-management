// lib/receiptPdf.ts — membuat PDF kwitansi (pure JS, tanpa Chrome/Puppeteer)
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { getSettings, resolveProfile } from './config';
import { fmtDate, rupiah } from './format';

const terbilangSatuan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];

export function terbilang(n: number): string {
  n = Math.floor(n);
  if (n < 12) return terbilangSatuan[n];
  if (n < 20) return terbilang(n - 10) + ' belas';
  if (n < 100) return terbilang(Math.floor(n / 10)) + ' puluh ' + terbilang(n % 10);
  if (n < 200) return 'seratus ' + terbilang(n - 100);
  if (n < 1000) return terbilang(Math.floor(n / 100)) + ' ratus ' + terbilang(n % 100);
  if (n < 2000) return 'seribu ' + terbilang(n - 1000);
  if (n < 1e6) return terbilang(Math.floor(n / 1000)) + ' ribu ' + terbilang(n % 1000);
  if (n < 1e9) return terbilang(Math.floor(n / 1e6)) + ' juta ' + terbilang(n % 1e6);
  return terbilang(Math.floor(n / 1e9)) + ' miliar ' + terbilang(n % 1e9);
}

export const terbilangRupiah = (n: number) =>
  (terbilang(n).replace(/\s+/g, ' ').trim() + ' rupiah').replace(/^./, (c) => c.toUpperCase());

export async function buildReceiptPdf(inv: {
  amount: number;
  periodStart: Date;
  periodEnd: Date;
  paidAt: Date | null;
  method: string | null;
  receiptNo: string | null;
  tenant: { name: string; phone: string; room: { name: string; type?: string } };
}) {
  const cfg = await getSettings();
  const kost = resolveProfile(cfg, inv.tenant.room.type);
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 420]); // A5 landscape
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();

  const brand = rgb(0.145, 0.27, 0.92);
  const gray = rgb(0.4, 0.43, 0.5);
  const dark = rgb(0.1, 0.12, 0.18);

  // header band
  page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: brand });
  page.drawText(kost.name, { x: 32, y: height - 40, size: 20, font: bold, color: rgb(1, 1, 1) });
  page.drawText(`${kost.address}  |  Telp ${kost.phone}`, { x: 32, y: height - 60, size: 9, font, color: rgb(0.85, 0.9, 1) });
  page.drawText('KWITANSI', { x: width - 150, y: height - 40, size: 20, font: bold, color: rgb(1, 1, 1) });
  page.drawText(inv.receiptNo || '-', { x: width - 150, y: height - 60, size: 10, font, color: rgb(0.85, 0.9, 1) });

  const unitLabel = inv.tenant.room.type === 'KIOS' ? 'Sewa kios' : 'Sewa kamar';
  const rows: [string, string][] = [
    ['Telah terima dari', inv.tenant.name],
    ['No. WhatsApp', inv.tenant.phone],
    ['Untuk pembayaran', `${unitLabel} ${inv.tenant.room.name}`],
    ['Periode', `${fmtDate(inv.periodStart)} s/d ${fmtDate(inv.periodEnd)}`],
    ['Metode pembayaran', inv.method || '-'],
    ['Tanggal bayar', fmtDate(inv.paidAt)],
  ];
  let y = height - 115;
  for (const [k, v] of rows) {
    page.drawText(k, { x: 32, y, size: 10, font, color: gray });
    page.drawText(':', { x: 150, y, size: 10, font, color: gray });
    page.drawText(v, { x: 160, y, size: 11, font: bold, color: dark });
    y -= 22;
  }

  // terbilang
  page.drawRectangle({ x: 32, y: y - 14, width: width - 64, height: 28, color: rgb(0.94, 0.96, 1) });
  page.drawText(`Terbilang: ${terbilangRupiah(inv.amount)}`, { x: 42, y: y - 4, size: 9.5, font, color: dark });

  // amount box
  page.drawRectangle({ x: 32, y: 40, width: 220, height: 50, borderColor: brand, borderWidth: 2, color: rgb(1, 1, 1) });
  page.drawText('JUMLAH', { x: 44, y: 72, size: 8, font: bold, color: gray });
  page.drawText(rupiah(inv.amount), { x: 44, y: 50, size: 18, font: bold, color: brand });

  // LUNAS stamp
  page.drawRectangle({ x: 290, y: 46, width: 90, height: 34, borderColor: rgb(0.06, 0.6, 0.35), borderWidth: 2 });
  page.drawText('LUNAS', { x: 307, y: 57, size: 16, font: bold, color: rgb(0.06, 0.6, 0.35) });

  // signature
  page.drawText(`Hormat kami,`, { x: width - 170, y: 100, size: 9, font, color: gray });
  page.drawText(kost.manager, { x: width - 170, y: 44, size: 9, font: bold, color: dark });
  page.drawLine({ start: { x: width - 170, y: 56 }, end: { x: width - 32, y: 56 }, thickness: 0.6, color: gray });

  page.drawText('Kwitansi ini dibuat otomatis oleh sistem dan sah tanpa tanda tangan basah.', {
    x: 32, y: 18, size: 7.5, font, color: gray,
  });

  return pdf.save();
}
