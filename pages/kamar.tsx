import { useState } from 'react';
import Link from 'next/link';
import { Plus, BedDouble, Pencil, Trash2, User, Sparkles, UserPlus } from 'lucide-react';
import Layout from '@/components/Layout';
import TenantForm from '@/components/TenantForm';
import { api, Empty, Field, LoadingBlock, Modal, useData, useToast } from '@/components/ui';
import { rupiah } from '@/lib/format';

export default function Kamar() {
  const { data, loading, reload } = useData<any[]>('/api/rooms?type=KAMAR');
  const toast = useToast();
  const [form, setForm] = useState<any>(null);
  const [rentRoomId, setRentRoomId] = useState<number | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (form.id) await api(`/api/rooms/${form.id}`, 'PUT', { ...form, type: 'KAMAR' });
      else await api('/api/rooms', 'POST', { ...form, type: 'KAMAR' });
      toast('success', 'Data kamar disimpan');
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
      toast('success', 'Kamar dihapus');
      reload();
    } catch (err: any) {
      toast('error', err.message);
    }
  };

  const rooms = data || [];
  const filled = rooms.filter((r) => r.tenants.length).length;

  return (
    <Layout
      title="Kamar"
      subtitle={`${rooms.length} kamar • ${filled} terisi • ${rooms.length - filled} kosong`}
      actions={
        <button className="btn-primary" onClick={() => setForm({ name: '', price: '', facility: '' })}>
          <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Tambah Kamar</span>
        </button>
      }
    >
      {loading && !data ? (
        <div className="card">
          <LoadingBlock />
        </div>
      ) : rooms.length === 0 ? (
        <div className="card">
          <Empty icon={BedDouble} title="Belum ada kamar" text="Tambahkan kamar beserta harga sewa per bulan." />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rooms.map((r) => {
            const t = r.tenants[0];
            return (
              <div key={r.id} className="card group overflow-hidden">
                <div className={`relative h-24 bg-gradient-to-br p-4 ${t ? 'from-brand-500 to-indigo-600' : 'from-slate-200 to-slate-300'}`}>
                  <BedDouble className={`absolute bottom-2 right-3 h-16 w-16 ${t ? 'text-white/20' : 'text-white/60'}`} />
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${t ? 'bg-white/20 text-white' : 'bg-white text-slate-600'}`}>
                    {t ? 'TERISI' : 'KOSONG'}
                  </span>
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
                      <Link href={`/penghuni/${t.id}`} className="flex items-center gap-2 font-semibold text-brand-700 hover:underline">
                        <User className="h-4 w-4" /> {t.name}
                      </Link>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Belum ada penghuni</span>
                        <button
                          onClick={() => setRentRoomId(r.id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
                        >
                          <UserPlus className="h-3.5 w-3.5" /> Isi Penghuni
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

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? 'Edit Kamar' : 'Tambah Kamar'}>
        {form && (
          <form onSubmit={save} className="space-y-4">
            <Field label="Nama / Nomor Kamar">
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="cth. Kamar A1" />
            </Field>
            <Field label="Harga Sewa per Bulan (Rp)">
              <input type="number" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required placeholder="800000" />
            </Field>
            <Field label="Fasilitas">
              <input className="input" value={form.facility} onChange={(e) => setForm({ ...form, facility: e.target.value })} placeholder="AC, kamar mandi dalam, WiFi" />
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
        open={!!rentRoomId}
        onClose={() => setRentRoomId(null)}
        onSaved={reload}
        defaultRoomId={rentRoomId || undefined}
      />
    </Layout>
  );
}
