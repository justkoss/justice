'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import { 
  Upload, 
  FileSpreadsheet, 
  Trash2,
  TreePine,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useInventoryBatches,
  useUploadInventory,
  useDeleteInventoryBatch,
} from '@/hooks/useInventory';
import { InventoryRecord } from '@/lib/api';
import ComparisonView from '@/components/features/ComparisonView';
import TreeComparisonView from '@/components/features/TreeComparisonView';

export default function InventoryPage() {
  const { t } = useTranslation(); // Translation hook
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRecords, setParsedRecords] = useState<InventoryRecord[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'comparison' | 'tree'>('list');

  const { data: batches, isLoading: batchesLoading } = useInventoryBatches();
  const uploadMutation = useUploadInventory();
  const deleteMutation = useDeleteInventoryBatch();

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error(t('inventory.upload.errorInvalidFile'));
      return;
    }

    setSelectedFile(file);
    parseExcelFile(file);
  };

  // Parse Excel file
  const parseExcelFile = (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        const records: InventoryRecord[] = jsonData.map((row: any) => ({
          bureau: row.bureau || row.Bureau,
          registreType: row.registreType || row.registre_type || row['Type de registre'],
          year: parseInt(row.year || row.Year || row.année || row.Année),
          registreNumber: row.registreNumber || row.registre_number || row['Numéro registre'],
          acteNumber: row.acteNumber || row.acte_number || row['Numéro acte'],
        }));

        setParsedRecords(records);
        toast.success(`${records.length} ${t('inventory.upload.success')}`);
      } catch (error) {
        console.error('Error parsing Excel:', error);
        toast.error(t('inventory.upload.errorParsing'));
      }
    };

    reader.readAsBinaryString(file);
  };

  // Upload inventory
  const handleUpload = async () => {
    if (parsedRecords.length === 0) {
      toast.error(t('inventory.upload.errorNoRecords'));
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadMutation.mutateAsync(parsedRecords) as any;
      const message = result?.message ?? t('inventory.upload.success');
      toast.success(message);
      setSelectedFile(null);
      setParsedRecords([]);
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('inventory.upload.errorUpload'));
    } finally {
      setIsUploading(false);
    }
  };

  // Delete batch
  const handleDeleteBatch = async (batchId: string) => {
    if (!confirm(t('inventory.batches.deleteConfirm'))) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(batchId);
      toast.success(t('inventory.batches.deleteSuccess'));
      if (selectedBatch === batchId) {
        setSelectedBatch(null);
        setViewMode('list');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('inventory.batches.deleteError'));
    }
  };

  // View comparison
  const handleViewComparison = (batchId: string) => {
    setSelectedBatch(batchId);
    setViewMode('comparison');
  };

  // View tree
  const handleViewTree = (batchId: string) => {
    setSelectedBatch(batchId);
    setViewMode('tree');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            {t('inventory.title')}
          </h1>
          <p className="text-text-secondary mt-1">
            {t('inventory.subtitle')}
          </p>
        </div>

        {viewMode !== 'list' && (
          <button
            onClick={() => {
              setViewMode('list');
              setSelectedBatch(null);
            }}
            className="px-4 py-2 bg-bg-tertiary hover:bg-bg-hover text-text-primary rounded-lg transition-colors"
          >
            ← {t('inventory.backToList')}
          </button>
        )}
      </div>

      {viewMode === 'list' && (
        <>
          {/* Upload Section */}
          <div className="bg-bg-secondary rounded-lg border border-border p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              {t('inventory.upload.title')}
            </h2>

            <div className="space-y-4">
              {/* File Input */}
              <div className="flex items-center gap-4">
                <label
                  htmlFor="file-upload"
                  className="px-6 py-3 bg-gold-primary hover:bg-gold-hover text-white rounded-lg cursor-pointer transition-colors flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  {t('inventory.upload.selectFile')}
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {selectedFile && (
                  <span className="text-text-secondary">
                    {selectedFile.name} ({parsedRecords.length} {t('inventory.upload.records')})
                  </span>
                )}
              </div>

              {/* Preview */}
              {parsedRecords.length > 0 && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="bg-bg-tertiary p-3 border-b border-border">
                    <h3 className="font-medium text-text-primary">
                      {t('inventory.upload.preview')} ({parsedRecords.length} {t('inventory.upload.records')})
                    </h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-bg-tertiary sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-text-secondary">
                            {t('inventory.table.bureau')}
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-text-secondary">
                            {t('inventory.table.type')}
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-text-secondary">
                            {t('inventory.table.year')}
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-text-secondary">
                            {t('inventory.table.registreNumber')}
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-text-secondary">
                            {t('inventory.table.acteNumber')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedRecords.slice(0, 10).map((record, index) => (
                          <tr key={index} className="border-t border-border">
                            <td className="px-4 py-2 text-sm text-text-primary">
                              {record.bureau}
                            </td>
                            <td className="px-4 py-2 text-sm text-text-primary">
                              {record.registreType}
                            </td>
                            <td className="px-4 py-2 text-sm text-text-primary">
                              {record.year}
                            </td>
                            <td className="px-4 py-2 text-sm text-text-primary">
                              {record.registreNumber}
                            </td>
                            <td className="px-4 py-2 text-sm text-text-primary">
                              {record.acteNumber}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedRecords.length > 10 && (
                      <div className="p-3 text-center text-sm text-text-secondary bg-bg-tertiary">
                        ... {t('inventory.table.andMore', { count: parsedRecords.length - 10 })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Upload Button */}
              {parsedRecords.length > 0 && (
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('inventory.upload.uploading')}
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      {t('inventory.upload.uploadButton')} {parsedRecords.length} {t('inventory.upload.records')}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Batches List */}
          <div className="bg-bg-secondary rounded-lg border border-border">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-text-primary">
                {t('inventory.batches.title')}
              </h2>
            </div>

            {batchesLoading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-4 border-gold-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : Array.isArray(batches) && batches.length > 0 ? (
              <div className="divide-y divide-border">
                {batches.map((batch) => (
                  <div
                    key={batch.upload_batch_id}
                    className="p-6 hover:bg-bg-tertiary transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FileSpreadsheet className="w-5 h-5 text-gold-primary" />
                          <h3 className="font-medium text-text-primary">
                            {t('inventory.batches.uploadedOn')} {new Date(batch.uploaded_at).toLocaleDateString()}
                          </h3>
                        </div>
                        <div className="text-sm text-text-secondary space-y-1">
                          <p>
                            <span className="font-medium">{batch.record_count}</span> {t('inventory.batches.recordCount')}
                          </p>
                          <p>
                            {t('inventory.batches.uploadedBy')} <span className="font-medium">{batch.uploaded_by_username}</span>
                          </p>
                          <p className="text-xs">
                            {new Date(batch.uploaded_at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewComparison(batch.upload_batch_id)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                          <BarChart3 className="w-4 h-4" />
                          {t('inventory.batches.actions.comparison')}
                        </button>
                        <button
                          onClick={() => handleViewTree(batch.upload_batch_id)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                          <TreePine className="w-4 h-4" />
                          {t('inventory.batches.actions.tree')}
                        </button>
                        <button
                          onClick={() => handleDeleteBatch(batch.upload_batch_id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-text-secondary">
                <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>{t('inventory.batches.empty')}</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Comparison View */}
      {viewMode === 'comparison' && selectedBatch && (
        <ComparisonView batchId={selectedBatch} />
      )}

      {/* Tree View */}
      {viewMode === 'tree' && selectedBatch && (
        <TreeComparisonView batchId={selectedBatch} />
      )}
    </div>
  );
}