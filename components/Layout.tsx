// components/Layout.tsx — sidebar + header
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode, useState } from 'react';
import {
  LayoutDashboard, BedDouble, Store, Users, ReceiptText, Wallet, MessageCircle, Workflow, Settings, LogOut, Menu, X, Building2,
} from 'lucide-react';
import { api } from './ui';

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tagihan', label: 'Tagihan & Pembayaran', icon: ReceiptText },
  { href: '/penghuni', label: 'Penghuni', icon: Users },
  { href: '/kamar', label: 'Kamar', icon: BedDouble },
  { href: '/kios', label: 'Kios', icon: Store },
  { href: '/keuangan', label: 'Manajemen Keuangan', icon: Wallet },
  { href: '/notifikasi', label: 'Notifikasi WhatsApp', icon: MessageCircle },
  { href: '/pengaturan', label: 'Pengaturan & Template', icon: Settings },
  { href: '/alur', label: 'Alur Sistem', icon: Workflow },
];

export default function Layout({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const logout = async () => {
    await api('/api/auth/logout', 'POST');
    router.push('/login');
  };

  const Sidebar = (
    <aside className="flex h-full w-72 flex-col overflow-y-auto bg-gradient-to-b from-slate-900 via-slate-900 to-brand-900 p-5 text-slate-300">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="rounded-xl bg-gradient-to-br from-brand-400 to-indigo-500 p-2.5 shadow-lg shadow-brand-900/50">
          <Building2 className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-lg font-extrabold leading-tight text-white">Kost Manager</p>
          <p className="text-xs text-slate-400">Sistem Pembayaran Kost</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? router.pathname === '/' : router.pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                active ? 'bg-white/10 text-white shadow-inner ring-1 ring-white/10' : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? 'text-brand-300' : 'text-slate-500 group-hover:text-slate-300'}`} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-6 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
        <p className="text-xs text-slate-400">Masuk sebagai</p>
        <p className="font-semibold text-white">Administrator</p>
        <button onClick={logout} className="mt-3 flex items-center gap-2 text-sm font-medium text-rose-300 hover:text-rose-200">
          <LogOut className="h-4 w-4" /> Keluar
        </button>
      </div>
      <div className="mt-3 flex items-center gap-3 rounded-2xl bg-black/40 p-3 ring-1 ring-white/10">
        <img
          src="/creator-logo.jpg"
          alt="Logo aryaspd"
          className="h-11 w-11 shrink-0 rounded-xl bg-black object-cover ring-1 ring-white/15"
        />
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Dibuat oleh</p>
          <p className="truncate text-sm font-extrabold text-white">aryaspd</p>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen lg:pl-72">
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">{Sidebar}</div>

      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="animate-fade-up">{Sidebar}</div>
          <div className="flex-1 bg-slate-900/50" onClick={() => setOpen(false)}>
            <button className="m-4 rounded-lg bg-white/10 p-2 text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-8">
          <button className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-extrabold text-slate-900 sm:text-2xl">{title}</h1>
            {subtitle && <p className="truncate text-sm text-slate-500">{subtitle}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl animate-fade-up px-4 py-6 sm:px-8 sm:py-8">{children}</main>
    </div>
  );
}
