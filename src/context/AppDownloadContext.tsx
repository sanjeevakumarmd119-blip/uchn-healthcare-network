'use client';

import React, { createContext, useContext, useState } from 'react';
import { AppDownloadModal } from '@/components/common/AppDownloadModal';

interface AppDownloadContextType {
  openDownloadModal: () => void;
  closeDownloadModal: () => void;
  isDownloadModalOpen: boolean;
}

const AppDownloadContext = createContext<AppDownloadContextType | undefined>(undefined);

export function AppDownloadProvider({ children }: { children: React.ReactNode }) {
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const openDownloadModal = () => setIsDownloadModalOpen(true);
  const closeDownloadModal = () => setIsDownloadModalOpen(false);

  return (
    <AppDownloadContext.Provider
      value={{
        openDownloadModal,
        closeDownloadModal,
        isDownloadModalOpen,
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

