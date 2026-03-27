import './globals.css';

export const metadata = {
  title: 'Pesona Dieng - Negeri di Atas Awan',
  description: 'Jelajahi keindahan Dataran Tinggi Dieng, dari Candi Arjuna hingga Telaga Warna. Destinasi wisata terbaik di Jawa Tengah Indonesia.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        {children}
      </body>
    </html>
  );
}
