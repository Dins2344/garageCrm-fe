import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { ACTIVE_GARAGE_KEY } from '../utils/constants';
import { listBranches, createBranch, getGarage } from '../services/apiServices/garageService';
import { useAuth } from './AuthContext';
import type { Garage } from '../types/models';

interface GarageContextValue {
  garages: Garage[];
  activeGarageId: string | null;
  activeGarageName: string | null;
  switchGarage: (garageId: string) => void;
  addBranch: (data: Pick<Garage, 'name' | 'phone'>) => Promise<Garage>;
}

const GarageContext = createContext<GarageContextValue | null>(null);

export function GarageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  // Only ever populated/used for owners — non-owners are always scoped to
  // their single assigned garage, derived below rather than stored.
  const [ownerGarages, setOwnerGarages] = useState<Garage[]>([]);
  const [ownerActiveGarageId, setOwnerActiveGarageId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'owner') return;

    listBranches().then(({ data }) => {
      setOwnerGarages(data);
      const stored = localStorage.getItem(ACTIVE_GARAGE_KEY);
      const resolved = stored && data.some(g => g._id === stored) ? stored : user.garage;
      setOwnerActiveGarageId(resolved);
      localStorage.setItem(ACTIVE_GARAGE_KEY, resolved);
    }).catch(() => {
      // Branch list failed to load — falls back to the home garage below.
    });
  }, [user]);

  const garages = user?.role === 'owner' ? ownerGarages : [];
  // Falls back to the home garage until the branch list resolves (or if it
  // fails) — a branch is always active from the moment of login, with no
  // synchronous setState needed in the effect above.
  const activeGarageId = user
    ? (user.role === 'owner' ? (ownerActiveGarageId ?? user.garage) : user.garage)
    : null;

  // Owners already have the name for free once their branch list has loaded;
  // everyone else (and owners during that brief loading window) needs a
  // single direct fetch of whichever garage is currently active.
  const [fetchedGarageName, setFetchedGarageName] = useState<string | null>(null);
  const garageFromList = garages.find(g => g._id === activeGarageId)?.name ?? null;

  useEffect(() => {
    if (garageFromList || !activeGarageId) return;
    getGarage().then(({ data }) => setFetchedGarageName(data.name)).catch(() => {});
  }, [activeGarageId, garageFromList]);

  const activeGarageName = garageFromList ?? fetchedGarageName;

  const switchGarage = (garageId: string) => {
    setOwnerActiveGarageId(garageId);
    localStorage.setItem(ACTIVE_GARAGE_KEY, garageId);
  };

  const addBranch = async (data: Pick<Garage, 'name' | 'phone'>): Promise<Garage> => {
    const { data: garage } = await createBranch(data);
    setOwnerGarages(prev => [...prev, garage]);
    switchGarage(garage._id);
    return garage;
  };

  return (
    <GarageContext.Provider value={{ garages, activeGarageId, activeGarageName, switchGarage, addBranch }}>
      {children}
    </GarageContext.Provider>
  );
}

export const useGarage = (): GarageContextValue => {
  const context = useContext(GarageContext);
  if (!context) throw new Error('useGarage must be used within GarageProvider');
  return context;
};
