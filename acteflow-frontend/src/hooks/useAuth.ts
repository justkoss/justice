'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export function useAuth() {
  const { t } = useTranslation();
  const router = useRouter();
  const { login: loginStore, logout: logoutStore } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.login(username, password);
      
      if (response.data.success) {
        const { user, token } = response.data;
        
        // Store auth data
        loginStore(user, token);
        
        // Show success message
        toast.success(t('auth.loginSuccess'), {
          description: `${t('auth.welcome')}, ${user.full_name || user.username}!`,
        });
        
        // Redirect to dashboard
        setTimeout(() => {
          router.push('/dashboard');
        }, 500);
        
        return { success: true };
      } else {
        throw new Error(response.data.message || t('auth.loginError'));
      }
    } catch (error: any) {
      const errorMessage = 
        error.response?.data?.message || 
        error.message || 
        t('auth.invalidCredentials');
      
      toast.error(t('auth.loginError'), {
        description: errorMessage,
      });
      
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logoutStore();
      router.push('/login');
      toast.info(t('auth.signOut'), {
        description: t('auth.sessionExpired'),
      });
    }
  };

  return {
    login,
    logout,
    isLoading,
  };
}
