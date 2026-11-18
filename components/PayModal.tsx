// components/PayModal.tsx — modal konfirmasi pembayaran (dipakai di beberapa halaman)
import { useEffect, useState } from 'react';
import { Banknote, Building, QrCode, MessageCircle } from 'lucide-react';
import { api, Field, Modal, Spinner, useToast, useWa } from './ui';
import { fmtDate, rupiah, toInputDate } from '@/lib/format';

const METHODS = [
  { v: 'TUNAI', label: 'Tunai', icon: Banknote },
  { v: 'TRANSFER', label: 'Transfer', icon: Building },
  { v: 'QRIS', label: 'QRIS', icon: QrCode },
];

export default function PayModal({ invoice, onClose, onDone }: { invoice: any; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const wa = useWa();
  const [method, setMethod] = useState('TRANSFER');
  const [paidAt, setPaidAt] = useState(toInputDate(new Date()));
  const [amount, setAmount] = useState<number>(0);
  const [notify, setNotify] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (invoice) {
      setAmount(invoice.amount);
      setPaidAt(toInputDate(new Date()));
    }
  }, [invoice]);

  if (!invoice) return null;

  const submit = async () => {
    setSaving(true);
    try {
      const r = await api(`/api/invoices/${invoice.id}/pay`, 'POST', { method, paidAt, amount, notify });
      toast('success', `Pembayaran ${invoice.tenant.name} dicatat. Kwitansi ${r.invoice.receiptNo} dibuat.`);
      onClose();
      onDone();
      if (r.wa) wa(r.wa);
    } catch (e: any) {
      toast('error', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={!!invoice} onClose={onClose} title="Catat Pembayaran" subtitle="Konfirmasi pembayaran sewa kost">
      <div className="mb-5 rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-600 p-5 text-white">
        <p className="text-sm text-brand-100">
          {invoice.tenant.name} • {invoice.tenant.room?.name}
        </p>
        <p className="mt-1 text-3xl font-extrabold">{rupiah(amount)}</p>
        <p className="mt-2 text-xs text-brand-100">
          Periode {fmtDate(invoice.periodStart)} – {fmtDate(invoice.periodEnd)} • Jatuh tempo {fmtDate(invoice.dueDate)}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <span className="label">Metode Pembayaran</span>
          <div className="grid grid-cols-3 gap-2">
            {METHODS.map(({ v, label, icon: I }) => (
              <button
                key={v}
                type="button"
                onClick={() => setMethod(v)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-sm font-semibold transition ${
                  method === v ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <I className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tanggal Bayar">
            <input type="date" className="input" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
          </Field>
          <Field label="Jumlah (Rp)">
            <input type="number" className="input" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </Field>
        </div>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-3.5">
          <input type="checkbox" className="h-4 w-4 accent-green-600" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
          <MessageCircle className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium text-green-800">Kirim kwitansi ke WhatsApp penghuni</span>
        </label>
      </div>

      <div className="mt-6 flex gap-3">
        <button className="btn-ghost flex-1" onClick={onClose}>
          Batal
        </button>
        <button className="btn-success flex-1" onClick={submit} disabled={saving}>
          {saving ? <Spinner className="h-4 w-4" /> : null} Konfirmasi Lunas
        </button>
      </div>
    </Modal>
  );
}
