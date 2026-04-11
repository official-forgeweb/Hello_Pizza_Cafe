import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ScrollToTop from '@/components/layout/ScrollToTop';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Hello Pizza — Fresh, Hot & Delicious Pizza Delivered',
  description:
    'Order mouth-watering pizzas, sides, and beverages from Hello Pizza. Fresh ingredients, fast delivery, and amazing flavors. Order now!',
  keywords: ['pizza', 'delivery', 'food', 'order online', 'hello pizza'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#e31837',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable}`} suppressHydrationWarning>
      <body className="font-sans min-h-screen flex flex-col" suppressHydrationWarning>
        <ScrollToTop />
        {children}
      </body>
    </html>
  );
}
