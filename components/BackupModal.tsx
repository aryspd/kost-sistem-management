// components/BackupModal.tsx — Modal Export (Backup & Excel CSV) dan Import (Restore)
import { useRef, useState } from 'react';
import {
  Download, Upload, FileSpreadsheet, DatabaseBackup, CheckCircle2, AlertTriangle, RefreshCw, Trash2, ShieldAlert, Lock,
} from 'lucide-react';
import { api, Modal, Spinner, useToast } from './ui';

export default function BackupModal({
  open,
  onClose,
  onRestored,
  year = new Date().getFullYear(),
}: {
  open: boolean;
  onClose: () => void;
  onRestored?: () => void;
  year?: number;
}) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<any>(null);
  const [fileName, setFileName] = useState('');
  const [restoring, setRestoring] = useState(false);

  // State untuk Reset Data dengan Kode Keamanan
  const [showReset, setShowReset] = useState(false);
  const [securityCode, setSecurityCode] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [keepRooms, setKeepRooms] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const d = json?.data || json;
      if (!Array.isArray(d?.rooms) || !Array.isArray(d?.tenants) || !Array.isArray(d?.invoices)) {
        throw new Error('File JSON ini bukan file backup Kost Manager yang valid.');
      }
      setParsed(json);
    } catch (err: any) {
      setParsed(null);
      toast('error', err.message || 'Gagal membaca file backup');
    }
  };

  const restore = async () => {
    if (!parsed) return;
    if (
      !confirm(
        'PERHATIAN: Mengimpor file backup akan menggantikan seluruh data saat ini dengan data dari file backup. Lanjutkan?',
      )
    )
      return;
    setRestoring(true);
    try {
      const r = await api('/api/backup', 'POST', parsed);
      toast(
        'success',
        `Backup berhasil dipulihkan (${r.restored.rooms} unit, ${r.restored.tenants} penyewa, ${r.restored.invoices} tagihan)!`,
      );
      setParsed(null);
      setFileName('');
      onClose();
      onRestored?.();
    } catch (err: any) {
      toast('error', err.message);
    } finally {
      setRestoring(false);
    }
  };

  const d = parsed?.data || parsed;

  const handleResetData = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetting(true);
    try {
      await api('/api/reset', 'POST', {
        securityCode,
        password: adminPassword,
        keepRooms,
      });
      toast('success', 'Data berhasil dikosongkan! Template pesan & pengaturan tetap aman.');
      setSecurityCode('');
      setAdminPassword('');
      setShowReset(false);
      onClose();
      onRestored?.();
    } catch (err: any) {
      toast('error', err.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Export & Import Backup Data"
      subtitle="Simpan salinan laporan & seluruh data ke komputer Anda, atau pulihkan dari file backup"
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* KOLOM KIRI: EXPORT */}
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-brand-600 p-2.5 text-white">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">1. Export / Unduh ke Komputer</h4>
              <p className="text-xs text-slate-500">Pilih jenis file yang ingin disimpan</p>
            </div>
          </div>

          <div className="space-y-2.5">
            <a
              href="/api/backup?download=1"
              className="flex items-center gap-3 rounded-xl border border-brand-200 bg-white p-3.5 transition hover:border-brand-400 hover:shadow-sm"
            >
              <div className="rounded-lg bg-brand-50 p-2.5 text-brand-600">
                <DatabaseBackup className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900">Backup Penuh Sistem (.JSON)</p>
                <p className="text-xs text-slate-500">
                  Berisi semua Kamar, Kios, Penyewa, Tagihan, Kwitansi, Pengeluaran & Pengaturan. Bisa di-Import kembali.
                </p>
              </div>
            </a>

            <a
              href={`/api/export-csv?type=keuangan&year=${year}`}
              className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-white p-3.5 transition hover:border-emerald-400 hover:shadow-sm"
            >
              <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900">Laporan Buku Kas & Keuangan {year} (.CSV Excel)</p>
                <p className="text-xs text-slate-500">
                  Tabel pemasukan, pengeluaran & saldo berjalan siap buka di Microsoft Excel.
                </p>
              </div>
            </a>

            <a
              href="/api/export-csv?type=tagihan"
              className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-white p-3.5 transition hover:border-emerald-400 hover:shadow-sm"
            >
              <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900">Rekap Seluruh Tagihan & Kwitansi (.CSV Excel)</p>
                <p className="text-xs text-slate-500">
                  Daftar semua tagihan lunas & belum lunas beserta nomor kwitansinya.
                </p>
              </div>
            </a>
          </div>
        </div>

        {/* KOLOM KANAN: IMPORT / RESTORE */}
        <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
          <div>
            <div className="mb-4 flex items-center gap-2.5">
              <div className="rounded-xl bg-amber-500 p-2.5 text-white">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">2. Import / Pulihkan Backup (.JSON)</h4>
                <p className="text-xs text-slate-500">Pilih file backup `.json` dari komputer Anda</p>
              </div>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFile}
            />

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white px-4 py-6 text-center transition hover:border-brand-400 hover:bg-brand-50/40"
            >
              <Upload className="h-7 w-7 text-brand-600" />
              <span className="text-sm font-bold text-slate-800">
                {fileName ? fileName : 'Klik untuk memilih file backup (.json)'}
              </span>
              <span className="text-xs text-slate-400">File hasil unduhan "Backup Penuh Sistem (.JSON)"</span>
            </button>

            {d && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-900">
                <p className="mb-1.5 flex items-center gap-1.5 font-bold text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> File Backup Siap Dipulihkan:
                </p>
                <div className="grid grid-cols-2 gap-1 text-emerald-700">
                  <span>• Kamar & Kios: <b>{d.rooms?.length || 0}</b></span>
                  <span>• Penyewa: <b>{d.tenants?.length || 0}</b></span>
                  <span>• Tagihan/Kwitansi: <b>{d.invoices?.length || 0}</b></span>
                  <span>• Pengeluaran: <b>{d.expenses?.length || 0}</b></span>
                </div>
                {parsed?.exportedAt && (
                  <p className="mt-1.5 text-[11px] text-emerald-600">
                    Dibuat pada: {new Date(parsed.exportedAt).toLocaleString('id-ID')}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span>
                Proses Import akan mengganti data di aplikasi saat ini dengan isi dari file backup yang Anda pilih.
              </span>
            </div>

            <button
              type="button"
              disabled={!parsed || restoring}
              onClick={restore}
              className="btn-primary w-full"
            >
              {restoring ? <Spinner className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />} Pulihkan Data Sekarang
            </button>
          </div>
        </div>
      </div>

      {/* BAGIAN BAWAH: ZONA BERBAHAYA - RESET DATA DENGAN KODE KEAMANAN */}
      <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-rose-600 p-2.5 text-white">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-rose-900">3. Reset / Kosongkan Data Terisi (Mulai dari Nol)</h4>
              <p className="text-xs text-rose-700">
                Menghapus data Penyewa, Tagihan/Kwitansi, Pengeluaran, dan Riwayat WA.{' '}
                <b>Template pesan WhatsApp & Pengaturan Rekening TIDAK akan dihapus</b> (tetap tersimpan sebagai contoh).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowReset((v) => !v)}
            className="btn bg-rose-600 text-white hover:bg-rose-700"
          >
            <Trash2 className="h-4 w-4" /> {showReset ? 'Tutup Form Reset' : 'Reset Data…'}
          </button>
        </div>

        {showReset && (
          <form onSubmit={handleResetData} className="mt-4 space-y-4 border-t border-rose-200 pt-4">
            <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-rose-200 bg-white p-3 text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 accent-brand-600"
                checked={keepRooms}
                onChange={(e) => setKeepRooms(e.target.checked)}
              />
              <span>
                Pertahankan daftar unit <b>Kamar & Kios</b> (hanya hapus Penyewa, Tagihan, Kwitansi & Laporan Keuangan)
              </span>
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-rose-800">
                  Ketik Kode Keamanan: <code className="rounded bg-rose-100 px-1.5 py-0.5 text-rose-900">RESET-DATA</code>
                </label>
                <input
                  className="input border-rose-300 font-mono uppercase focus:border-rose-500 focus:ring-rose-100"
                  placeholder="Ketik RESET-DATA"
                  value={securityCode}
                  onChange={(e) => setSecurityCode(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-rose-800">
                  Masukkan Password Admin
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-rose-400" />
                  <input
                    type="password"
                    className="input border-rose-300 pl-10 focus:border-rose-500 focus:ring-rose-100"
                    placeholder="Password login admin"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowReset(false)}
                className="btn-ghost btn-sm"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={resetting || securityCode.trim().toUpperCase() !== 'RESET-DATA' || !adminPassword}
                className="btn bg-rose-600 text-white hover:bg-rose-700"
              >
                {resetting ? <Spinner className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />} Konfirmasi Hapus Data
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
