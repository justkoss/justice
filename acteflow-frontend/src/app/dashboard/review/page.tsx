'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ReviewQueue } from '@/components/features/ReviewQueue';
import { DocumentViewer } from '@/components/features/DocumentViewer';
import { useDocument } from '@/hooks/useDocuments';
import { FileText, AlertCircle } from 'lucide-react';
import '@/lib/i18n';
import type { Document } from '@/types';

export default function ReviewPage() {
  const { t } = useTranslation();
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  
  const { data: selectedDocument, isLoading } = useDocument(selectedDocumentId);

  useEffect(() => {
    document.title = `${t('app.name')} - ${t('review.title')}`;
  }, [t]);

  const handleSelectDocument = (document: Document) => {
    setSelectedDocumentId(document.id);
  };

  const handleReviewComplete = () => {
    // Clear selection after review to go back to queue
    setSelectedDocumentId(null);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto p-6">
        {!selectedDocumentId ? (
          // Show Review Queue
          <ReviewQueue 
            onSelectDocument={handleSelectDocument}
            selectedDocumentId={selectedDocumentId}
          />
        ) : (
          // Show Document Viewer
          <div className="h-full">
            {isLoading && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gold-primary border-t-transparent mb-4"></div>
                  <p className="text-text-secondary">{t('common.loading')}</p>
                </div>
              </div>
            )}

            {!isLoading && !selectedDocument && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-error mx-auto mb-4" />
                  <p className="text-text-secondary">{t('documents.noDocuments')}</p>
                </div>
              </div>
            )}

            {!isLoading && selectedDocument && (
              <>
                {/* Back Button */}
                <button
                  onClick={() => setSelectedDocumentId(null)}
                  className="mb-4 flex items-center gap-2 text-text-secondary hover:text-gold-primary transition-colors"
                >
                  <svg 
                    className="h-5 w-5" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M15 19l-7-7 7-7" 
                    />
                  </svg>
                  {t('common.back')}
                </button>

                {/* Document Viewer */}
                <div className="h-[calc(100%-3rem)]">
                  <DocumentViewer 
                    doc={selectedDocument}
                    onReviewComplete={handleReviewComplete}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}