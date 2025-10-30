'use client';

import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  FileText, 
  Building2, 
  Calendar, 
  Hash, 
  User, 
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { formatDateTime, formatFileSize, getStatusColor } from '@/lib/utils';
import type { Document } from '@/types';

interface DocumentMetadataProps {
  document: Document;
}

export function DocumentMetadata({ document }: DocumentMetadataProps) {
  const { t } = useTranslation();

  const getStatusVariant = (status: string) => {
    const variants: Record<string, any> = {
      pending: 'pending',
      reviewing: 'reviewing',
      rejected_for_update: 'rejected',
      stored: 'stored',
    };
    return variants[status] || 'default';
  };

  const metadata = [
    {
      icon: <Building2 className="h-5 w-5" />,
      label: t('documents.bureau'),
      value: t(`bureaux.${document.bureau.toLowerCase()}`),
    },
    {
      icon: <FileText className="h-5 w-5" />,
      label: t('documents.registreType'),
      value: t(`registreTypes.${document.registre_type}`),
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      label: t('documents.year'),
      value: document.year,
    },
    {
      icon: <Hash className="h-5 w-5" />,
      label: t('documents.registreNumber'),
      value: document.registre_number,
    },
    {
      icon: <Hash className="h-5 w-5" />,
      label: t('documents.acteNumber'),
      value: document.acte_number,
    },
  ];

  return (
    <Card className="space-y-6">
      {/* Header with Status */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-text-primary mb-2">
            {document.original_filename}
          </h3>
          <p className="text-sm text-text-tertiary">
            {formatFileSize(document.file_size)}
          </p>
        </div>
        <Badge variant={getStatusVariant(document.status)} size="lg">
          {t(`documents.${document.status}`)}
        </Badge>
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-1 gap-4">
        {metadata.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg"
          >
            <div className="text-gold-primary">
              {item.icon}
            </div>
            <div className="flex-1">
              <div className="text-xs text-text-tertiary mb-0.5">
                {item.label}
              </div>
              <div className="text-sm font-semibold text-text-primary">
                {item.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Info */}
      <div className="pt-4 border-t border-border-primary space-y-3">
        <div className="flex items-center gap-3 text-sm">
          <User className="h-4 w-4 text-text-tertiary" />
          <span className="text-text-secondary">
            {t('documents.uploadedBy')}:
          </span>
          <span className="font-semibold text-text-primary">
            {document.uploaded_by_name || document.uploaded_by_username}
          </span>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <Clock className="h-4 w-4 text-text-tertiary" />
          <span className="text-text-secondary">
            {t('documents.uploadedAt')}:
          </span>
          <span className="text-text-primary">
            {formatDateTime(document.uploaded_at)}
          </span>
        </div>

        {/* Review Info */}
        {document.reviewed_by && (
          <>
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 text-text-tertiary" />
              <span className="text-text-secondary">
                {t('documents.reviewedBy')}:
              </span>
              <span className="font-semibold text-text-primary">
                {document.reviewed_by_name || document.reviewed_by_username}
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 text-text-tertiary" />
              <span className="text-text-secondary">
                {t('documents.reviewedAt')}:
              </span>
              <span className="text-text-primary">
                {formatDateTime(document.reviewed_at!)}
              </span>
            </div>
          </>
        )}

        {/* Rejection Info */}
        {document.status === 'rejected_for_update' && document.rejection_reason && (
          <div className="mt-4 p-4 bg-error-bg border border-error/20 rounded-lg">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-error mb-1">
                  {t('review.rejectionReason')}
                </div>
                <div className="text-sm text-text-secondary">
                  <span className="font-semibold">Type:</span> {document.rejection_error_type}
                </div>
                <div className="text-sm text-text-secondary mt-1">
                  {document.rejection_reason}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stored Info */}
        {document.status === 'stored' && document.stored_at && (
          <div className="mt-4 p-4 bg-success-bg border border-success/20 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-success mb-1">
                  Document Stored
                </div>
                <div className="text-sm text-text-secondary">
                  {formatDateTime(document.stored_at)}
                </div>
                {document.virtual_path && (
                  <div className="text-xs text-text-tertiary mt-2 font-mono">
                    {document.virtual_path}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
