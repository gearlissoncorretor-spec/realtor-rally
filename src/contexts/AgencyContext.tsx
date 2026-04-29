import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface AgencyContextType {
  selectedAgencyId: string | 'all';
  setSelectedAgencyId: (id: string | 'all') => void;
}

const AgencyContext = createContext<AgencyContextType | undefined>(undefined);

export const AgencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isDiretor } = useAuth();
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | 'all'>(() => {
    return localStorage.getItem('selectedAgencyId') || 'all';
  });

  useEffect(() => {
    localStorage.setItem('selectedAgencyId', selectedAgencyId);
  }, [selectedAgencyId]);

  // If not a director, they can't see "all" - they are locked to their profile's agency
  // But RLS handles it anyway. However, for UI consistency:
  useEffect(() => {
    if (!user) {
      setSelectedAgencyId('all');
    }
  }, [user]);

  return (
    <AgencyContext.Provider value={{ selectedAgencyId, setSelectedAgencyId }}>
      {children}
    </AgencyContext.Provider>
  );
};

export const useAgency = () => {
  const context = useContext(AgencyContext);
  if (context === undefined) {
    throw new Error('useAgency must be used within an AgencyProvider');
  }
  return context;
};
