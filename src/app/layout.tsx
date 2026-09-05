import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { LocationProvider } from '@/context/LocationContext';
import { SocketProvider } from '@/context/SocketContext';
import { Navbar } from '@/components/common/Navbar';
import { LocationPickerModal } from '@/components/common/LocationPickerModal';
import { ToastContainer } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'UCHN — Unified Care & Health Network',
  description: 'Connected healthcare. Simplified for everyone. Unified Care & Health Network connecting Patients, Doctors, and Clinics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#F8FAFC] min-h-screen flex flex-col text-slate-900 font-sans">
        <AuthProvider>
          <LocationProvider>
            <SocketProvider>
              <Navbar />
              <LocationPickerModal />
              <ToastContainer />
              <main className="flex-1 flex flex-col">{children}</main>
            </SocketProvider>
          </LocationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

