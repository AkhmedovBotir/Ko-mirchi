import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { authAPI } from '../services/api';
import { getOmborId } from '../utils/omborUtils';
import { useAuth } from './AuthContext';
import OmborSwitchOverlay from '../components/Dashboard/OmborSwitchOverlay';

const STORAGE_KEY = 'omborchiSelectedOmborId';
const MIN_SWITCH_MS = 500;
const MAX_SWITCH_MS = 5000;

const OmborContext = createContext(null);

export const useOmbor = () => {
  const context = useContext(OmborContext);
  if (!context) {
    throw new Error('useOmbor must be used within OmborProvider');
  }
  return context;
};

export const OmborProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [ombors, setOmbors] = useState([]);
  const [selectedOmborId, setSelectedOmborIdState] = useState(
    () => localStorage.getItem(STORAGE_KEY) || ''
  );
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [switchingOmborName, setSwitchingOmborName] = useState('');
  const switchStartedAt = useRef(0);
  const switchCompleteTimer = useRef(null);
  const switchFallbackTimer = useRef(null);

  const clearSwitchTimers = () => {
    if (switchCompleteTimer.current) {
      clearTimeout(switchCompleteTimer.current);
      switchCompleteTimer.current = null;
    }
    if (switchFallbackTimer.current) {
      clearTimeout(switchFallbackTimer.current);
      switchFallbackTimer.current = null;
    }
  };

  const finishSwitching = useCallback(() => {
    if (!switchStartedAt.current) return;

    const elapsed = Date.now() - switchStartedAt.current;
    const remaining = Math.max(0, MIN_SWITCH_MS - elapsed);

    if (switchCompleteTimer.current) {
      clearTimeout(switchCompleteTimer.current);
    }

    switchCompleteTimer.current = setTimeout(() => {
      setSwitching(false);
      setSwitchingOmborName('');
      switchStartedAt.current = 0;
      clearSwitchTimers();
    }, remaining);
  }, []);

  const beginSwitching = useCallback((omborName) => {
    clearSwitchTimers();
    switchStartedAt.current = Date.now();
    setSwitching(true);
    setSwitchingOmborName(omborName || '');

    switchFallbackTimer.current = setTimeout(() => {
      finishSwitching();
    }, MAX_SWITCH_MS);
  }, [finishSwitching]);

  const pickDefaultOmbor = (list) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const storedValid = stored && list.some((item) => getOmborId(item) === stored);
    if (storedValid) return stored;
    if (list.length > 0) return getOmborId(list[0]);
    return '';
  };

  const loadOmbors = async () => {
    setLoading(true);
    try {
      const response = await authAPI.getOmborchiOmbors();
      const list = Array.isArray(response?.data) ? response.data : [];
      setOmbors(list);
      const nextId = pickDefaultOmbor(list);
      setSelectedOmborIdState(nextId);
      if (nextId) {
        localStorage.setItem(STORAGE_KEY, nextId);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      setOmbors([]);
      setSelectedOmborIdState('');
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) {
      loadOmbors();
      return;
    }
    setOmbors([]);
    setSelectedOmborIdState('');
    localStorage.removeItem(STORAGE_KEY);
    setLoading(false);
    setSwitching(false);
    setSwitchingOmborName('');
    clearSwitchTimers();
  }, [isAuthenticated, authLoading]);

  useEffect(() => () => clearSwitchTimers(), []);

  const setSelectedOmborId = (omborId) => {
    const id = String(omborId);
    if (id === String(selectedOmborId)) return;

    const target = ombors.find((item) => getOmborId(item) === id);
    beginSwitching(target?.name || '');
    setSelectedOmborIdState(id);

    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const selectedOmbor = useMemo(
    () => ombors.find((item) => getOmborId(item) === String(selectedOmborId)) || null,
    [ombors, selectedOmborId]
  );

  const value = {
    ombors,
    selectedOmborId,
    selectedOmbor,
    setSelectedOmborId,
    loading,
    switching,
    switchingOmborName,
    completeOmborSwitch: finishSwitching,
    reloadOmbors: loadOmbors,
    hasOmbors: ombors.length > 0,
  };

  return (
    <OmborContext.Provider value={value}>
      {children}
      <OmborSwitchOverlay />
    </OmborContext.Provider>
  );
};
