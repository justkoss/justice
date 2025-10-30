'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DocumentMetadata } from './DocumentMetadata';
import { ReviewActions } from './ReviewActions';
import { 
  ZoomIn, 
  ZoomOut, 
  Download,
  RotateCw,
  Loader2
} from 'lucide-react';
import type { Document } from '@/types';

interface DocumentViewerProps {
  doc: Document;
  onReviewComplete?: () => void;
}

export function DocumentViewer({ doc, onReviewComplete }: DocumentViewerProps) {
  const { t } = useTranslation();
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  // Fetch PDF with authentication
  useEffect(() => {
    const fetchPdf = async () => {
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

    // Cleanup blob URL on unmount
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [doc.id]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleDownload = async () => {
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
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
      {/* PDF Viewer */}
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="flex items-center justify-between p-4 border-b border-border-primary">
            <h3 className="text-lg font-semibold text-text-primary">
              {t('documents.view')}
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
              
              <span className="text-sm text-text-secondary px-2">
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

              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                title={t('documents.download')}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* PDF Container */}
          <div className="flex-1 overflow-auto bg-bg-tertiary relative">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 text-gold-primary animate-spin mx-auto mb-4" />
                  <p className="text-text-secondary">{t('common.loading')}</p>
                </div>
              </div>
            )}
            
            {!loading && pdfBlobUrl && (
              <div className="p-8 flex items-center justify-center min-h-full">
                <iframe
                  src={`${pdfBlobUrl}#toolbar=0`}
                  className="w-full h-full min-h-[600px] border border-border-primary rounded-lg shadow-lg"
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    transformOrigin: 'center center',
                  }}
                  title={doc.original_filename}
                />
              </div>
            )}

            {!loading && !pdfBlobUrl && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-text-secondary">{t('errors.generic')}</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Sidebar - Metadata & Actions */}
      <div className="lg:w-96 space-y-6">
        {/* Document Metadata */}
        <DocumentMetadata document={doc} />

        {/* Review Actions */}
        {(doc.status === 'pending' || doc.status === 'reviewing') && (
          <Card>
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              {t('review.reviewDocument')}
            </h3>
            <ReviewActions 
              document={doc} 
              onSuccess={onReviewComplete}
            />
          </Card>
        )}
      </div>
    </div>
  );
}