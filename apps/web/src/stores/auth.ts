import { createSignal } from 'solid-js';

export type Admin = {
  id: string;
  email: string;
  createdAt: string;
};

const [admin, setAdmin] = createSignal<Admin | null>(null);
const [isLoading, setIsLoading] = createSignal(false);
const [isInitialized, setIsInitialized] = createSignal(false);

export const authStore = {
  admin,
  isLoading,
  isInitialized,

  async login(email: string, password: string) {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error de login');
      }

      setAdmin(data.admin);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    } finally {
      setIsLoading(false);
    }
  },

  async logout() {
    setIsLoading(true);
    try {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      setAdmin(null);
      setIsLoading(false);
    }
  },

  async checkAuth() {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/auth/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAdmin(data.admin);
        return true;
      }
      setAdmin(null);

      return false;
    } catch {
      setAdmin(null);
      return false;
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  },
};
