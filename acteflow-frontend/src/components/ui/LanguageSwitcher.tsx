'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export function LanguageSwitcher() {
  const { language, toggleLanguage } = useUIStore();
  const { i18n } = useTranslation();

  useEffect(() => {
    // Sync i18n with store
    console.log('i18n test:', typeof i18n.changeLanguage);
    i18n.changeLanguage(language);
    
    // Update HTML attributes
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    
    // Update body class for font
    if (language === 'ar') {
      document.body.classList.add('font-arabic');
    } else {
      document.body.classList.remove('font-arabic');
    }
  }, [language, i18n]);

  return (
    <button
      onClick={toggleLanguage}
      className={cn(
        'flex items-center gap-2 px-4 py-2',
        'bg-white/10 hover:bg-white/15',
        'border border-white/20 hover:border-gold-primary',
        'rounded-lg transition-all duration-200',
        'text-gold-primary font-semibold',
        'focus:outline-none focus:ring-2 focus:ring-gold-primary/50'
      )}
      title="Switch Language / تبديل اللغة"
    >
      <Globe className="h-5 w-5" />
      <span className="text-sm uppercase tracking-wide">
        {language}
      </span>
    </button>
  );
}
