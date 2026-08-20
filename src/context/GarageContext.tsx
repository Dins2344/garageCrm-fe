import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { ACTIVE_GARAGE_KEY } from '../utils/constants';
import { listBranches, createBranch, getGarage, deleteBranch, type DeleteBranchPayload } from '../services/apiServices/garageService';
import { useAuth } from './AuthContext';
import { DEFAULT_LOCALE } from '../utils/locale';
import type { Garage, ResolvedLocale } from '../types/models';

interface GarageContextValue {
  garages: Garage[];
  activeGarageId: string | null;
  activeGarageName: string | null;
  /** Active garage's server-resolved locale; DEFAULT_LOCALE until it loads. */
  locale: ResolvedLocale;
  /** The full active garage, once loaded — null during first paint. */
  activeGarage: Garage | null;
  /** Re-fetch the active garage, e.g. after Settings saves a new country. */
  refreshGarage: () => Promise<void>;
  switchGarage: (garageId: string) => void;
  addBranch: (data: Pick<Garage, 'name' | 'phone'>) => Promise<Garage>;
  removeBranch: (garageId: string, payload?: DeleteBranchPayload) => Promise<void>;
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

  // Owners already have the active garage for free once their branch list has
  // loaded; everyone else (and owners during that brief loading window) needs
  // a single direct fetch of whichever garage is currently active.
  const [fetchedGarage, setFetchedGarage] = useState<Garage | null>(null);
  const garageFromList = garages.find(g => g._id === activeGarageId) ?? null;

  const refreshGarage = async () => {
    const { data } = await getGarage();
    setFetchedGarage(data);
    setOwnerGarages(prev => prev.map(g => (g._id === data._id ? data : g)));
  };

  useEffect(() => {
    if (garageFromList || !activeGarageId) return;
    getGarage().then(({ data }) => setFetchedGarage(data)).catch(() => {});
  }, [activeGarageId, garageFromList]);

  // Only trust the fetched garage while it still matches the active branch —
  // switching branches leaves the previous fetch in state for a moment.
  const activeGarage =
    garageFromList ?? (fetchedGarage?._id === activeGarageId ? fetchedGarage : null);
  const activeGarageName = activeGarage?.name ?? null;

  // The server resolves this; the client never derives a currency or tax name
  // itself. DEFAULT_LOCALE covers first paint only.
  const locale = activeGarage?.locale ?? DEFAULT_LOCALE;

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

  const removeBranch = async (garageId: string, payload?: DeleteBranchPayload): Promise<void> => {
    const { data } = await deleteBranch(garageId, payload);
    setOwnerGarages(prev => prev.filter(g => g._id !== garageId));
    // If the deleted branch was the active one, follow the backend's fallback
    // (the owner's own `garage` ref was just repointed there too) so the app
    // doesn't keep sending X-Garage-Id for a branch that no longer exists.
    if (garageId === ownerActiveGarageId) {
      switchGarage(data.fallbackGarageId);
    }
  };

  return (
    <GarageContext.Provider value={{
      garages, activeGarageId, activeGarageName, activeGarage, locale,
      refreshGarage, switchGarage, addBranch, removeBranch
    }}>
      {children}
    </GarageContext.Provider>
  );
}

export const useGarage = (): GarageContextValue => {
  const context = useContext(GarageContext);
  if (!context) throw new Error('useGarage must be used within GarageProvider');
  return context;
};
