'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Download } from 'lucide-react';
import { useCompareInventory } from '@/hooks/useInventory';

interface ComparisonViewProps {
  batchId: string;
}

export default function ComparisonView({ batchId }: ComparisonViewProps) {
  const [filters, setFilters] = useState<{
    bureau?: string;
    registreType?: string;
    year?: number;
  }>({});
  const [activeTab, setActiveTab] = useState<'matched' | 'missing' | 'extra'>('missing');

  const { data: comparison, isLoading } = useCompareInventory(batchId, filters);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-gold-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!comparison) {
    return (
      <div className="text-center py-12 text-text-secondary">
        Aucune donnée disponible
      </div>
    );
  }

  const { summary, matched, missing, extra } = comparison;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-bg-secondary rounded-lg border border-border p-6">
          <div className="text-sm text-text-secondary mb-1">Total Inventaire</div>
          <div className="text-3xl font-bold text-text-primary">
            {summary.totalInventory}
          </div>
        </div>

        <div className="bg-bg-secondary rounded-lg border border-border p-6">
          <div className="text-sm text-text-secondary mb-1">Total Documents</div>
          <div className="text-3xl font-bold text-text-primary">
            {summary.totalDocuments}
          </div>
        </div>

        <div className="bg-green-500/10 rounded-lg border border-green-500/30 p-6">
          <div className="text-sm text-green-400 mb-1 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Correspondants
          </div>
          <div className="text-3xl font-bold text-green-400">
            {summary.matched}
          </div>
        </div>

        <div className="bg-red-500/10 rounded-lg border border-red-500/30 p-6">
          <div className="text-sm text-red-400 mb-1 flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            Manquants
          </div>
          <div className="text-3xl font-bold text-red-400">
            {summary.missing}
          </div>
        </div>

        <div className="bg-yellow-500/10 rounded-lg border border-yellow-500/30 p-6">
          <div className="text-sm text-yellow-400 mb-1 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            En trop
          </div>
          <div className="text-3xl font-bold text-yellow-400">
            {summary.extra}
          </div>
        </div>
      </div>

      {/* Match Rate */}
      <div className="bg-bg-secondary rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-text-secondary">Taux de correspondance</span>
          <span className="text-2xl font-bold text-gold-primary">
            {summary.matchRate}%
          </span>
        </div>
        <div className="w-full bg-bg-tertiary rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-gold-primary to-gold-secondary h-full transition-all duration-500"
            style={{ width: `${summary.matchRate}%` }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-bg-secondary rounded-lg border border-border">
        <div className="border-b border-border">
          <div className="flex gap-2 p-2">
            <button
              onClick={() => setActiveTab('missing')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'missing'
                  ? 'bg-red-500/20 text-red-400'
                  : 'text-text-secondary hover:bg-bg-tertiary'
              }`}
            >
              <XCircle className="w-4 h-4" />
              Manquants ({missing.length})
            </button>
            <button
              onClick={() => setActiveTab('extra')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'extra'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'text-text-secondary hover:bg-bg-tertiary'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              En trop ({extra.length})
            </button>
            <button
              onClick={() => setActiveTab('matched')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'matched'
                  ? 'bg-green-500/20 text-green-400'
                  : 'text-text-secondary hover:bg-bg-tertiary'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              Correspondants ({matched.length})
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-bg-tertiary">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                  Bureau
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                  Année
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                  N° Registre
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                  N° Acte
                </th>
                {(activeTab === 'extra' || activeTab === 'matched') && (
                  <>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                      Téléchargé par
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                      Date
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activeTab === 'missing' &&
                (missing.length > 0 ? (
                  missing.map((item, index) => (
                    <tr key={index} className="hover:bg-bg-tertiary">
                      <td className="px-4 py-3 text-sm text-text-primary">
                        {item.bureau}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-primary">
                        {item.registreType}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-primary">
                        {item.year}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-primary">
                        {item.registreNumber}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-primary">
                        {item.acteNumber}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-text-secondary">
                      Aucun document manquant
                    </td>
                  </tr>
                ))}

              {activeTab === 'extra' &&
                (extra.length > 0 ? (
                  extra.map((item, index) => (
                    <tr key={index} className="hover:bg-bg-tertiary">
                      <td className="px-4 py-3 text-sm text-text-primary">
                        {item.bureau}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-primary">
                        {item.registreType}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-primary">
                        {item.year}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-primary">
                        {item.registreNumber}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-primary">
                        {item.acteNumber}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {item.uploadedBy}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {new Date(item.uploadedAt).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-text-secondary">
                      Aucun document en trop
                    </td>
                  </tr>
                ))}

              {activeTab === 'matched' &&
                (matched.length > 0 ? (
                  matched.slice(0, 50).map((item, index) => (
                    <tr key={index} className="hover:bg-bg-tertiary">
                      <td className="px-4 py-3 text-sm text-text-primary">
                        {item.bureau}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-primary">
                        {item.registreType}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-primary">
                        {item.year}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-primary">
                        {item.registreNumber}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-primary">
                        {item.acteNumber}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {item.uploadedBy}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {new Date(item.uploadedAt).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-text-secondary">
                      Aucune correspondance
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {activeTab === 'matched' && matched.length > 50 && (
            <div className="p-4 text-center text-sm text-text-secondary bg-bg-tertiary border-t border-border">
              Affichage de 50 sur {matched.length} correspondances
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
