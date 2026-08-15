import type { Metadata } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import '../styles/globals.css';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });
const space = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Otakudesu Clean Stream — Anime Sub Indo',
  description: 'Stream anime subtitle Indonesia tanpa iklan. Ongoing, complete, jadwal rilis.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} ${space.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen bg-ink text-paper font-body overflow-x-clip">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-10">
          <Navbar />
          <main className="pt-8">{children}</main>
          <footer className="border-t border-line pt-6 mt-14 flex flex-wrap justify-between gap-2 font-mono text-xs text-muted">
            <span>OTAKUDESU CLEAN STREAM · HALLMARK SYSTEM</span>
            <span>DATA: otakudesu.blog</span>
          </footer>
        </div>
      </body>
    </html>
  );
}