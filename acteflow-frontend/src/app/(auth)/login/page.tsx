'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LoginForm } from '@/components/auth/LoginForm';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { Layers, Info, Lock } from 'lucide-react';
import '@/lib/i18n'; // Initialize i18n

export default function LoginPage() {
  const { t } = useTranslation();

  useEffect(() => {
    // Ensure i18n is initialized
    document.title = `${t('app.name')} - ${t('auth.login')}`;
  }, [t]);

  return (
    <div className="w-full max-w-md">
      <div className="bg-bg-secondary border border-border-primary rounded-2xl shadow-2xl p-8 relative">
        {/* Language Switcher */}
        <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4">
          <LanguageSwitcher />
        </div>

        {/* Logo and Header */}
        <div className="text-center mb-8 mt-8">
          {/* Logo Icon */}
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-gold-primary to-gold-hover p-4 rounded-2xl shadow-gold">
              <Layers className="h-12 w-12 text-bg-primary" strokeWidth={2.5} />
            </div>
          </div>

          {/* App Name */}
          <h1 className="text-3xl font-bold text-gradient-gold mb-2">
            {t('app.name')}
          </h1>
          
          {/* Subtitle */}
          <p className="text-text-secondary text-base">
            {t('auth.login')}
          </p>
        </div>

        {/* Login Form */}
        <LoginForm />

        {/* Info Section */}
        <div className="mt-8 space-y-3">
          {/* Default Credentials Info */}
          <div className="flex items-start gap-3 p-4 bg-info-bg border border-info/20 rounded-lg">
            <Info className="h-5 w-5 text-info-light flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-text-secondary">
                <span className="font-semibold text-info-light">{t('common.note')}:</span>{' '}
                {t('auth.defaultCredentials')}
              </p>
              <div className="mt-2 space-y-1 text-xs text-text-tertiary font-mono">
                <div>Username: <span className="text-gold-primary">admin</span></div>
                <div>Password: <span className="text-gold-primary">justice2024</span></div>
              </div>
            </div>
          </div>

          {/* Security Info */}
          <div className="flex items-start gap-3 p-4 bg-white/5 border border-white/10 rounded-lg">
            <Lock className="h-5 w-5 text-text-muted flex-shrink-0 mt-0.5" />
            <p className="text-sm text-text-muted">
              {t('auth.secureConnection')}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-border-primary text-center">
          <p className="text-sm text-text-muted">
            <span className="font-semibold text-gold-primary">{t('app.name')}</span>
            {' · '}
            <span>{t('app.version')}</span>
          </p>
        </div>
      </div>

      {/* Bottom Info Card */}
      <div className="mt-6 bg-bg-tertiary/50 border border-border-primary rounded-xl p-4">
        <p className="text-sm text-text-secondary text-center">
          {t('auth.systemInfo')}
        </p>
      </div>
    </div>
  );
}
