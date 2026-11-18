import { useState } from 'react';
import Link from 'next/link';
import { Plus, Store, Pencil, Trash2, User, Sparkles, Maximize2, UserPlus } from 'lucide-react';
import Layout from '@/components/Layout';
import TenantForm from '@/components/TenantForm';
import { api, Empty, Field, LoadingBlock, Modal, useData, useToast } from '@/components/ui';
import { rupiah } from '@/lib/format';

export default function Kios() {
  const { data, loading, reload } = useData<any[]>('/api/rooms?type=KIOS');
  const toast = useToast();
  const [form, setForm] = useState<any>(null);
  const [rentKiosId, setRentKiosId] = useState<number | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (form.id) await api(`/api/rooms/${form.id}`, 'PUT', { ...form, type: 'KIOS' });
      else await api('/api/rooms', 'POST', { ...form, type: 'KIOS' });
      toast('success', 'Data kios disimpan');
      setForm(null);
      reload();
    } catch (err: any) {
      toast('error', err.message);
    }
  };

  const remove = async (r: any) => {
    if (!confirm(`Hapus ${r.name}?`)) return;
    try {
      await api(`/api/rooms/${r.id}`, 'DELETE');
      toast('success', 'Kios dihapus');
      reload();
    } catch (err: any) {
      toast('error', err.message);
    }
  };

  const kiosList = data || [];
  const filled = kiosList.filter((r) => r.tenants.length).length;

  return (
    <Layout
      title="Kios"
      subtitle={`${kiosList.length} kios • ${filled} disewa • ${kiosList.length - filled} kosong`}
      actions={
        <button className="btn-primary" onClick={() => setForm({ name: '', price: '', size: '3x4 m', facility: '' })}>
          <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Tambah Kios</span>
        </button>
      }
    >
      {loading && !data ? (
        <div className="card">
          <LoadingBlock />
        </div>
      ) : kiosList.length === 0 ? (
        <div className="card">
          <Empty
            icon={Store}
            title="Belum ada unit kios"
            text="Tambahkan unit kios usaha beserta ukuran, fasilitas, dan harga sewa per bulannya."
            action={
              <button className="btn-primary" onClick={() => setForm({ name: '', price: '', size: '3x4 m', facility: '' })}>
                <Plus className="h-4 w-4" /> Tambah Kios
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {kiosList.map((r) => {
            const t = r.tenants[0];
            return (
              <div key={r.id} className="card group overflow-hidden">
                <div
                  className={`relative h-24 bg-gradient-to-br p-4 ${
                    t ? 'from-emerald-500 to-teal-600' : 'from-slate-200 to-slate-300'
                  }`}
                >
                  <Store className={`absolute bottom-2 right-3 h-16 w-16 ${t ? 'text-white/20' : 'text-white/60'}`} />
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        t ? 'bg-white/20 text-white' : 'bg-white text-slate-600'
                      }`}
                    >
                      {t ? 'TERISI' : 'KOSONG'}
                    </span>
                    {r.size && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          t ? 'bg-black/15 text-emerald-50' : 'bg-white/80 text-slate-600'
                        }`}
                      >
                        <Maximize2 className="h-3 w-3" /> {r.size}
                      </span>
                    )}
                  </div>
                  <p className={`mt-2 text-2xl font-extrabold ${t ? 'text-white' : 'text-slate-700'}`}>{r.name}</p>
                </div>
                <div className="p-4">
                  <p className="text-xl font-extrabold text-slate-900">
                    {rupiah(r.price)}
                    <span className="text-sm font-medium text-slate-400"> /bulan</span>
                  </p>
                  {r.facility && (
                    <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-500">
                      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" /> {r.facility}
                    </p>
                  )}
                  <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
                    {t ? (
                      <div>
                        <Link
                          href={`/penghuni/${t.id}`}
                          className="flex items-center gap-2 font-semibold text-emerald-700 hover:underline"
                        >
                          <User className="h-4 w-4" /> {t.name}
                        </Link>
                        {t.note && <p className="mt-0.5 truncate pl-6 text-xs text-slate-500">{t.note}</p>}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Belum ada penyewa</span>
                        <button
                          onClick={() => setRentKiosId(r.id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
                        >
                          <UserPlus className="h-3.5 w-3.5" /> Isi Penyewa
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button className="btn-ghost btn-sm flex-1" onClick={() => setForm(r)}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button className="btn-danger btn-sm" onClick={() => remove(r)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? 'Edit Kios' : 'Tambah Kios Baru'}>
        {form && (
          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <Field label="Nama / Nomor Kios">
                  <input
                    className="input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    placeholder="cth. Kios K1"
                  />
                </Field>
              </div>
              <Field label="Ukuran Luas">
                <input
                  className="input"
                  value={form.size || ''}
                  onChange={(e) => setForm({ ...form, size: e.target.value })}
                  placeholder="cth. 3x4 m"
                />
              </Field>
            </div>
            <Field label="Harga Sewa per Bulan (Rp)">
              <input
                type="number"
                className="input"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
                placeholder="1500000"
              />
            </Field>
            <Field label="Fasilitas Kios">
              <input
                className="input"
                value={form.facility}
                onChange={(e) => setForm({ ...form, facility: e.target.value })}
                placeholder="Rolling door, listrik token 1300W, etalase kaca, kamar mandi"
              />
            </Field>
            <div className="flex gap-3 pt-2">
              <button type="button" className="btn-ghost flex-1" onClick={() => setForm(null)}>
                Batal
              </button>
              <button className="btn-primary flex-1">Simpan</button>
            </div>
          </form>
        )}
      </Modal>

      <TenantForm
        open={!!rentKiosId}
        onClose={() => setRentKiosId(null)}
        onSaved={reload}
        defaultRoomId={rentKiosId || undefined}
      />
    </Layout>
  );
}
