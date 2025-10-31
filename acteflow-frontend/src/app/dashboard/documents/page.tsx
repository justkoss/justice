'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Upload, Filter } from 'lucide-react';
import '@/lib/i18n';

export default function DocumentsPage() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = `${t('app.name')} - ${t('nav.documents')}`;
  }, [t]);

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              {t('documents.title')}
            </h1>
            <p className="text-text-secondary">
              View and manage all documents in the system
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/10 text-text-primary border border-white/20 rounded-lg hover:bg-white/15 hover:border-gold-primary transition-colors">
              <Filter className="h-5 w-5" />
              {t('common.filter')}
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-gold-primary to-gold-hover text-bg-primary rounded-lg font-semibold shadow-gold hover:shadow-gold-lg transition-all">
              <Upload className="h-5 w-5" />
              {t('documents.upload')}
            </button>
          </div>
        </div>

        {/* Coming Soon Card */}
        <div className="bg-bg-secondary border border-border-primary rounded-2xl p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gold-primary/10 rounded-2xl mb-6">
            <FileText className="h-10 w-10 text-gold-primary" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-4">
            {t('documents.title')} Interface
          </h2>
          <p className="text-text-secondary max-w-md mx-auto mb-6">
            Document management interface with list view, filtering, search, and detailed document viewer coming in Phase 2.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-text-tertiary">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-success rounded-full"></div>
              Backend Ready
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-warning rounded-full"></div>
              UI Pending
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
