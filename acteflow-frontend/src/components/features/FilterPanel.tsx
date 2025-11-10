'use client';

import { useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useSearchFacets } from '@/hooks/useSearch';
import { cn } from '@/lib/utils';

interface FilterPanelProps {
  filters: any;
  onFilterChange: (filters: any) => void;
  onClearFilters: () => void;
  className?: string;
}

const BUREAUX = [
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

const REGISTRE_TYPES = [
  { value: 'naissances', label: 'Naissances' },
  { value: 'deces', label: 'Décès' },
  { value: 'mariages', label: 'Mariages' },
  { value: 'divorces', label: 'Divorces' },
  { value: 'transcriptions', label: 'Transcriptions' },
];

const STATUSES = [
  { value: 'pending', label: 'En attente', color: 'bg-yellow-500' },
  { value: 'reviewing', label: 'En révision', color: 'bg-blue-500' },
  { value: 'rejected_for_update', label: 'Rejeté', color: 'bg-red-500' },
  { value: 'stored', label: 'Archivé', color: 'bg-green-500' },
];

const SORT_OPTIONS = [
  { value: 'uploaded_at', label: 'Date de téléversement' },
  { value: 'reviewed_at', label: 'Date de révision' },
  { value: 'bureau', label: 'Bureau' },
  { value: 'year', label: 'Année' },
  { value: 'acte_number', label: 'Numéro d\'acte' },
  { value: 'status', label: 'Statut' },
];

export function FilterPanel({ filters, onFilterChange, onClearFilters, className }: FilterPanelProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const { data: facets } = useSearchFacets(filters.query);

  const handleFilterChange = (key: string, value: any) => {
    onFilterChange({ ...filters, [key]: value, page: 1 }); // Reset to page 1 on filter change
  };

  const removeFilter = (key: string) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFilterChange(newFilters);
  };

  // Count active filters
  const activeFiltersCount = Object.keys(filters).filter(
    (key) => 
      key !== 'query' && 
      key !== 'sort_by' && 
      key !== 'sort_order' && 
      key !== 'page' && 
      key !== 'limit' &&
      filters[key]
  ).length;

  // Get current year for year range
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  return (
    <div className={cn('bg-bg-secondary rounded-lg border border-border', className)}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-text-primary hover:text-gold-primary transition-colors font-medium"
        >
          <Filter className="h-5 w-5" />
          <span>{t('search.filters')}</span>
          {activeFiltersCount > 0 && (
            <Badge variant="info" className="ml-2">
              {activeFiltersCount}
            </Badge>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 ml-auto" />
          ) : (
            <ChevronDown className="h-4 w-4 ml-auto" />
          )}
        </button>

        {activeFiltersCount > 0 && (
          <Button
            onClick={onClearFilters}
            variant="ghost"
            size="sm"
            className="text-text-secondary hover:text-text-primary"
          >
            <X className="h-4 w-4 mr-1" />
            {t('common.clearAll')}
          </Button>
        )}
      </div>

      {/* Active Filters Chips */}
      {activeFiltersCount > 0 && (
        <div className="p-4 flex flex-wrap gap-2 border-b border-border">
          {Object.entries(filters).map(([key, value]) => {
            if (
              key === 'query' ||
              key === 'sort_by' ||
              key === 'sort_order' ||
              key === 'page' ||
              key === 'limit' ||
              !value
            ) {
              return null;
            }

            return (
              <Badge
                key={key}
                variant="default"
                className="flex items-center gap-1 py-1 px-3"
              >
                <span className="text-xs font-medium">{t(`search.${key}`)}: {String(value)}</span>
                <button
                  onClick={() => removeFilter(key)}
                  className="ml-1 hover:text-gold-primary transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Filters Content */}
      {expanded && (
        <div className="p-4 space-y-4">
          {/* Bureau Filter */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('search.bureau')}
            </label>
            <select
              value={filters.bureau || ''}
              onChange={(e) => handleFilterChange('bureau', e.target.value || undefined)}
              className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-gold-primary"
            >
              <option value="">{t('common.all')}</option>
              {BUREAUX.map((bureau) => {
                const bureauFacet = facets?.bureaux?.find((f: any) => f.value === bureau);
                return (
                  <option key={bureau} value={bureau}>
                    {bureau}
                    {bureauFacet?.count ? ` (${bureauFacet.count})` : null}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Registre Type Filter */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('search.registreType')}
            </label>
            <select
              value={filters.registre_type || ''}
              onChange={(e) => handleFilterChange('registre_type', e.target.value || undefined)}
              className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-gold-primary"
            >
              <option value="">{t('common.all')}</option>
              {REGISTRE_TYPES.map((type) => {
                const typeFacetCount = facets?.types?.find((f: any) => f.value === type.value)?.count;
                return (
                  <option key={type.value} value={type.value}>
                    {type.label}
                    {typeFacetCount ? ` (${typeFacetCount})` : null}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('search.year')}
            </label>
            <div className="flex gap-2">
              <select
                value={filters.year || ''}
                onChange={(e) => handleFilterChange('year', e.target.value || undefined)}
                className="flex-1 bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-gold-primary"
              >
                <option value="">{t('common.all')}</option>
                {years.map((year) => {
                  const yearFacet = facets?.years?.find((f: any) => f.value === year);
                  return (
                    <option key={year} value={year}>
                      {year}
                      {yearFacet?.count ? ` (${yearFacet.count})` : null}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('search.status')}
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
              className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-gold-primary"
            >
              <option value="">{t('common.all')}</option>
              {STATUSES.map((status) => {
                const statusCount = facets?.statuses?.find((f: any) => f.value === status.value)?.count;
                return (
                  <option key={status.value} value={status.value}>
                    {status.label}
                    {statusCount ? ` (${statusCount})` : null}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Registre Number */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('search.registreNumber')}
            </label>
            <Input
              type="text"
              value={filters.registre_number || ''}
              onChange={(e) => handleFilterChange('registre_number', e.target.value || undefined)}
              placeholder={t('search.registreNumberPlaceholder')}
            />
          </div>

          {/* Acte Number */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('search.acteNumber')}
            </label>
            <Input
              type="text"
              value={filters.acte_number || ''}
              onChange={(e) => handleFilterChange('acte_number', e.target.value || undefined)}
              placeholder={t('search.acteNumberPlaceholder')}
            />
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              {t('search.dateRange')}
            </label>
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-text-secondary mb-1">
                  {t('search.from')}
                </label>
                <Input
                  type="date"
                  value={filters.date_from || ''}
                  onChange={(e) => handleFilterChange('date_from', e.target.value || undefined)}
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">
                  {t('search.to')}
                </label>
                <Input
                  type="date"
                  value={filters.date_to || ''}
                  onChange={(e) => handleFilterChange('date_to', e.target.value || undefined)}
                />
              </div>
            </div>
          </div>

          {/* Sort Options */}
          <div className="pt-4 border-t border-border">
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('search.sortBy')}
            </label>
            <div className="flex gap-2">
              <select
                value={filters.sort_by || 'uploaded_at'}
                onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                className="flex-1 bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-gold-primary"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={filters.sort_order || 'DESC'}
                onChange={(e) => handleFilterChange('sort_order', e.target.value)}
                className="bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-gold-primary"
              >
                <option value="DESC">{t('search.descending')}</option>
                <option value="ASC">{t('search.ascending')}</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
