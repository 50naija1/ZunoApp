import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { socketService } from "../services/socketService";

const API       = "https://zuno.ng/api";
const TOKEN_KEY = "artisan_token";

type AuthContextType = {
  artisanToken:       string | null;
  artisanData:        any;
  isLoadingAuth:      boolean;
  loginArtisan:       (token: string, data: any) => void;
  logoutArtisan:      () => void;
  refreshArtisanData: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  artisanToken:       null,
  artisanData:        null,
  isLoadingAuth:      true,
  loginArtisan:       () => {},
  logoutArtisan:      () => {},
  refreshArtisanData: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [artisanToken,  setArtisanToken]  = useState<string | null>(null);
  const [artisanData,   setArtisanData]   = useState<any>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Keep a ref so intervals/AppState handlers always have the latest token
  const tokenRef = useRef<string | null>(null);

  // ── Fetch fresh profile from /api/artisan/me ─────────────────────────────
  const fetchProfile = async (token: string): Promise<any> => {
    try {
      const res = await fetch(`${API}/artisan/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.success && data.artisan) {
        setArtisanData(data.artisan);
        return data.artisan;
      }
    } catch {}
    return null;
  };

  // ── Restore token + start socket on app launch ───────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(TOKEN_KEY);
        if (saved) {
          tokenRef.current = saved;
          setArtisanToken(saved);
          const artisan = await fetchProfile(saved);
          if (artisan?.id) {
            socketService.connect(artisan.id);
          }
        }
      } catch {}
      setIsLoadingAuth(false);
    })();
  }, []);

  // ── Auto-refresh every 60 seconds to keep stats current ──────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (tokenRef.current) {
        fetchProfile(tokenRef.current).catch(() => {});
      }
    }, 60000); // every 60 seconds

    return () => clearInterval(interval);
  }, []);

  // ── Refresh when app comes back to foreground ─────────────────────────────
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === "active" && tokenRef.current) {
        fetchProfile(tokenRef.current).catch(() => {});
      }
    };
    const sub = AppState.addEventListener("change", handleAppState);
    return () => sub.remove();
  }, []);

  const refreshArtisanData = async () => {
    if (tokenRef.current) await fetchProfile(tokenRef.current);
  };

  // ── Login — connect socket immediately ───────────────────────────────────
  const loginArtisan = async (token: string, data: any) => {
    tokenRef.current = token;
    setArtisanToken(token);
    setArtisanData(data);
    await AsyncStorage.setItem(TOKEN_KEY, token);
    fetchProfile(token); // refresh in background
    if (data?.id) {
      socketService.connect(data.id);
    }
  };

  // ── Logout — disconnect socket ────────────────────────────────────────────
  const logoutArtisan = async () => {
    socketService.disconnect();
    tokenRef.current = null;
    setArtisanToken(null);
    setArtisanData(null);
    await AsyncStorage.removeItem(TOKEN_KEY);
  };

  return (
    <AuthContext.Provider value={{
      artisanToken, artisanData, isLoadingAuth,
      loginArtisan, logoutArtisan, refreshArtisanData,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}