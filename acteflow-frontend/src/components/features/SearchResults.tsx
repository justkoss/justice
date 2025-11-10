'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Calendar,
  User,
  Building2,
  Hash,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchResult } from '@/hooks/useSearch';
import {Badge} from '@/components/ui/Badge';
import { format } from 'date-fns';

interface SearchResultsProps {
  results: SearchResult[];
  isLoading?: boolean;
  searchQuery?: string;
  onResultClick?: (documentId: number) => void;
}

export default function SearchResults({
  results,
  isLoading = false,
  searchQuery,
  onResultClick,
}: SearchResultsProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string }> = {
      pending: { variant: 'warning', label: t('status.pending') },
      reviewing: { variant: 'info', label: t('status.reviewing') },
      rejected_for_update: { variant: 'danger', label: t('status.rejected') },
      stored: { variant: 'success', label: t('status.stored') },
    };
    return statusMap[status] || { variant: 'default', label: status };
  };

  const highlightText = (text: string, query?: string) => {
    if (!query || !text) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-gold-primary/30 text-text-primary font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const handleResultClick = (result: SearchResult) => {
    if (onResultClick) {
      onResultClick(result.id);
    } else {
      router.push(`/dashboard/documents/${result.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-gold-primary" />
        <p className="text-text-secondary">{t('search.searching')}</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <FileText className="h-16 w-16 text-text-secondary opacity-50" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            {t('search.noResults')}
          </h3>
          <p className="text-text-secondary">
            {t('search.tryDifferentKeywords')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {results.map((result) => {
        const statusBadge = getStatusBadge(result.status);

        return (
          <button
            key={result.id}
            onClick={() => handleResultClick(result)}
            className={cn(
              'w-full p-4 rounded-lg border border-border',
              'bg-bg-secondary hover:bg-bg-tertiary',
              'transition-all duration-200',
              'text-left group'
            )}
          >
            <div className="flex items-start justify-between gap-4">
              {/* Left Content */}
              <div className="flex-1 space-y-3">
                {/* Title and Badge */}
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-gold-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-primary group-hover:text-gold-primary transition-colors">
                      {highlightText(result.original_filename, searchQuery)}
                    </h3>
                    <div className="mt-2">
                      <Badge variant={statusBadge.variant}>
                        {statusBadge.label}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Document Metadata */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Building2 className="h-4 w-4" />
                    <span>{highlightText(result.bureau, searchQuery)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary">
                    <FileText className="h-4 w-4" />
                    <span>{t(`registreTypes.${result.registre_type}`)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Calendar className="h-4 w-4" />
                    <span>{result.year}</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Hash className="h-4 w-4" />
                    <span>{highlightText(result.acte_number, searchQuery)}</span>
                  </div>
                </div>

                {/* User Information */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    <span>
                      {t('search.uploadedBy')}:{' '}
                      <span className="text-text-primary font-medium">
                        {highlightText(
                          result.uploaded_by_name || result.uploaded_by_username,
                          searchQuery
                        )}
                      </span>
                    </span>
                  </div>
                  {result.reviewed_by_username && (
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      <span>
                        {t('search.reviewedBy')}:{' '}
                        <span className="text-text-primary font-medium">
                          {highlightText(
                            result.reviewed_by_name || result.reviewed_by_username,
                            searchQuery
                          )}
                        </span>
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {format(new Date(result.uploaded_at), 'dd/MM/yyyy HH:mm')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Arrow */}
              <ChevronRight className="h-5 w-5 text-text-secondary group-hover:text-gold-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
