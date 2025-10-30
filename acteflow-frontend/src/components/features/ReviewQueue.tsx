'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useDocuments, useStartReview } from '@/hooks/useDocuments';
import { 
  FileText, 
  Search, 
  Filter,
  Clock,
  User,
  Calendar,
  Building2,
  Eye,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Document, DocumentFilters } from '@/types';

interface ReviewQueueProps {
  onSelectDocument: (document: Document) => void;
  selectedDocumentId?: number | null;
}

export function ReviewQueue({ onSelectDocument, selectedDocumentId }: ReviewQueueProps) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<DocumentFilters>({
    status: 'pending',
    limit: 50,
  });
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error } = useDocuments(filters);
  const startReview = useStartReview();

  const documents = data?.documents || [];

  const handleStartReview = async (doc: Document) => {
    if (doc.status === 'pending') {
      await startReview.mutateAsync(doc.id);
    }
    onSelectDocument(doc);
  };

  const filteredDocuments = documents.filter((doc:any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      doc.acte_number.toLowerCase().includes(query) ||
      doc.registre_number.toLowerCase().includes(query) ||
      doc.bureau.toLowerCase().includes(query) ||
      doc.original_filename.toLowerCase().includes(query)
    );
  });

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border-primary">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">
              {t('review.title')}
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              {filteredDocuments.length} {t('documents.pending')}
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2">
            <Button
              variant={filters.status === 'pending' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilters({ ...filters, status: 'pending' })}
            >
              {t('documents.pending')}
            </Button>
            <Button
              variant={filters.status === 'reviewing' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilters({ ...filters, status: 'reviewing' })}
            >
              {t('documents.reviewing')}
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Input
            placeholder={t('common.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="h-5 w-5" />}
          />
        </div>
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-gold-primary animate-spin mx-auto mb-4" />
              <p className="text-text-secondary">{t('common.loading')}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-full p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-error mx-auto mb-4" />
              <p className="text-text-secondary">{t('errors.generic')}</p>
            </div>
          </div>
        )}

        {!isLoading && !error && filteredDocuments.length === 0 && (
          <div className="flex items-center justify-center h-full p-6">
            <div className="text-center">
              <FileText className="h-12 w-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary">{t('documents.noDocuments')}</p>
            </div>
          </div>
        )}

        {!isLoading && !error && filteredDocuments.length > 0 && (
          <div className="divide-y divide-border-primary">
            {filteredDocuments.map((doc:any) => (
              <button
                key={doc.id}
                onClick={() => handleStartReview(doc)}
                className={cn(
                  'w-full p-4 text-left hover:bg-bg-hover transition-colors',
                  selectedDocumentId === doc.id && 'bg-gold-primary/10 border-l-4 border-gold-primary'
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-gold-primary/10 rounded-lg flex items-center justify-center">
                      <FileText className="h-6 w-6 text-gold-primary" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-text-primary mb-1">
                          {doc.original_filename}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-text-tertiary">
                          <Building2 className="h-4 w-4" />
                          <span>{t(`bureaux.${doc.bureau.toLowerCase()}`)}</span>
                          <span>•</span>
                          <span>{doc.year}</span>
                        </div>
                      </div>
                      <Badge 
                        variant={doc.status === 'pending' ? 'pending' : 'reviewing'}
                        size="sm"
                      >
                        {t(`documents.${doc.status}`)}
                      </Badge>
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="text-sm">
                        <span className="text-text-tertiary">{t('documents.registreNumber')}:</span>{' '}
                        <span className="font-semibold text-text-primary">{doc.registre_number}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-text-tertiary">{t('documents.acteNumber')}:</span>{' '}
                        <span className="font-semibold text-text-primary">{doc.acte_number}</span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center gap-4 text-xs text-text-muted">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{doc.uploaded_by_name || doc.uploaded_by_username}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatRelativeTime(doc.uploaded_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* View Button */}
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
                      <Eye className="h-5 w-5 text-gold-primary" />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
