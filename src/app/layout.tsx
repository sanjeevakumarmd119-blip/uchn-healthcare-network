import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { LocationProvider } from '@/context/LocationContext';
import { SocketProvider } from '@/context/SocketContext';
import { AppDownloadProvider } from '@/context/AppDownloadContext';
import { Navbar } from '@/components/common/Navbar';
import { Footer } from '@/components/common/Footer';
import { MobileBottomNav } from '@/components/common/MobileBottomNav';
import { InstallPwaPrompt } from '@/components/common/InstallPwaPrompt';
import { FloatingAIAssistantButton } from '@/components/common/FloatingAIAssistantButton';
import { ServiceWorkerRegister } from '@/components/common/ServiceWorkerRegister';
import { LocationPickerModal } from '@/components/common/LocationPickerModal';
import { ToastContainer } from '@/components/ui/Toast';

export const viewport: Viewport = {
  themeColor: '#0284c7',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: {
    default: 'UCHN — Unified Care & Health Network',
    template: '%s | UCHN Healthcare',
  },
  description:
    'Connected healthcare. Simplified for everyone. Unified Care & Health Network connecting Patients, Doctors, and Clinics.',
  applicationName: 'UCHN Health',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'UCHN Health',
  },
  formatDetection: {
    telephone: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
      </head>
      <body className="bg-[#F8FAFC] min-h-screen flex flex-col text-slate-900 font-sans antialiased">
        <AuthProvider>
          <LocationProvider>
            <SocketProvider>
              <AppDownloadProvider>
                <ServiceWorkerRegister />
                <Navbar />
                <LocationPickerModal />
                <ToastContainer />
                <main className="flex-1 flex flex-col pb-16 sm:pb-0">{children}</main>
                <Footer />
                <FloatingAIAssistantButton />
                <MobileBottomNav />
                <InstallPwaPrompt />
              </AppDownloadProvider>
            </SocketProvider>
          </LocationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
