'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TreeView } from '@/components/features/TreeView';
import '@/lib/i18n';

export default function TreePage() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = `${t('app.name')} - ${t('nav.tree')}`;
  }, [t]);

  return (
    <div className="h-full overflow-hidden p-6">
      <TreeView />
    </div>
  );
}
