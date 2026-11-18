import { useState } from 'react';
import { Plus, TrendingUp, TrendingDown, PiggyBank, Trash2, Printer, FileText, Wallet, DatabaseBackup } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Layout from '@/components/Layout';
import BackupModal from '@/components/BackupModal';
import { api, Empty, Field, LoadingBlock, Modal, useData, useToast } from '@/components/ui';
import { EXPENSE_CATEGORIES, fmtShort, rupiah, toInputDate } from '@/lib/format';

const short = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}jt` : n >= 1e3 ? `${Math.round(n / 1e3)}rb` : `${n}`);
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function Keuangan() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [mon, setMon] = useState(now.getMonth() + 1);
  const month = `${year}-${String(mon).padStart(2, '0')}`;
  const { data, loading, reload } = useData<any>(`/api/finance?year=${year}&month=${month}`);
  const toast = useToast();
  const [exp, setExp] = useState<any>(null);
  const [backupOpen, setBackupOpen] = useState(false);

  const saveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api('/api/expenses', 'POST', exp);
      toast('success', 'Pengeluaran dicatat');
      setExp(null);
      reload();
    } catch (err: any) {
      toast('error', err.message);
    }
  };
  const delExpense = async (id: number) => {
    if (!confirm('Hapus pengeluaran ini?')) return;
    await api(`/api/expenses/${id}`, 'DELETE');
    toast('success', 'Pengeluaran dihapus');
    reload();
  };

  const pie = data
    ? Object.entries(data.byCategory).map(([k, v]) => ({ name: EXPENSE_CATEGORIES[k]?.label || k, value: v as number, color: EXPENSE_CATEGORIES[k]?.color || '#94a3b8' }))
    : [];

  const mIncome = data?.ledger.filter((l: any) => l.type === 'MASUK').reduce((s: number, l: any) => s + l.amount, 0) || 0;
  const mExpense = data?.ledger.filter((l: any) => l.type === 'KELUAR').reduce((s: number, l: any) => s + l.amount, 0) || 0;

  let running = 0;

  return (
    <Layout
      title="Manajemen Keuangan"
      subtitle="Pemasukan sewa, pengeluaran operasional & laba kost"
      actions={
        <>
          <button className="btn-ghost no-print" onClick={() => setBackupOpen(true)}>
            <DatabaseBackup className="h-4 w-4 text-brand-600" /> <span className="hidden sm:inline">Backup / Export & Import</span>
          </button>
          <button className="btn-ghost no-print hidden sm:inline-flex" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Cetak
          </button>
          <button className="btn-primary no-print" onClick={() => setExp({ date: toInputDate(new Date()), category: 'LISTRIK', amount: '', note: '' })}>
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Catat Pengeluaran</span>
          </button>
        </>
      }
    >
      <div className="no-print mb-6 flex flex-wrap items-center gap-3">
        <select className="input w-auto" value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {[0, 1, 2, 3].map((k) => (
            <option key={k} value={now.getFullYear() - k}>
              Tahun {now.getFullYear() - k}
            </option>
          ))}
        </select>
      </div>

      {loading && !data ? (
        <div className="card">
          <LoadingBlock />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { l: `Total Pemasukan ${year}`, v: data.totalIncome, i: TrendingUp, g: 'from-emerald-500 to-teal-500' },
              { l: `Total Pengeluaran ${year}`, v: data.totalExpense, i: TrendingDown, g: 'from-rose-500 to-pink-500' },
              { l: `Laba Bersih ${year}`, v: data.profit, i: PiggyBank, g: 'from-brand-500 to-indigo-600' },
            ].map((c) => (
              <div key={c.l} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-lg ${c.g}`}>
                <c.i className="absolute -bottom-3 -right-3 h-24 w-24 text-white/15" />
                <p className="text-sm font-medium text-white/80">{c.l}</p>
                <p className="mt-2 text-2xl font-extrabold">{rupiah(c.v)}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="card p-6 xl:col-span-2">
              <h2 className="font-bold text-slate-900">Grafik Bulanan {year}</h2>
              <p className="mb-4 text-sm text-slate-500">Pemasukan, pengeluaran, dan laba per bulan</p>
              <div className="h-80">
                <ResponsiveContainer>
                  <BarChart data={data.monthly} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={short} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: number) => rupiah(v)} contentStyle={{ borderRadius: 12 }} cursor={{ fill: '#f1f5f9' }} />
                    <Legend iconType="circle" />
                    <Bar dataKey="income" name="Pemasukan" fill="#10b981" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="expense" name="Pengeluaran" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="profit" name="Laba" fill="#3b63f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card p-6">
              <h2 className="font-bold text-slate-900">Komposisi Pengeluaran</h2>
              <p className="mb-2 text-sm text-slate-500">Per kategori, tahun {year}</p>
              {pie.length === 0 ? (
                <Empty icon={Wallet} title="Belum ada pengeluaran" />
              ) : (
                <>
                  <div className="h-52">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={pie} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={3}>
                          {pie.map((p) => (
                            <Cell key={p.name} fill={p.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => rupiah(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="mt-2 space-y-2">
                    {pie.sort((a, b) => b.value - a.value).map((p) => (
                      <li key={p.name} className="flex items-center gap-2 text-sm">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
                        <span className="flex-1 text-slate-600">{p.name}</span>
                        <span className="font-semibold text-slate-800">{rupiah(p.value)}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>

          <div className="card mt-6">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-bold text-slate-900">Buku Kas — {MONTHS[mon - 1]} {year}</h2>
                <p className="text-sm text-slate-500">
                  Masuk <b className="text-emerald-600">{rupiah(mIncome)}</b> • Keluar <b className="text-rose-600">{rupiah(mExpense)}</b> • Saldo{' '}
                  <b className="text-brand-700">{rupiah(mIncome - mExpense)}</b>
                </p>
              </div>
              <div className="no-print flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
                {MONTHS.map((m, i) => (
                  <button
                    key={m}
                    onClick={() => setMon(i + 1)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${mon === i + 1 ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'}`}
                  >
                    {m.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
            {data.ledger.length === 0 ? (
              <Empty icon={FileText} title="Belum ada transaksi di bulan ini" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/70">
                    <tr>
                      <th className="th">Tanggal</th>
                      <th className="th">Keterangan</th>
                      <th className="th">Ref</th>
                      <th className="th text-right">Masuk</th>
                      <th className="th text-right">Keluar</th>
                      <th className="th text-right">Saldo</th>
                      <th className="th no-print"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.ledger.map((l: any, i: number) => {
                      running += l.type === 'MASUK' ? l.amount : -l.amount;
                      return (
                        <tr key={i} className="hover:bg-slate-50/60">
                          <td className="td whitespace-nowrap text-slate-600">{fmtShort(l.date)}</td>
                          <td className="td font-medium text-slate-800">{l.desc}</td>
                          <td className="td text-xs text-slate-500">
                            {l.type === 'MASUK' ? (
                              <a href={`/kwitansi/${l.token}`} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">
                                {l.ref}
                              </a>
                            ) : (
                              EXPENSE_CATEGORIES[l.ref]?.label || l.ref
                            )}
                          </td>
                          <td className="td whitespace-nowrap text-right font-semibold text-emerald-600">{l.type === 'MASUK' ? rupiah(l.amount) : ''}</td>
                          <td className="td whitespace-nowrap text-right font-semibold text-rose-600">{l.type === 'KELUAR' ? rupiah(l.amount) : ''}</td>
                          <td className="td whitespace-nowrap text-right font-bold text-slate-800">{rupiah(running)}</td>
                          <td className="td no-print text-right">
                            {l.type === 'KELUAR' && (
                              <button className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => delExpense(l.id)}>
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <Modal open={!!exp} onClose={() => setExp(null)} title="Catat Pengeluaran" subtitle="Biaya operasional kost">
        {exp && (
          <form onSubmit={saveExpense} className="space-y-4">
            <div>
              <span className="label">Kategori</span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {Object.entries(EXPENSE_CATEGORIES).map(([k, c]) => (
                  <button
                    type="button"
                    key={k}
                    onClick={() => setExp({ ...exp, category: k })}
                    className={`rounded-xl border-2 px-2 py-2 text-xs font-semibold transition ${exp.category === k ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'}`}
                  >
                    <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: c.color }} />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tanggal">
                <input type="date" className="input" value={exp.date} onChange={(e) => setExp({ ...exp, date: e.target.value })} required />
              </Field>
              <Field label="Jumlah (Rp)">
                <input type="number" className="input" value={exp.amount} onChange={(e) => setExp({ ...exp, amount: e.target.value })} required placeholder="250000" />
              </Field>
            </div>
            <Field label="Keterangan">
              <input className="input" value={exp.note} onChange={(e) => setExp({ ...exp, note: e.target.value })} placeholder="cth. Token listrik bulan November" />
            </Field>
            <div className="flex gap-3 pt-2">
              <button type="button" className="btn-ghost flex-1" onClick={() => setExp(null)}>
                Batal
              </button>
              <button className="btn-primary flex-1">Simpan</button>
            </div>
          </form>
        )}
      </Modal>
      <BackupModal open={backupOpen} onClose={() => setBackupOpen(false)} onRestored={reload} year={year} />
    </Layout>
  );
}
