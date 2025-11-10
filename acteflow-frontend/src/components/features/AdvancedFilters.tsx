'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, X, Calendar, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchFilters } from '@/hooks/useSearch';
import { Button } from '@/components/ui/Button';
import {Input} from '@/components/ui/Input';

interface AdvancedFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onApply: () => void;
  onReset: () => void;
  facets?: {
    bureaux: Array<{ value: string; count: number }>;
    types: Array<{ value: string; count: number }>;
    years: Array<{ value: number; count: number }>;
    statuses: Array<{ value: string; count: number }>;
  };
}

export default function AdvancedFilters({
  filters,
  onFiltersChange,
  onApply,
  onReset,
  facets,
}: AdvancedFiltersProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const bureaux = [
    'Aïn Chock',
    'Aïn Sebaâ',
    'Al Fida',
    'Anfa',
    'Ben M\'sik',
    'Essoukhour Assawda',
    'Hay Hassani',
    'Hay Mohammadi',
    'Maârif',
    'Mers Sultan',
    'Moulay Rachid',
    'Sbata',
    'Sidi Belyout',
    'Sidi Bernoussi',
    'Sidi Moumen',
    'Sidi Othman',
  ];

  const registreTypes = [
    'naissances',
    'mariages',
    'deces',
    'divorces',
    'transcriptions',
  ];

  const statuses = [
    { value: 'pending', label: t('status.pending'), color: 'yellow' },
    { value: 'reviewing', label: t('status.reviewing'), color: 'blue' },
    { value: 'rejected_for_update', label: t('status.rejected'), color: 'red' },
    { value: 'stored', label: t('status.stored'), color: 'green' },
  ];

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined && value !== ''
  );

  return (
    <div className="bg-bg-secondary rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-bg-tertiary transition-colors"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gold-primary" />
          <span className="font-semibold text-text-primary">
            {t('search.advancedFilters')}
          </span>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 rounded-full bg-gold-primary/20 text-gold-primary text-xs font-medium">
              {Object.values(filters).filter((v) => v !== undefined && v !== '').length}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            'h-5 w-5 text-text-secondary transition-transform duration-200',
            isExpanded && 'rotate-180'
          )}
        />
      </button>

      {/* Filters Content */}
      {isExpanded && (
        <div className="p-4 border-t border-border space-y-4">
          {/* Bureau Filter */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('documents.bureau')}
            </label>
            <select
              value={filters.bureau || ''}
              onChange={(e) => updateFilter('bureau', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-gold-primary"
            >
              <option value="">{t('common.all')}</option>
              {bureaux.map((bureau) => (
                <option key={bureau} value={bureau}>
                  {bureau}
                  {facets?.bureaux.find((f) => f.value === bureau) &&
                    ` (${facets.bureaux.find((f) => f.value === bureau)?.count})`}
                </option>
              ))}
            </select>
          </div>

          {/* Registre Type Filter */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('documents.registreType')}
            </label>
            <select
              value={filters.registre_type || ''}
              onChange={(e) => updateFilter('registre_type', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-gold-primary"
            >
              <option value="">{t('common.all')}</option>
              {registreTypes.map((type) => (
                <option key={type} value={type}>
                  {t(`registreTypes.${type}`)}
                  {facets?.types.find((f) => f.value === type) &&
                    ` (${facets.types.find((f) => f.value === type)?.count})`}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('documents.year')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder={t('search.yearFrom')}
                value={filters.year?.split('-')[0] || ''}
                onChange={(e) => {
                  const from = e.target.value;
                  const to = filters.year?.split('-')[1];
                  updateFilter('year', from && to ? `${from}-${to}` : from);
                }}
              />
              <Input
                type="number"
                placeholder={t('search.yearTo')}
                value={filters.year?.split('-')[1] || ''}
                onChange={(e) => {
                  const from = filters.year?.split('-')[0] || '';
                  const to = e.target.value;
                  updateFilter('year', from && to ? `${from}-${to}` : to || from);
                }}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('documents.status')}
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-gold-primary"
            >
              <option value="">{t('common.all')}</option>
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                  {facets?.statuses.find((f) => f.value === status.value) &&
                    ` (${facets.statuses.find((f) => f.value === status.value)?.count})`}
                </option>
              ))}
            </select>
          </div>

          {/* Registre Number */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('documents.registreNumber')}
            </label>
            <Input
              type="text"
              placeholder={t('search.enterRegistreNumber')}
              value={filters.registre_number || ''}
              onChange={(e) => updateFilter('registre_number', e.target.value)}
            />
          </div>

          {/* Acte Number */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('documents.acteNumber')}
            </label>
            <Input
              type="text"
              placeholder={t('search.enterActeNumber')}
              value={filters.acte_number || ''}
              onChange={(e) => updateFilter('acte_number', e.target.value)}
            />
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              {t('search.uploadedDate')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={filters.uploaded_from || ''}
                onChange={(e) => updateFilter('uploaded_from', e.target.value)}
              />
              <Input
                type="date"
                value={filters.uploaded_to || ''}
                onChange={(e) => updateFilter('uploaded_to', e.target.value)}
              />
            </div>
          </div>

          {/* Agent Name */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('search.agentName')}
            </label>
            <Input
              type="text"
              placeholder={t('search.enterAgentName')}
              value={filters.agent_name || ''}
              onChange={(e) => updateFilter('agent_name', e.target.value)}
            />
          </div>

          {/* Supervisor Name */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('search.supervisorName')}
            </label>
            <Input
              type="text"
              placeholder={t('search.enterSupervisorName')}
              value={filters.supervisor_name || ''}
              onChange={(e) => updateFilter('supervisor_name', e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={onApply}
              className="flex-1"
            >
              {t('search.applyFilters')}
            </Button>
            <Button
              onClick={onReset}
              variant="secondary"
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              {t('search.resetFilters')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
