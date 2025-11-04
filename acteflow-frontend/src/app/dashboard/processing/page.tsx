'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DynamicFieldForm } from '@/components/features/DynamicFieldForm';
import { useDocument, useDocumentFields, useOcrDocument } from '@/hooks/useDocuments';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  Loader2,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import '@/lib/i18n';

export default function ProcessingPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const documentId = searchParams.get('id');
  
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const { data: document, isLoading: docLoading } = useDocument(documentId ? parseInt(documentId) : null);
  const { data: fieldsData, refetch: refetchFields } = useDocumentFields(documentId ? parseInt(documentId) : null);
  const ocrMutation = useOcrDocument();

  // Fetch PDF with authentication
  useEffect(() => {
    if (!documentId) return;

    const fetchPdf = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/documents/${documentId}/file`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setPdfBlobUrl(url);
          setLoading(false);
        } else {
          console.error('Failed to fetch PDF:', response.statusText);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching PDF:', error);
        setLoading(false);
      }
    };

    fetchPdf();

    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [documentId]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleOcr = async () => {
    if (!documentId) return;
    
    try {
      const result = await ocrMutation.mutateAsync(parseInt(documentId));
      await refetchFields();
    } catch (error) {
      console.error('OCR error:', error);
    }
  };

  const handleBack = () => {
    window.close();
  };

  if (!documentId) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
        <Card className="text-center">
          <p className="text-text-secondary">{t('errors.notFound')}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen bg-bg-primary flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <div className="bg-bg-secondary border-b border-border-primary p-4 flex-shrink-0">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              icon={<ArrowLeft className="h-4 w-4" />}
            >
              {t('common.back')}
            </Button>
            
            <div className="h-8 w-px bg-border-primary" />
            
            <div>
              <h1 className="text-lg font-bold text-text-primary">
                {t('documents.processing')}
              </h1>
              {document && (
                <p className="text-sm text-text-tertiary">
                  {document.original_filename}
                </p>
              )}
            </div>
          </div>

          {document && (
            (() => {
              type BadgeVariant = 'default' | 'pending' | 'reviewing' | 'rejected' | 'stored' | 'success' | 'error' | 'warning' | 'info';
              const variantMap: Record<string, BadgeVariant> = {
                stored: 'stored',
                processing: 'reviewing',
                pending: 'reviewing',
                reviewing: 'reviewing',
                fields_extracted: 'success',
              };
              const badgeVariant: BadgeVariant = variantMap[document.status] ?? 'success';
              return (
                <Badge variant={badgeVariant}>
                  {t(`documents.${document.status}`)}
                </Badge>
              );
            })()
          )}
        </div>
      </div>

      {/* Main Content - Two independently scrollable columns */}
      <div className="flex-1 overflow-hidden p-4">
        <div className="h-full flex gap-4">
          {/* PDF Viewer - Left Side - 60% width, ENTIRE COLUMN scrollable */}
          <div className="w-[60%] bg-bg-secondary rounded-xl border border-border-primary flex flex-col overflow-hidden">
            {/* PDF Toolbar - Fixed at top of column */}
            <div className="flex items-center justify-between p-4 border-b border-border-primary flex-shrink-0">
              <h3 className="text-lg font-semibold text-text-primary">
                {t('documents.preview')}
              </h3>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                  title={t('common.zoomOut')}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                
                <span className="text-sm text-text-secondary px-2 min-w-[60px] text-center">
                  {zoom}%
                </span>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoom >= 200}
                  title={t('common.zoomIn')}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>

                <div className="h-6 w-px bg-border-primary mx-2" />
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRotate}
                  title={t('common.rotate')}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* PDF Content - THIS ENTIRE AREA SCROLLS */}
            <div className="flex-1 overflow-y-auto bg-bg-tertiary p-4">
              {loading && (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="h-12 w-12 text-gold-primary animate-spin mx-auto mb-4" />
                    <p className="text-text-secondary">{t('common.loading')}</p>
                  </div>
                </div>
              )}
              
              {!loading && pdfBlobUrl && (
                <iframe
                  src={`${pdfBlobUrl}#toolbar=0`}
                  className="w-full h-full min-h-[1000px] border border-border-primary rounded-lg shadow-lg bg-white"
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    transformOrigin: 'top center',
                  }}
                  title={document?.original_filename}
                />
              )}

              {!loading && !pdfBlobUrl && (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-text-secondary">{t('errors.generic')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Column - Right Side - 40% width, ENTIRE COLUMN scrollable */}
          <div className="w-[40%] bg-bg-secondary rounded-xl border border-border-primary flex flex-col overflow-hidden">
            {/* Form Header - Fixed at top of column */}
            <div className="p-4 border-b border-border-primary flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary">
                  {t('documents.extractedFields')}
                </h3>
                
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleOcr}
                  isLoading={ocrMutation.isPending}
                  icon={<Sparkles className="h-4 w-4" />}
                  disabled={!document || String(document.status) === 'fields_extracted'}
                >
                  {t('documents.ocr')}
                </Button>
              </div>

              {ocrMutation.isPending && (
                <div className="flex items-center gap-2 text-sm text-info-light">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t('documents.ocrProcessing')}</span>
                </div>
              )}
            </div>

            {/* Form Content - THIS ENTIRE AREA SCROLLS (fields only) */}
            <div className="flex-1 overflow-y-auto p-4">
              {document && documentId && (
                <DynamicFieldForm
                  documentId={parseInt(documentId)}
                  documentType={document.registre_type}
                  initialFields={fieldsData?.fieldsObject || {}}
                  onSuccess={refetchFields}
                />
              )}

              {!document && !docLoading && (
                <div className="text-center py-12">
                  <p className="text-text-secondary">{t('documents.noDocuments')}</p>
                </div>
              )}
            </div>

            {/* Form Buttons - Fixed at bottom of column */}
            <div className="p-4 border-t border-border-primary flex-shrink-0 bg-bg-secondary">
              {/* Pass buttons as render prop or use context - for now we'll move this logic */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}