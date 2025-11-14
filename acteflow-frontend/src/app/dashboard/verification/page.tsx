'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  useUploadVerification,
  useVerificationBatches,
  useVerificationComparison,
  useDeleteVerificationBatch,
} from '@/hooks/useVerification';
import { 
  Upload, 
  Trash2, 
  FileSpreadsheet, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import '@/lib/i18n';

export default function VerificationPage() {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  const uploadMutation = useUploadVerification();
  const { data: batchesData, isLoading: batchesLoading } = useVerificationBatches();
  const { data: comparisonData, isLoading: comparisonLoading } = useVerificationComparison(selectedBatchId);
  const deleteMutation = useDeleteVerificationBatch();

  const batches = batchesData?.data || [];
  const comparison = comparisonData?.data?.comparison || [];
  const summary = comparisonData?.data?.summary || null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      await uploadMutation.mutateAsync(selectedFile);
      toast.success(t('verification.uploadSuccess'));
      setSelectedFile(null);
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(t('verification.uploadError'));
    }
  };

  const handleDelete = async (batchId: string) => {
    if (!confirm(t('verification.deleteConfirm'))) return;

    try {
      await deleteMutation.mutateAsync(batchId);
      toast.success(t('verification.deleteSuccess'));
      if (selectedBatchId === batchId) {
        setSelectedBatchId(null);
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(t('verification.deleteError'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'matched': return 'success';
      case 'missing': return 'warning';
      case 'extra': return 'info';
      default: return 'default';
    }
  };

  if (selectedBatchId && comparisonData) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedBatchId(null)}
              icon={<ArrowLeft className="h-4 w-4" />}
            >
              {t('common.back')}
            </Button>
          </div>

          <h2 className="text-2xl font-bold text-text-primary mb-6">
            {t('verification.comparisonTitle')}
          </h2>

          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <Card className="p-4">
                <div className="text-text-secondary text-sm">{t('verification.summary.total')}</div>
                <div className="text-2xl font-bold text-text-primary">{summary.total}</div>
              </Card>
              <Card className="p-4 bg-success/10">
                <div className="text-text-secondary text-sm">{t('verification.summary.matched')}</div>
                <div className="text-2xl font-bold text-success">{summary.matched}</div>
              </Card>
              <Card className="p-4 bg-warning/10">
                <div className="text-text-secondary text-sm">{t('verification.summary.missing')}</div>
                <div className="text-2xl font-bold text-warning">{summary.missing}</div>
              </Card>
              <Card className="p-4 bg-info/10">
                <div className="text-text-secondary text-sm">{t('verification.summary.extra')}</div>
                <div className="text-2xl font-bold text-info">{summary.extra}</div>
              </Card>
              <Card className="p-4">
                <div className="text-text-secondary text-sm">{t('verification.summary.matchRate')}</div>
                <div className="text-2xl font-bold text-text-primary">{summary.matchRate}%</div>
              </Card>
            </div>
          )}

          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg-secondary">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-text-primary">
                    {t('verification.table.bureau')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-text-primary">
                    {t('verification.table.type')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-text-primary">
                    {t('verification.table.year')}
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-text-primary">
                    {t('verification.table.expected')}
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-text-primary">
                    {t('verification.table.actual')}
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-text-primary">
                    {t('verification.table.difference')}
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-text-primary">
                    {t('verification.table.status')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary">
                {comparison.map((row: any, index: number) => (
                  <tr key={index} className="hover:bg-bg-secondary">
                    <td className="px-4 py-3 text-sm text-text-primary">{row.bec}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{row.type}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{row.year}</td>
                    <td className="px-4 py-3 text-sm text-text-primary text-center">{row.expected}</td>
                    <td className="px-4 py-3 text-sm text-text-primary text-center font-medium">{row.actual}</td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className={row.difference === 0 ? 'text-success' : row.difference < 0 ? 'text-warning' : 'text-info'}>
                        {row.difference > 0 ? '+' : ''}{row.difference}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={getStatusColor(row.status)}>
                        {t(`verification.status.${row.status}`)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-text-primary mb-6">
          {t('verification.title')}
        </h2>
        <p className="text-text-secondary mb-6">
          {t('verification.subtitle')}
        </p>

        {/* Upload Section */}
        <Card className="p-6 mb-6 bg-bg-secondary">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            {t('verification.uploadTitle')}
          </h3>
          
          <div className="space-y-4">
            <div>
              <Button
                variant="secondary"
                icon={<FileSpreadsheet className="h-4 w-4" />}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                {t('verification.selectFile')}
              </Button>

              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              {selectedFile && (
                <span className="ml-4 text-sm text-text-primary">
                  {selectedFile.name}
                </span>
              )}
            </div>

            {selectedFile && (
              <Button
                variant="primary"
                onClick={handleUpload}
                isLoading={uploadMutation.isPending}
                icon={<Upload className="h-4 w-4" />}
              >
                {t('verification.upload')}
              </Button>
            )}
          </div>
        </Card>

        {/* Batches List */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            {t('verification.uploadedBatches')}
          </h3>

          {batchesLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gold-primary" />
            </div>
          )}

          {!batchesLoading && batches.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-border-primary rounded-lg">
              <FileSpreadsheet className="h-12 w-12 text-text-secondary mx-auto mb-4" />
              <p className="text-text-secondary">{t('verification.noBatches')}</p>
            </div>
          )}

          {!batchesLoading && batches.length > 0 && (
            <div className="space-y-3">
              {batches.map((batch: any) => (
                <Card key={batch.batch_id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileSpreadsheet className="h-5 w-5 text-gold-primary" />
                        <span className="font-medium text-text-primary">
                          {t('verification.batch')} - {new Date(batch.uploaded_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm text-text-secondary">
                        {batch.record_count} {t('verification.records')} • {batch.uploaded_by_name || batch.uploaded_by_username}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setSelectedBatchId(batch.batch_id)}
                      >
                        {t('verification.compare')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(batch.batch_id)}
                        icon={<Trash2 className="h-4 w-4 text-error" />}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
