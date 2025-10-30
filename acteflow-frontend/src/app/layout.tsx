import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { ReactQueryProvider } from '@/lib/queryClient';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'acteFlow - Document Management System',
  description: 'Professional document management for civil registry',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <ReactQueryProvider>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            theme="dark"
          />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
