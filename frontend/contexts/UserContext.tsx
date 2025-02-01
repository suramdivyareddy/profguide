'use client';

import { createContext, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types/user';

interface UserContextType {
  user: User | null;
  login: (user: User, token: string, shouldNavigate?: boolean) => void;
  logout: (shouldNavigate?: boolean) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  const login = (user: User, token: string, shouldNavigate: boolean = true) => {
    setUser(user);
    localStorage.setItem('token', token);
    if (shouldNavigate) {
      router.push('/');
    }
  };

  const logout = (shouldNavigate: boolean = false) => {
    setUser(null);
    localStorage.removeItem('token');
    if (shouldNavigate) {
      router.push('/');
    }
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
