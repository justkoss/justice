'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { 
  Bell, 
  User, 
  LogOut, 
  Settings,
  ChevronDown,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="h-16 bg-bg-secondary border-b border-border-primary flex-shrink-0">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-gold-primary to-gold-hover p-2 rounded-lg shadow-gold">
            <Layers className="h-6 w-6 text-bg-primary" strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-bold text-gradient-gold">
            {t('app.name')}
          </h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={cn(
                "relative p-2 rounded-lg transition-colors",
                "hover:bg-white/10",
                showNotifications && "bg-white/10"
              )}
              title={t('notifications.title')}
            >
              <Bell className="h-5 w-5 text-text-secondary" />
              {/* Notification Badge */}
              <span className="absolute top-1 right-1 h-2 w-2 bg-error rounded-full"></span>
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-bg-secondary border border-border-primary rounded-lg shadow-xl z-50">
                <div className="p-4 border-b border-border-primary">
                  <h3 className="font-semibold text-text-primary">
                    {t('notifications.title')}
                  </h3>
                </div>
                <div className="p-4 text-center text-text-muted text-sm">
                  {t('notifications.empty')}
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                "hover:bg-white/10",
                showUserMenu && "bg-white/10"
              )}
            >
              {/* Avatar */}
              <div className="h-8 w-8 rounded-lg bg-gold-primary/20 flex items-center justify-center">
                <User className="h-5 w-5 text-gold-primary" />
              </div>

              {/* User Info */}
              <div className="hidden md:block text-left">
                <div className="text-sm font-semibold text-text-primary">
                  {user?.full_name || user?.username}
                </div>
                <div className="text-xs text-text-tertiary">
                  {t(`roles.${user?.role}`)}
                </div>
              </div>

              <ChevronDown className={cn(
                "h-4 w-4 text-text-tertiary transition-transform",
                showUserMenu && "rotate-180"
              )} />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-bg-secondary border border-border-primary rounded-lg shadow-xl z-50">
                {/* User Info Header */}
                <div className="p-4 border-b border-border-primary">
                  <div className="font-semibold text-text-primary">
                    {user?.full_name || user?.username}
                  </div>
                  <div className="text-sm text-text-tertiary">
                    {user?.email}
                  </div>
                  <div className="mt-2">
                    <span className={cn(
                      "inline-flex px-2 py-1 rounded text-xs font-semibold",
                      user?.role === 'admin' && "bg-gold-primary/10 text-gold-primary",
                      user?.role === 'supervisor' && "bg-purple-400/10 text-purple-400",
                      user?.role === 'agent' && "bg-blue-400/10 text-blue-400"
                    )}>
                      {t(`roles.${user?.role}`)}
                    </span>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      // Navigate to profile
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-text-secondary hover:bg-white/5 hover:text-text-primary transition-colors flex items-center gap-3"
                  >
                    <User className="h-4 w-4" />
                    {t('nav.profile')}
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      // Navigate to settings
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-text-secondary hover:bg-white/5 hover:text-text-primary transition-colors flex items-center gap-3"
                  >
                    <Settings className="h-4 w-4" />
                    {t('nav.settings')}
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-border-primary py-2">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-error hover:bg-error-bg transition-colors flex items-center gap-3"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('auth.logout')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click Outside Handler */}
      {(showUserMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
          }}
        />
      )}
    </header>
  );
}
