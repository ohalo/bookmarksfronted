import Cookies from 'js-cookie';
import { JwtResponse } from '@/types';

const AUTH_TOKEN_KEY = 'auth_token';
const USER_KEY = 'user';

export const auth = {
  setToken: (token: string) => {
    Cookies.set(AUTH_TOKEN_KEY, token, { expires: 7 }); // 7天过期
  },
  
  getToken: (): string | undefined => {
    return Cookies.get(AUTH_TOKEN_KEY);
  },
  
  removeToken: () => {
    Cookies.remove(AUTH_TOKEN_KEY);
  },
  
  setUser: (user: { id: number; username: string }) => {
    Cookies.set(USER_KEY, JSON.stringify(user), { expires: 7 });
  },
  
  getUser: (): { id: number; username: string } | null => {
    const userStr = Cookies.get(USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },
  
  removeUser: () => {
    Cookies.remove(USER_KEY);
  },
  
  login: (response: JwtResponse) => {
    auth.setToken(response.token);
    auth.setUser({
      id: response.userId,
      username: response.username,
    });
  },
  
  logout: () => {
    auth.removeToken();
    auth.removeUser();
  },
  
  isAuthenticated: (): boolean => {
    return !!auth.getToken();
  },
};

