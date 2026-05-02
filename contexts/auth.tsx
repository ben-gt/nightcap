import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { useStore } from '@/store';
import { saveTokens, loadTokens, clearTokens, isTokenExpired } from '@/lib/token-storage';

WebBrowser.maybeCompleteAuthSession();

const AUTH0_DOMAIN = process.env.EXPO_PUBLIC_AUTH0_DOMAIN!;
const AUTH0_CLIENT_ID = process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID!;
const AUTH0_AUDIENCE = process.env.EXPO_PUBLIC_AUTH0_AUDIENCE!;

const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: `https://${AUTH0_DOMAIN}/authorize`,
  tokenEndpoint: `https://${AUTH0_DOMAIN}/oauth/token`,
  revocationEndpoint: `https://${AUTH0_DOMAIN}/oauth/revoke`,
  userInfoEndpoint: `https://${AUTH0_DOMAIN}/userinfo`,
  endSessionEndpoint: `https://${AUTH0_DOMAIN}/v2/logout`,
};

const redirectUri = AuthSession.makeRedirectUri({
  scheme: 'roadsiderooms',
  path: 'auth/callback',
});

console.log('[Auth] redirectUri:', redirectUri);

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  isLoading: true,
  authError: null,
  login: async () => {},
  logout: async () => {},
  getAccessToken: async () => null,
});

export function useAuth() {
  return useContext(AuthContext);
}

