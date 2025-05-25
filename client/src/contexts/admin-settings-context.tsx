import React, { createContext, useContext, useState, useEffect } from 'react';

interface AdminSettingsContextType {
  showEditButtons: boolean;
  setShowEditButtons: (show: boolean) => void;
}

const AdminSettingsContext = createContext<AdminSettingsContextType | undefined>(undefined);

export function AdminSettingsProvider({ children }: { children: React.ReactNode }) {
  const [showEditButtons, setShowEditButtons] = useState(() => {
    // Load from localStorage or default to false for clean customer view
    const saved = localStorage.getItem('showEditButtons');
    return saved ? JSON.parse(saved) : false;
  });

  // Save to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('showEditButtons', JSON.stringify(showEditButtons));
  }, [showEditButtons]);

  return (
    <AdminSettingsContext.Provider value={{ showEditButtons, setShowEditButtons }}>
      {children}
    </AdminSettingsContext.Provider>
  );
}

export function useAdminSettings() {
  const context = useContext(AdminSettingsContext);
  if (context === undefined) {
    throw new Error('useAdminSettings must be used within an AdminSettingsProvider');
  }
  return context;
}