import type { Metadata, Viewport } from 'next';
import './globals.css';
import ScrollToTop from '@/components/layout/ScrollToTop';

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans min-h-screen flex flex-col" suppressHydrationWarning>
        <ScrollToTop />
        {children}
      </body>
    </html>
  );
}
