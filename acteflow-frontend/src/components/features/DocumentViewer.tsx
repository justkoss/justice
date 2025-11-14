'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DocumentMetadata } from './DocumentMetadata';
import { ReviewActions } from './ReviewActions';
import { 
  ZoomIn, 
  ZoomOut, 
  Download,
  Maximize2,
  Loader2
} from 'lucide-react';
import type { Document } from '@/types';

interface DocumentViewerProps {
  doc: Document;
  onReviewComplete?: () => void;
}

export function DocumentViewer({ doc, onReviewComplete }: DocumentViewerProps) {
  const { t } = useTranslation();
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [imageBlobUrl, setImageBlobUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Fetch image with authentication
  useEffect(() => {
    const fetchImage = async () => {
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
          setImageBlobUrl(url);
          setLoading(false);
        } else {
          console.error('Failed to fetch image:', response.statusText);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching image:', error);
        setLoading(false);
      }
    };

    fetchImage();

    // Cleanup blob URL on unmount
    return () => {
      if (imageBlobUrl) {
        URL.revokeObjectURL(imageBlobUrl);
      }
    };
  }, [doc.id]);

  // Reset zoom and position when document changes
  useEffect(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [doc.id]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleFitScreen = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((prev) => Math.min(prev + 0.1, 3));
    } else {
      setZoom((prev) => Math.max(prev - 0.1, 0.5));
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
      {/* Image Viewer */}
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
                disabled={zoom <= 0.5}
                title={t('common.zoomOut')}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <span className="text-sm text-text-secondary px-2">
                {Math.round(zoom * 100)}%
              </span>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                title={t('common.zoomIn')}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>

              <div className="h-6 w-px bg-border-primary mx-2" />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFitScreen}
                title="Fit to screen"
              >
                <Maximize2 className="h-4 w-4" />
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

          {/* Image Container */}
          <div 
            ref={containerRef}
            className="flex-1 overflow-hidden bg-bg-tertiary relative"
            onWheel={handleWheel}
          >
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 text-gold-primary animate-spin mx-auto mb-4" />
                  <p className="text-text-secondary">{t('common.loading')}</p>
                </div>
              </div>
            )}
            
            {!loading && imageBlobUrl && (
              <div 
                className="w-full h-full flex items-center justify-center p-8"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ 
                  cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                }}
              >
                <img
                  ref={imageRef}
                  src={imageBlobUrl}
                  alt={doc.original_filename}
                  className="max-w-full max-h-full object-contain select-none"
                  style={{
                    transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                    transition: isDragging ? 'none' : 'transform 0.1s ease',
                  }}
                  draggable={false}
                />
              </div>
            )}

            {!loading && !imageBlobUrl && (
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