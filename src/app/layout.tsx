import '../styles/globals.css';

export const metadata = {
  title: 'Otakudesu Clean Stream',
  description: 'Stream Anime tanpa iklan, cepat, dan ringan',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
