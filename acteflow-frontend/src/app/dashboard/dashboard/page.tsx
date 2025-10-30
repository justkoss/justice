'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { LogOut, CheckCircle, User, Briefcase } from 'lucide-react';
import '@/lib/i18n';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { logout } = useAuth();

  useEffect(() => {
    document.title = `${t('app.name')} - ${t('nav.dashboard')}`;
  }, [t]);

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Simple Header */}
      <header className="bg-bg-secondary border-b border-border-primary">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-gold-primary to-gold-hover p-2 rounded-lg">
                <Briefcase className="h-6 w-6 text-bg-primary" />
              </div>
              <h1 className="text-2xl font-bold text-gradient-gold">
                {t('app.name')}
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <Button
                variant="secondary"
                size="md"
                onClick={logout}
                icon={<LogOut className="h-5 w-5" />}
              >
                {t('auth.logout')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Success Message */}
          <div className="bg-success-bg border border-success/30 rounded-2xl p-8 mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-success/20 p-3 rounded-xl">
                <CheckCircle className="h-8 w-8 text-success-light" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-success-light">
                  {t('auth.loginSuccess')}!
                </h2>
                <p className="text-text-secondary mt-1">
                  {t('auth.welcome')}, <span className="font-semibold text-gold-primary">{user?.full_name || user?.username}</span>
                </p>
              </div>
            </div>
          </div>

          {/* User Info Card */}
          <div className="bg-bg-secondary border border-border-primary rounded-2xl p-8 shadow-xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-gold-primary/10 p-3 rounded-xl">
                <User className="h-8 w-8 text-gold-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-text-primary mb-2">
                  {t('users.userDetails')}
                </h3>
                <p className="text-text-secondary">
                  {t('dashboard.overview')}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border-primary">
                <span className="text-text-secondary">{t('auth.username')}:</span>
                <span className="text-text-primary font-semibold">{user?.username}</span>
              </div>
              
              {user?.full_name && (
                <div className="flex items-center justify-between py-3 border-b border-border-primary">
                  <span className="text-text-secondary">{t('users.fullName')}:</span>
                  <span className="text-text-primary font-semibold">{user.full_name}</span>
                </div>
              )}
              
              {user?.email && (
                <div className="flex items-center justify-between py-3 border-b border-border-primary">
                  <span className="text-text-secondary">{t('users.email')}:</span>
                  <span className="text-text-primary font-semibold">{user.email}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between py-3">
                <span className="text-text-secondary">{t('users.role')}:</span>
                <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                  user?.role === 'admin' 
                    ? 'bg-gold-primary/10 text-gold-primary'
                    : user?.role === 'supervisor'
                    ? 'bg-purple-400/10 text-purple-400'
                    : 'bg-blue-400/10 text-blue-400'
                }`}>
                  {t(`roles.${user?.role}`)}
                </span>
              </div>
            </div>
          </div>

          {/* Info Message */}
          <div className="mt-8 bg-info-bg border border-info/20 rounded-xl p-6 text-center">
            <p className="text-text-secondary">
              <span className="font-semibold text-info-light">🚀 {t('common.note')}:</span>{' '}
              {t('dashboard.title')} interface coming in the next phase!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
