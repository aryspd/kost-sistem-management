// components/TenantForm.tsx — form tambah / edit penghuni
import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { api, Field, Modal, Spinner, useData, useToast } from './ui';
import { fmtDate, rupiah, toInputDate } from '@/lib/format';

export default function TenantForm({
  open,
  onClose,
  onSaved,
  tenant,
  defaultRoomId,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  tenant?: any;
  defaultRoomId?: number;
}) {
  const toast = useToast();
  const { data: rooms } = useData<any[]>(open ? '/api/rooms' : null);
  const empty = {
    name: '',
    phone: '',
    idNumber: '',
    roomId: defaultRoomId ? String(defaultRoomId) : '',
    moveInDate: toInputDate(new Date()),
    note: '',
    status: 'AKTIF',
  };
  const [f, setF] = useState<any>(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open)
      setF(
        tenant
          ? { ...tenant, roomId: String(tenant.roomId), moveInDate: toInputDate(tenant.moveInDate) }
          : { ...empty, roomId: defaultRoomId ? String(defaultRoomId) : '' },
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tenant, defaultRoomId]);

  const set = (k: string) => (e: any) => setF((p: any) => ({ ...p, [k]: e.target.value }));
  const available = (rooms || []).filter((r) => r.tenants.length === 0 || (tenant && r.id === tenant.roomId));
  const kamarList = available.filter((r) => r.type !== 'KIOS');
  const kiosList = available.filter((r) => r.type === 'KIOS');
  const room = (rooms || []).find((r) => String(r.id) === String(f.roomId));
  const day = f.moveInDate ? Number(f.moveInDate.split('-')[2]) : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (tenant) await api(`/api/tenants/${tenant.id}`, 'PUT', f);
      else await api('/api/tenants', 'POST', f);
      toast('success', tenant ? 'Data penghuni diperbarui' : 'Penghuni baru ditambahkan & tagihan dibuat');
      onClose();
      onSaved();
    } catch (err: any) {
      toast('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={tenant ? 'Edit Penghuni' : 'Tambah Penghuni Baru'} subtitle="Lengkapi data penghuni kost">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nama Lengkap">
          <input className="input" value={f.name} onChange={set('name')} required placeholder="cth. Budi Santoso" />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="No. WhatsApp">
            <input className="input" value={f.phone} onChange={set('phone')} required placeholder="08xxxxxxxxxx" />
          </Field>
          <Field label="No. KTP (opsional)">
            <input className="input" value={f.idNumber} onChange={set('idNumber')} placeholder="16 digit NIK" />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Unit (Kamar / Kios)">
            <select className="input" value={f.roomId} onChange={set('roomId')} required>
              <option value="">— Pilih kamar / kios —</option>
              {kamarList.length > 0 && (
                <optgroup label="🏠 Kamar Kost">
                  {kamarList.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} • {rupiah(r.price)}/bln
                    </option>
                  ))}
                </optgroup>
              )}
              {kiosList.length > 0 && (
                <optgroup label="🏪 Unit Kios">
                  {kiosList.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.size ? `(${r.size})` : ''} • {rupiah(r.price)}/bln
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </Field>
          <Field label="Tanggal Masuk">
            <input type="date" className="input" value={f.moveInDate} onChange={set('moveInDate')} required />
          </Field>
        </div>
        {tenant && (
          <Field label="Status">
            <select className="input" value={f.status} onChange={set('status')}>
              <option value="AKTIF">Aktif</option>
              <option value="KELUAR">Sudah keluar</option>
            </select>
          </Field>
        )}
        <Field label="Catatan">
          <textarea className="input" rows={2} value={f.note} onChange={set('note')} placeholder="Asal kampus / kantor, kendaraan, dll." />
        </Field>

        {room && day && (
          <div className="flex gap-3 rounded-2xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-800">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
            <p>
              Penghuni akan ditagih <b>{rupiah(room.price)}</b> setiap <b>tanggal {day}</b>. Tagihan pertama jatuh tempo{' '}
              <b>{fmtDate(f.moveInDate)}</b> (bayar di muka).
              {day > 28 && ' Untuk bulan yang lebih pendek, jatuh tempo menjadi tanggal terakhir bulan tersebut.'}
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" className="btn-ghost flex-1" onClick={onClose}>
            Batal
          </button>
          <button className="btn-primary flex-1" disabled={saving}>
            {saving && <Spinner className="h-4 w-4" />} Simpan
          </button>
        </div>
      </form>
    </Modal>
  );
}