async function fetchUserProfile(accessToken: string) {
  const res = await fetch(discovery.userInfoEndpoint!, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch profile: ${res.status}`);
  return res.json();
}

async function refreshAccessToken(refreshToken: string): Promise<AuthSession.TokenResponse> {
  const tokenRes = await AuthSession.refreshAsync(
    {
      clientId: AUTH0_CLIENT_ID,
      refreshToken,
    },
    discovery,
  );
  return tokenRes;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const accessTokenRef = useRef<string | null>(null);
  const refreshTokenRef = useRef<string | null>(null);
  const expiresAtRef = useRef<number | null>(null);

  const setUser = useStore((s) => s.setUser);
  const clearUser = useStore((s) => s.clearUser);
  const user = useStore((s) => s.user);

  const [request, result, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: AUTH0_CLIENT_ID,
      redirectUri,
      scopes: ['openid', 'profile', 'email', 'offline_access'],
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
      extraParams: {
        audience: AUTH0_AUDIENCE,
      },
    },
    discovery,
  );

  // Hydrate session from stored tokens on app launch
  useEffect(() => {
    (async () => {
      try {
        const stored = await loadTokens();
        if (!stored.refreshToken) {
          setIsLoading(false);
          return;
        }

        // If access token is still valid, use it
        if (stored.accessToken && !isTokenExpired(stored.expiresAt)) {
          accessTokenRef.current = stored.accessToken;
          refreshTokenRef.current = stored.refreshToken;
          expiresAtRef.current = stored.expiresAt;

          const profile = await fetchUserProfile(stored.accessToken);
          setUser({
            id: profile.sub,
            name: profile.name ?? profile.nickname ?? '',
            email: profile.email ?? '',
            phone: '',
            avatarUrl: profile.picture ?? undefined,
            identityStatus: profile.email_verified ? 'verified' : 'unverified',
            paymentStatus: 'none',
            isVendor: profile[`${AUTH0_AUDIENCE}/roles`]?.includes('vendor') ?? false,
            createdAt: new Date().toISOString(),
          });
        } else {
          // Access token expired — try refresh
          const tokenRes = await refreshAccessToken(stored.refreshToken);
          const newExpiresIn = tokenRes.expiresIn ?? 3600;
          accessTokenRef.current = tokenRes.accessToken;
          refreshTokenRef.current = tokenRes.refreshToken ?? stored.refreshToken;
          expiresAtRef.current = Date.now() + newExpiresIn * 1000;

          await saveTokens(
            tokenRes.accessToken,
            refreshTokenRef.current,
            newExpiresIn,
          );

          const profile = await fetchUserProfile(tokenRes.accessToken);
          setUser({
            id: profile.sub,
            name: profile.name ?? profile.nickname ?? '',
            email: profile.email ?? '',
            phone: '',
            avatarUrl: profile.picture ?? undefined,
            identityStatus: profile.email_verified ? 'verified' : 'unverified',
            paymentStatus: 'none',
            isVendor: profile[`${AUTH0_AUDIENCE}/roles`]?.includes('vendor') ?? false,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.warn('Session hydration failed, clearing tokens:', e);
        await clearTokens();
        clearUser();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Handle auth code exchange after login redirect
  useEffect(() => {
    if (result?.type !== 'success') {
      if (result?.type === 'error') {
        setAuthError(result.error?.message ?? 'Login failed. Please try again.');
        setIsLoading(false);
      } else if (result?.type === 'dismiss') {
        setIsLoading(false);
      }
      return;
    }

    const { code } = result.params;

    (async () => {
      try {
        setAuthError(null);
        const tokenRes = await AuthSession.exchangeCodeAsync(
          {
            clientId: AUTH0_CLIENT_ID,
            code,
            redirectUri,
            extraParams: { code_verifier: request?.codeVerifier ?? '' },
          },
          discovery,
        );

        const expiresIn = tokenRes.expiresIn ?? 3600;
        accessTokenRef.current = tokenRes.accessToken;
        refreshTokenRef.current = tokenRes.refreshToken ?? null;
        expiresAtRef.current = Date.now() + expiresIn * 1000;

        await saveTokens(
          tokenRes.accessToken,
          tokenRes.refreshToken ?? null,
          expiresIn,
        );

        const profile = await fetchUserProfile(tokenRes.accessToken);

        setUser({
          id: profile.sub,
          name: profile.name ?? profile.nickname ?? '',
          email: profile.email ?? '',
          phone: '',
          avatarUrl: profile.picture ?? undefined,
          identityStatus: profile.email_verified ? 'verified' : 'unverified',
          paymentStatus: 'none',
          isVendor: profile[`${AUTH0_AUDIENCE}/roles`]?.includes('vendor') ?? false,
          createdAt: new Date().toISOString(),
        });
      } catch (e) {
        console.error('Auth token exchange failed:', e);
        setAuthError('Login failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [result]);

  const login = useCallback(async () => {
    setIsLoading(true);
    setAuthError(null);
    await promptAsync();
  }, [promptAsync]);

  const logout = useCallback(async () => {
    // Revoke refresh token at Auth0
    if (refreshTokenRef.current) {
      try {
        await AuthSession.revokeAsync(
          { token: refreshTokenRef.current, clientId: AUTH0_CLIENT_ID },
          discovery,
        );
      } catch (e) {
        console.warn('Token revocation failed:', e);
      }
    }

    accessTokenRef.current = null;
    refreshTokenRef.current = null;
    expiresAtRef.current = null;
    await clearTokens();
    clearUser();

    if (Platform.OS === 'web') {
      const returnTo = encodeURIComponent(window.location.origin);
      window.location.href =
        `https://${AUTH0_DOMAIN}/v2/logout?client_id=${AUTH0_CLIENT_ID}&returnTo=${returnTo}`;
    }
  }, [clearUser]);

  // Provides a valid access token, refreshing if needed
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (accessTokenRef.current && !isTokenExpired(expiresAtRef.current)) {
      return accessTokenRef.current;
    }

    if (!refreshTokenRef.current) {
      // No refresh token — force re-login
      clearUser();
      await clearTokens();
      return null;
    }

    try {
      const tokenRes = await refreshAccessToken(refreshTokenRef.current);
      const expiresIn = tokenRes.expiresIn ?? 3600;
      accessTokenRef.current = tokenRes.accessToken;
      refreshTokenRef.current = tokenRes.refreshToken ?? refreshTokenRef.current;
      expiresAtRef.current = Date.now() + expiresIn * 1000;

      await saveTokens(
        tokenRes.accessToken,
        refreshTokenRef.current,
        expiresIn,
      );

      return tokenRes.accessToken;
    } catch (e) {
      console.error('Token refresh failed:', e);
      clearUser();
      await clearTokens();
      setAuthError('Your session expired. Please sign in again.');
      return null;
    }
  }, [clearUser]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user && !!accessTokenRef.current,
        isLoading,
        authError,
        login,
        logout,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
