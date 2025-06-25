import '@livekit/components-styles';
import '@livekit/components-styles/prefabs';
import '../styles/globals.css';
import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';
import { TooltipProvider } from '@/components/ui/tooltip';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://kolabempati.com'),
  title: {
    default: 'KolabEmpati | Modern Video Conferencing Platform',
    template: '%s',
  },
  description:
    'KolabEmpati is a modern video conferencing platform built with cutting-edge technology to deliver seamless real-time audio and video collaboration experiences.',  twitter: {
    creator: '@kolabempati',
    site: '@kolabempati',
    card: 'summary_large_image',
  },  openGraph: {
    url: 'https://kolabempati.com',
    images: [
      {
        url: '/LogoKolabEmpati.jpg',
        width: 1200,
        height: 630,
        type: 'image/jpeg',
      },
    ],
    siteName: 'KolabEmpati',
  },  icons: {
    icon: [
      {
        rel: 'icon',
        url: '/favicon.ico',
        sizes: '32x32',
      },
      {
        rel: 'icon',
        url: '/icons/icon-192x192.jpg',
        type: 'image/jpeg',
        sizes: '192x192',
      },
      {
        rel: 'icon',
        url: '/icons/icon-512x512.jpg',
        type: 'image/jpeg',
        sizes: '512x512',
      },
    ],
    apple: [
      {
        rel: 'apple-touch-icon',
        url: '/icons/icon-180x180.jpg',
        sizes: '180x180',
      },
      {
        rel: 'apple-touch-icon',
        url: '/icons/icon-152x152.jpg',
        sizes: '152x152',
      },
      {
        rel: 'apple-touch-icon',
        url: '/icons/icon-144x144.jpg',
        sizes: '144x144',
      },
      {
        rel: 'apple-touch-icon',
        url: '/icons/icon-128x128.jpg',
        sizes: '128x128',
      },
    ],
    shortcut: '/LogoKolabEmpati.jpg',  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#070707',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body data-lk-theme="default" className="dark bg-background text-foreground">
        <TooltipProvider>
          <Toaster 
            toastOptions={{
              className: 'dark:bg-background dark:text-foreground dark:border-border',
            }}
          />
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
