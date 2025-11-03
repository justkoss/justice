'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DocumentTree } from './DocumentTree';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useTree, useTreeDocuments } from '@/hooks/useTree';
import {
  FileText,
  Download,
  Eye,
  Loader2,
  AlertCircle,
  Folder,
  Calendar,
  Hash,
} from 'lucide-react';
import { formatDateTime, formatFileSize } from '@/lib/utils';
import type { Document } from '@/types';

export function TreeView() {
  const { t } = useTranslation();
  const [selectedPath, setSelectedPath] = useState<{
    bureau?: string;
    registreType?: string;
    year?: number;
    registreNumber?: string;
  }>({});

  // Fetch tree data
  const { data: treeData, isLoading: treeLoading, error: treeError } = useTree({
    status: 'stored',
  });

  // Fetch documents for selected path
  const {
    data: documents,
    isLoading: documentsLoading,
    error: documentsError,
  } = useTreeDocuments(selectedPath);

  const handleSelectPath = (path: typeof selectedPath) => {
    setSelectedPath(path);
  };

  const handleViewDocument = (doc: Document) => {
    // Open document in new tab or modal
    window.open(`/dashboard/review/${doc.id}`, '_blank');
  };

  const handleDownloadDocument = async (doc: Document) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/documents/${doc.id}/file`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.original_filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  return (
    <div className="h-full flex gap-6">
      {/* Tree Panel - Left Side */}
      <div className="w-96 flex-shrink-0">
        {treeLoading && (
          <Card className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-gold-primary animate-spin mx-auto mb-4" />
              <p className="text-text-secondary">{t('common.loading')}</p>
            </div>
          </Card>
        )}

        {treeError && (
          <Card className="flex items-center justify-center h-full">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-error mx-auto mb-4" />
              <p className="text-text-secondary">{t('errors.generic')}</p>
            </div>
          </Card>
        )}

        {!treeLoading && !treeError && treeData && (
          <DocumentTree
            data={treeData}
            onSelectPath={handleSelectPath}
            selectedPath={selectedPath}
          />
        )}
      </div>

      {/* Document List Panel - Right Side */}
      <div className="flex-1">
        <Card className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-border-primary">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-text-primary">
                {t('documents.title')}
              </h2>
              {documents && documents.length > 0 && (
                <Badge variant="default" size="lg">
                  {documents.length}
                </Badge>
              )}
            </div>

            {/* Selected Path Breadcrumb */}
            {selectedPath.bureau && (
              <div className="flex items-center gap-2 text-sm text-text-secondary flex-wrap">
                <Folder className="h-4 w-4 text-gold-primary" />
                <span className="font-semibold text-text-primary">
                  {t(`bureaux.${selectedPath.bureau.toLowerCase()}`)}
                </span>
                {selectedPath.registreType && (
                  <>
                    <span>/</span>
                    <span className="font-semibold text-text-primary">
                      {t(`registreTypes.${selectedPath.registreType}`)}
                    </span>
                  </>
                )}
                {selectedPath.year && (
                  <>
                    <span>/</span>
                    <Calendar className="h-4 w-4" />
                    <span className="font-semibold text-text-primary">
                      {selectedPath.year}
                    </span>
                  </>
                )}
                {selectedPath.registreNumber && (
                  <>
                    <span>/</span>
                    <Hash className="h-4 w-4" />
                    <span className="font-semibold text-text-primary">
                      {selectedPath.registreNumber}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Document List */}
          <div className="flex-1 overflow-y-auto p-6">
            {!selectedPath.bureau && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FileText className="h-16 w-16 text-text-muted mx-auto mb-4" />
                  <p className="text-text-secondary text-lg">
                    {t('documents.selectDocument')}
                  </p>
                  <p className="text-text-muted text-sm mt-2">
                    Select a folder from the tree to view documents
                  </p>
                </div>
              </div>
            )}

            {selectedPath.bureau && documentsLoading && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 text-gold-primary animate-spin mx-auto mb-4" />
                  <p className="text-text-secondary">{t('common.loading')}</p>
                </div>
              </div>
            )}

            {selectedPath.bureau && documentsError && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-error mx-auto mb-4" />
                  <p className="text-text-secondary">{t('errors.generic')}</p>
                </div>
              </div>
            )}

            {selectedPath.bureau &&
              !documentsLoading &&
              !documentsError &&
              documents &&
              documents.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FileText className="h-12 w-12 text-text-muted mx-auto mb-4" />
                    <p className="text-text-secondary">{t('documents.noDocuments')}</p>
                  </div>
                </div>
              )}

            {selectedPath.bureau &&
              !documentsLoading &&
              !documentsError &&
              documents &&
              documents.length > 0 && (
                <div className="grid grid-cols-1 gap-4">
                  {documents.map((doc: any) => (
                    <Card
                      key={doc.id}
                      variant="bordered"
                      className="hover:border-gold-primary/50 transition-all"
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
                          <h3 className="font-semibold text-text-primary mb-1">
                            {doc.original_filename}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-text-tertiary mb-2">
                            <span>{formatFileSize(doc.file_size)}</span>
                            <span>•</span>
                            <span>{formatDateTime(doc.stored_at || doc.uploaded_at)}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="default" size="sm">
                              {doc.acte_number}
                            </Badge>
                            <Badge variant="stored" size="sm">
                              {t('documents.stored')}
                            </Badge>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDocument(doc)}
                            title={t('documents.view')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadDocument(doc)}
                            title={t('documents.download')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
          </div>
        </Card>
      </div>
    </div>
  );
}
