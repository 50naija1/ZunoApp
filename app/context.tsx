import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";

const API        = "https://zuno.ng/api";
const TOKEN_KEY  = "artisan_token";

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
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // true while restoring token

  // ── Fetch fresh profile from /api/artisan/me ────────────────────────────
  const fetchProfile = async (token: string) => {
    try {
      const res  = await fetch(`${API}/artisan/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.artisan) {
        setArtisanData(data.artisan);
      }
    } catch {}
  };

  // ── Restore token from AsyncStorage on app launch ────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(TOKEN_KEY);
        if (saved) {
          setArtisanToken(saved);
          await fetchProfile(saved); // load real data immediately
        }
      } catch {}
      setIsLoadingAuth(false);
    })();
  }, []);

  const refreshArtisanData = async () => {
    if (artisanToken) await fetchProfile(artisanToken);
  };

  const loginArtisan = async (token: string, data: any) => {
    setArtisanToken(token);
    setArtisanData(data);
    await AsyncStorage.setItem(TOKEN_KEY, token); // persist token
    fetchProfile(token);                          // fetch latest in background
  };

  const logoutArtisan = async () => {
    setArtisanToken(null);
    setArtisanData(null);
    await AsyncStorage.removeItem(TOKEN_KEY); // clear persisted token
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