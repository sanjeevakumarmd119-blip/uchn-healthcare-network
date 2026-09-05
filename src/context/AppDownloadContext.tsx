'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppDownloadModal } from '@/components/common/AppDownloadModal';

interface AppDownloadContextType {
  openDownloadModal: () => void;
  closeDownloadModal: () => void;
  isDownloadModalOpen: boolean;
  isAppInstalled: boolean;
  isStandalone: boolean;
  isDoctorDrawerOpen: boolean;
  openDoctorDrawer: () => void;
  closeDoctorDrawer: () => void;
  toggleDoctorDrawer: () => void;
}

const AppDownloadContext = createContext<AppDownloadContextType | undefined>(undefined);

export function AppDownloadProvider({ children }: { children: React.ReactNode }) {
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDoctorDrawerOpen, setIsDoctorDrawerOpen] = useState(false);

  useEffect(() => {
    const checkInstallation = () => {
      const standalone =
        typeof window !== 'undefined' &&
        (window.matchMedia('(display-mode: standalone)').matches ||
          (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
          document.referrer.includes('android-app://'));

      const installedFlag =
        typeof window !== 'undefined' &&
        localStorage.getItem('uchn_app_installed') === 'true';

      setIsStandalone(standalone);
      setIsAppInstalled(standalone || installedFlag);
    };

    checkInstallation();

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setIsStandalone(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('uchn_app_installed', 'true');
      }
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const openDownloadModal = () => setIsDownloadModalOpen(true);
  const closeDownloadModal = () => setIsDownloadModalOpen(false);

  const openDoctorDrawer = () => setIsDoctorDrawerOpen(true);
  const closeDoctorDrawer = () => setIsDoctorDrawerOpen(false);
  const toggleDoctorDrawer = () => setIsDoctorDrawerOpen((prev) => !prev);

  return (
    <AppDownloadContext.Provider
      value={{
        openDownloadModal,
        closeDownloadModal,
        isDownloadModalOpen,
        isAppInstalled,
        isStandalone,
        isDoctorDrawerOpen,
        openDoctorDrawer,
        closeDoctorDrawer,
        toggleDoctorDrawer,
      }}
    >
      {children}
      <AppDownloadModal
        isOpen={isDownloadModalOpen}
        onClose={closeDownloadModal}
      />
    </AppDownloadContext.Provider>
  );
}

export function useAppDownload() {
  const context = useContext(AppDownloadContext);
  if (!context) {
    throw new Error('useAppDownload must be used within an AppDownloadProvider');
  }
  return context;
}

