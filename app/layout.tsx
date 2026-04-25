import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Passkeys Auth Demo',
  description: 'Passwordless authentication using WebAuthn',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased font-sans flex flex-col min-h-screen bg-[#09090b] text-zinc-200" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

