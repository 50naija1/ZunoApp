import { createContext, useContext, useState } from "react";

type AuthContextType = {
  artisanToken: string | null;
  artisanData: any;
  loginArtisan: (token: string, data: any) => void;
  logoutArtisan: () => void;
};

const AuthContext = createContext<AuthContextType>({
  artisanToken: null,
  artisanData: null,
  loginArtisan: () => {},
  logoutArtisan: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [artisanToken, setArtisanToken] = useState<string | null>(null);
  const [artisanData, setArtisanData] = useState<any>(null);

  const loginArtisan = (token: string, data: any) => {
    setArtisanToken(token);
    setArtisanData(data);
  };

  const logoutArtisan = () => {
    setArtisanToken(null);
    setArtisanData(null);
  };

  return (
    <AuthContext.Provider value={{ artisanToken, artisanData, loginArtisan, logoutArtisan }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}