'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DocumentViewer } from '@/components/features/DocumentViewer';
import { ActivityLog } from '@/components/features/ActivityLog';
import { useDocuments, useDocument, useStartReview } from '@/hooks/useDocuments';
import { useActivityLogs } from '@/hooks/useActivityLogs';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Search, 
  Clock,
  User,
  Calendar,
  Building2,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  History
} from 'lucide-react';
import { formatRelativeTime, cn } from '@/lib/utils';
import '@/lib/i18n';
import type { Document, DocumentFilters } from '@/types';

type TabType = 'pending' | 'reviewing' | 'processing' | 'stored';

export default function ActsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showActivityLog, setShowActivityLog] = useState(false);
  const router = useRouter();
  const { data: selectedDocument, isLoading: isDocumentLoading } = useDocument(selectedDocumentId);
  const startReview = useStartReview();

  // Fetch documents based on active tab
  const { data, isLoading, error } = useDocuments({
    status: activeTab,
    limit: 50,
  });
  const handleDocumentProcessing = (documentId: number) => {
    router.push(`/dashboard/processing?id=${documentId}`);
  };

  // Fetch activity logs for selected document
  const { data: activityLogsData } = useActivityLogs({
    entity_type: 'document',
    entity_id: selectedDocumentId ?? undefined,
  }, { enabled: showActivityLog && !!selectedDocumentId });

  const documents = data?.documents || [];

  useEffect(() => {
    document.title = `${t('app.name')} - ${t('acts.title')}`;
  }, [t]);

  const handleStartReview = async (doc: Document) => {
    if (doc.status === 'pending') {
      await startReview.mutateAsync(doc.id);
      setSelectedDocumentId(doc.id);
      setShowActivityLog(false);
    } else if (doc.status === 'processing') {
      handleDocumentProcessing(doc.id);
    } else if (doc.status === 'stored') {
      // Navigate to processing page for stored documents
      handleDocumentProcessing(doc.id);
    } else {
      setSelectedDocumentId(doc.id);
      setShowActivityLog(false);
    }
  };

  const handleReviewComplete = () => {
    setSelectedDocumentId(null);
    setShowActivityLog(false);
  };

  const toggleActivityLog = () => {
    setShowActivityLog(!showActivityLog);
  };

  const filteredDocuments = documents.filter((doc: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      doc.acte_number.toLowerCase().includes(query) ||
      doc.registre_number.toLowerCase().includes(query) ||
      doc.bureau.toLowerCase().includes(query) ||
      doc.original_filename.toLowerCase().includes(query)
    );
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'reviewing':
        return <Eye className="w-4 h-4" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4" />;
      case 'stored':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string): 'default' | 'pending' | 'reviewing' | 'rejected' | 'stored' | 'success' | 'error' | 'warning' | 'info' => {
    switch (status) {
      case 'pending':
        return 'pending';
      case 'reviewing':
        return 'reviewing';
      case 'processing':
        return 'info';
      case 'stored':
        return 'stored';
      default:
        return 'default';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {!selectedDocumentId ? (
        // Show Acts Queue
        <div className="flex-1 overflow-auto p-6">
          <Card className="h-full flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-text-primary">
                    {t('acts.title')}
                  </h2>
                  <p className="text-sm text-text-secondary mt-1">
                    {filteredDocuments.length} {t('acts.documentsCount')}
                  </p>
                </div>

                {/* Tab Filters */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={activeTab === 'pending' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('pending')}
                    className="gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    {t('documents.pending')}
                  </Button>
                  <Button
                    variant={activeTab === 'reviewing' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('reviewing')}
                    className="gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    {t('documents.reviewing')}
                  </Button>
                  <Button
                    variant={activeTab === 'processing' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('processing')}
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {t('documents.processing')}
                  </Button>
                  <Button
                    variant={activeTab === 'stored' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('stored')}
                    className="gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {t('documents.stored')}
                  </Button>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
                <Input
                  placeholder={t('common.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Documents List */}
            <div className="flex-1 overflow-auto p-6">
              {isLoading && (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-gold-primary" />
                </div>
              )}

              {error && (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-error mx-auto mb-4" />
                    <p className="text-text-secondary">{t('common.error')}</p>
                  </div>
                </div>
              )}

              {!isLoading && !error && filteredDocuments.length === 0 && (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <FileText className="h-12 w-12 text-text-secondary mx-auto mb-4" />
                    <p className="text-text-secondary">{t('documents.noDocuments')}</p>
                  </div>
                </div>
              )}

              {!isLoading && !error && filteredDocuments.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDocuments.map((doc: any) => (
                    <Card
                      key={doc.id}
                      className="p-4 hover:shadow-md transition-shadow cursor-pointer border border-border hover:border-gold-primary"
                      onClick={() => handleStartReview(doc)}
                    >
                      {/* Status Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant={getStatusColor(doc.status)} className="gap-1">
                          {getStatusIcon(doc.status)}
                          {t(`status.${doc.status}`)}
                        </Badge>
                        <span className="text-xs text-text-secondary">
                          {doc.year}
                        </span>
                      </div>

                      {/* Document Info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="w-4 h-4 text-text-secondary flex-shrink-0" />
                          <span className="text-text-primary font-medium truncate">
                            {doc.acte_number}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className="w-4 h-4 text-text-secondary flex-shrink-0" />
                          <span className="text-text-secondary truncate">
                            {doc.bureau}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-text-secondary flex-shrink-0" />
                          <span className="text-text-secondary truncate">
                            {doc.uploaded_by_username || t('common.unknown')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-text-secondary flex-shrink-0" />
                          <span className="text-text-secondary">
                            {formatRelativeTime(new Date(doc.uploaded_at))}
                          </span>
                        </div>
                      </div>

                      {/* Type Badge */}
                      <div className="mt-3 pt-3 border-t border-border">
                        <span className="text-xs px-2 py-1 bg-bg-primary rounded text-text-secondary">
                          {t(`documents.types.${doc.registre_type}`)}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      ) : (
        // Show Document Viewer with Activity Log
        <div className="flex-1 overflow-auto p-6">
          {isDocumentLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="inline-block animate-spin h-12 w-12 text-gold-primary mb-4" />
                <p className="text-text-secondary">{t('common.loading')}</p>
              </div>
            </div>
          )}

          {!isDocumentLoading && !selectedDocument && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-error mx-auto mb-4" />
                <p className="text-text-secondary">{t('documents.noDocuments')}</p>
              </div>
            </div>
          )}

          {!isDocumentLoading && selectedDocument && (
            <div className="h-full flex flex-col lg:flex-row gap-4">
              {/* Document Viewer */}
              <div className={cn("flex flex-col", showActivityLog ? "lg:w-2/3" : "w-full")}>
                {/* Back Button + Activity Log Toggle */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setSelectedDocumentId(null)}
                    className="flex items-center gap-2 text-text-secondary hover:text-gold-primary transition-colors"
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

                  <Button
                    variant={showActivityLog ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={toggleActivityLog}
                    className="gap-2"
                  >
                    <History className="w-4 h-4" />
                    {t('acts.activityLog')}
                  </Button>
                </div>

                {/* Document Viewer */}
                <div className="flex-1">
                  <DocumentViewer 
                    doc={selectedDocument}
                    onReviewComplete={handleReviewComplete}
                  />
                </div>
              </div>

              {/* Activity Log Panel */}
              {showActivityLog && (
                <div className="lg:w-1/3">
                  <ActivityLog 
                    documentId={selectedDocumentId}
                    logs={(activityLogsData as any)?.logs || []}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}