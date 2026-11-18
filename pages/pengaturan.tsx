import { useEffect, useState } from 'react';
import {
  BedDouble, Store, MessageCircle, RotateCcw, Save, Sparkles, Eye, Zap, CheckCircle2, Globe, DatabaseBackup,
} from 'lucide-react';
import Layout from '@/components/Layout';
import BackupModal from '@/components/BackupModal';
import { api, Field, LoadingBlock, Spinner, useData, useToast } from '@/components/ui';

const PLACEHOLDERS = [
  { tag: '{nama}', desc: 'Nama penyewa' },
  { tag: '{unit}', desc: 'Nama kamar / kios' },
  { tag: '{jenis_unit}', desc: 'kost / kios' },
  { tag: '{periode}', desc: 'Periode sewa' },
  { tag: '{jatuh_tempo}', desc: 'Tanggal jatuh tempo' },
  { tag: '{jumlah}', desc: 'Nominal Rp' },
  { tag: '{rekening}', desc: 'No. Rekening sesuai Kost/Kios' },
  { tag: '{nama_properti}', desc: 'Nama Kost / Kios' },
  { tag: '{nama_pengelola}', desc: 'Nama Pengelola Kost / Kios' },
  { tag: '{no_kwitansi}', desc: 'Nomor kwitansi' },
  { tag: '{metode}', desc: 'TUNAI / TRANSFER / QRIS' },
  { tag: '{tanggal_bayar}', desc: 'Tanggal pembayaran' },
  { tag: '{link_kwitansi}', desc: 'Link web kwitansi resmi' },
];

