import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { ToastProvider, WaProvider } from '@/components/ui';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ToastProvider>
      <WaProvider>
        <Head>
          <title>Kost Manager – Sistem Pembayaran Kost</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <Component {...pageProps} />
      </WaProvider>
    </ToastProvider>
  );
}