export default function Pengaturan() {
  const { data, loading, reload } = useData<any>('/api/settings');
  const toast = useToast();
  const [form, setForm] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'tagihan' | 'terlambat' | 'kwitansi'>('tagihan');
  const [previewUnit, setPreviewUnit] = useState<'KAMAR' | 'KIOS'>('KAMAR');
  const [saving, setSaving] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  if (loading || !form)
    return (
      <Layout title="Pengaturan & Template WA">
        <LoadingBlock />
      </Layout>
    );

  const set = (k: string) => (e: any) => setForm((p: any) => ({ ...p, [k]: e.target.value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api('/api/settings', 'PUT', form);
      toast('success', 'Pengaturan Kost, Kios & template pesan berhasil disimpan!');
      reload();
    } catch (err: any) {
      toast('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const resetTemplate = () => {
    if (!data?.defaults) return;
    const key =
      activeTab === 'tagihan'
        ? 'templateTagihan'
        : activeTab === 'terlambat'
          ? 'templateTerlambat'
          : 'templateKwitansi';
    setForm((p: any) => ({ ...p, [key]: data.defaults[key] }));
    toast('info', 'Template dikembalikan ke bawaan (klik Simpan untuk menerapkan)');
  };

  const insertTag = (tag: string) => {
    const key =
      activeTab === 'tagihan'
        ? 'templateTagihan'
        : activeTab === 'terlambat'
          ? 'templateTerlambat'
          : 'templateKwitansi';
    setForm((p: any) => ({ ...p, [key]: (p[key] || '') + ' ' + tag }));
  };

  const currentKey =
    activeTab === 'tagihan'
      ? 'templateTagihan'
      : activeTab === 'terlambat'
        ? 'templateTerlambat'
        : 'templateKwitansi';

  // Simulasi pratinjau pesan WA sesuai pilihan unit (Kamar Kost vs Kios)
  const isKios = previewUnit === 'KIOS';
  const propName = isKios ? form.kiosName : form.name;
  const propManager = isKios ? form.kiosManager : form.manager;
  const propBank = isKios ? form.kiosBank : form.bank;
  const propAddress = isKios ? form.kiosAddress : form.address;
  const propPhone = isKios ? form.kiosPhone : form.phone;

  const previewText = (form[currentKey] || '')
    .split('{nama}').join(isKios ? 'Laundry Berkah (Pak Hendra)' : 'Budi Santoso')
    .split('{unit}').join(isKios ? 'Kios K1' : 'Kamar A1')
    .split('{kamar}').join(isKios ? 'Kios K1' : 'Kamar A1')
    .split('{jenis_unit}').join(isKios ? 'kios' : 'kost')
    .split('{label_unit}').join(isKios ? 'Kios      ' : 'Kamar     ')
    .split('{ikon_unit}').join(isKios ? '🏪' : '🏠')
    .split('{periode}').join('5 November 2026 s/d 4 Desember 2026')
    .split('{jatuh_tempo}').join('5 November 2026')
    .split('{jumlah}').join(isKios ? 'Rp 1.800.000' : 'Rp 1.200.000')
    .split('{rekening}').join(propBank || '-')
    .split('{nama_properti}').join(propName || '-')
    .split('{nama_kost}').join(propName || '-')
    .split('{nama_pengelola}').join(propManager || '-')
    .split('{alamat_kost}').join(propAddress || '-')
    .split('{telp_kost}').join(propPhone || '-')
    .split('{no_kwitansi}').join('KW/202611/00012')
    .split('{metode}').join('TRANSFER')
    .split('{tanggal_bayar}').join('5 November 2026')
    .split('{link_kwitansi}').join(`${form.baseUrl || 'http://localhost:3000'}/kwitansi/contoh-token`);

  return (
    <Layout
      title="Pengaturan & Template Pesan"
      subtitle="Identitas & nomor rekening Kost dan Kios dipisahkan secara otomatis sesuai unit penyewa"
      actions={
        <>
          <button type="button" onClick={() => setBackupOpen(true)} className="btn-ghost">
            <DatabaseBackup className="h-4 w-4 text-brand-600" /> <span className="hidden sm:inline">Backup & Restore</span>
          </button>
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />} Simpan Perubahan
          </button>
        </>
      }
    >
      <form onSubmit={save} className="space-y-6">
        {/* Bagian 1: Identitas & Rekening Terpisah (Kost vs Kios) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* KARTU KOST */}
          <div className="card border-t-4 border-t-brand-600 p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="rounded-xl bg-brand-50 p-2.5 text-brand-600">
                <BedDouble className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">Pengelola & Rekening KOST (Kamar)</h2>
                <p className="text-xs text-slate-500">Digunakan otomatis untuk tagihan & kwitansi Kamar Kost</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Nama Kost">
                  <input className="input" value={form.name} onChange={set('name')} required placeholder="Kost Harmoni" />
                </Field>
                <Field label="Nama Pengelola Kost (Tanda Tangan)">
                  <input
                    className="input"
                    value={form.manager}
                    onChange={set('manager')}
                    required
                    placeholder="Bpk. Ahmad (Pengelola Kost)"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Alamat Kost">
                  <input
                    className="input"
                    value={form.address}
                    onChange={set('address')}
                    placeholder="Jl. Melati No. 12, Yogyakarta"
                  />
                </Field>
                <Field label="No. Telepon / WA Pengelola Kost">
                  <input className="input" value={form.phone} onChange={set('phone')} placeholder="081234567890" />
                </Field>
              </div>
              <Field
                label="Nomor Rekening Pembayaran Kost"
                hint="Otomatis masuk ke {rekening} untuk penyewa Kamar Kost"
              >
                <textarea
                  rows={2}
                  className="input font-medium"
                  value={form.bank}
                  onChange={set('bank')}
                  placeholder="BCA 1234567890 a.n. Pengelola Kost"
                />
              </Field>
            </div>
          </div>

          {/* KARTU KIOS */}
          <div className="card border-t-4 border-t-emerald-600 p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">Pengelola & Rekening KIOS (Usaha)</h2>
                <p className="text-xs text-slate-500">Digunakan otomatis untuk tagihan & kwitansi Unit Kios</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Nama Area Kios">
                  <input
                    className="input"
                    value={form.kiosName}
                    onChange={set('kiosName')}
                    required
                    placeholder="Kios Harmoni Niaga"
                  />
                </Field>
                <Field label="Nama Pengelola Kios (Tanda Tangan)">
                  <input
                    className="input"
                    value={form.kiosManager}
                    onChange={set('kiosManager')}
                    required
                    placeholder="Ibu Ratna (Pengelola Kios)"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Alamat Kios">
                  <input
                    className="input"
                    value={form.kiosAddress}
                    onChange={set('kiosAddress')}
                    placeholder="Jl. Melati No. 12 (Area Depan)"
                  />
                </Field>
                <Field label="No. Telepon / WA Pengelola Kios">
                  <input className="input" value={form.kiosPhone} onChange={set('kiosPhone')} placeholder="081298765432" />
                </Field>
              </div>
              <Field
                label="Nomor Rekening Pembayaran Kios"
                hint="Otomatis masuk ke {rekening} untuk penyewa Unit Kios"
              >
                <textarea
                  rows={2}
                  className="input font-medium"
                  value={form.kiosBank}
                  onChange={set('kiosBank')}
                  placeholder="Mandiri 1370012345678 a.n. Pengelola Kios"
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Bagian 2: Pengaturan Umum & Gateway WA */}
        <div className="card p-6">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Pengaturan Link Kwitansi & WhatsApp Gateway</h2>
              <p className="text-xs text-slate-500">
                Kwitansi dibuat secara dinamis tanpa memakan ruang penyimpanan harddisk (0 KB file sampah)
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="URL Aplikasi (untuk Link Kwitansi)"
              hint="Gunakan http://localhost:3000 saat di lokal, atau alamat domain Anda jika sudah di-online-kan."
            >
              <input className="input" value={form.baseUrl} onChange={set('baseUrl')} placeholder="http://localhost:3000" />
            </Field>
            <Field
              label="Token Fonnte WhatsApp API (Opsional)"
              hint="Kosongkan untuk memakai mode gratis 1-klik wa.me. Isi token dari fonnte.com jika ingin kirim otomatis."
            >
              <div className="relative">
                <Zap className="absolute left-3.5 top-3 h-4 w-4 text-amber-500" />
                <input
                  className="input pl-10"
                  value={form.fonnteToken}
                  onChange={set('fonnteToken')}
                  placeholder="Kosongkan jika menggunakan WhatsApp Web manual"
                />
              </div>
            </Field>
          </div>
        </div>

        {/* Bagian 3: Editor Template Pesan WhatsApp + Live Preview */}
        <div className="card p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl bg-green-50 p-2.5 text-green-600">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">Template Pesan WhatsApp</h2>
                <p className="text-xs text-slate-500">
                  Satu template otomatis menyesuaikan data Kost maupun Kios berdasarkan variabel yang digunakan.
                </p>
              </div>
            </div>

            <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
              {[
                ['tagihan', '🔔 Pengingat Tagihan'],
                ['terlambat', '⚠️ Tagihan Terlambat'],
                ['kwitansi', '✅ Kwitansi Lunas'],
              ].map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setActiveTab(k as any)}
                  className={`rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                    activeTab === k ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Daftar Variabel / Placeholder */}
          <div className="mb-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Klik variabel untuk menyisipkan ke template:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PLACEHOLDERS.map((p) => (
                <button
                  key={p.tag}
                  type="button"
                  onClick={() => insertTag(p.tag)}
                  title={p.desc}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                >
                  <code className="font-bold text-brand-600">{p.tag}</code>
                  <span className="text-slate-400">({p.desc})</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="label !mb-0">Isi Template</span>
                <button
                  type="button"
                  onClick={resetTemplate}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-brand-600"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reset ke Bawaan
                </button>
              </div>
              <textarea
                rows={14}
                className="input font-mono text-xs leading-relaxed"
                value={form[currentKey]}
                onChange={set(currentKey)}
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="label !mb-0">Pratinjau Tampilan di WhatsApp</span>
                </div>
                <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setPreviewUnit('KAMAR')}
                    className={`rounded-md px-2.5 py-1 font-semibold transition ${
                      previewUnit === 'KAMAR' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    🏠 Contoh Kost
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewUnit('KIOS')}
                    className={`rounded-md px-2.5 py-1 font-semibold transition ${
                      previewUnit === 'KIOS' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    🏪 Contoh Kios
                  </button>
                </div>
              </div>
              <div className="rounded-2xl border border-green-200 bg-[#e7fbe9] p-5 shadow-inner">
                <div className="mb-2 flex items-center gap-2 border-b border-green-200/80 pb-2 text-xs font-semibold text-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600" /> Contoh hasil pesan untuk penyewa{' '}
                  {previewUnit === 'KIOS' ? 'Kios' : 'Kamar Kost'}:
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{previewText}</div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
            <button type="submit" disabled={saving} className="btn-primary px-6">
              {saving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />} Simpan Semua Pengaturan
            </button>
          </div>
        </div>
      </form>
      <BackupModal open={backupOpen} onClose={() => setBackupOpen(false)} onRestored={reload} />
    </Layout>
  );
}
