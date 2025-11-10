'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search as SearchIcon,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useSearch,
  useSearchFacets,
  useSaveSearch,
  useSavedSearches,
  useDeleteSavedSearch,
  SearchFilters,
} from '@/hooks/useSearch';
import SearchBar from '@/components/features/SearchBar';
import AdvancedFilters from '@/components/features/AdvancedFilters';
import SearchResults from '@/components/features/SearchResults';
import FilterChip from '@/components/features/FilterChip';
import { Button } from '@/components/ui/Button';
import {Modal, ModalFooter} from '@/components/ui/Modal';

export default function SearchPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize filters from URL params
  const [filters, setFilters] = useState<SearchFilters>(() => ({
    query: searchParams.get('q') || '',
    bureau: searchParams.get('bureau') || undefined,
    registre_type: searchParams.get('registre_type') || undefined,
    year: searchParams.get('year') || undefined,
    status: searchParams.get('status') || undefined,
    sort_by: (searchParams.get('sort_by') as any) || 'uploaded_at',
    sort_order: (searchParams.get('sort_order') as 'ASC' | 'DESC') || 'DESC',
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '20'),
  }));

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [searchName, setSearchName] = useState('');

  // Queries
  const { data: searchData, isLoading } = useSearch(filters);
  const { data: facets } = useSearchFacets(filters.query);
  const { data: savedSearches } = useSavedSearches();
  const saveSearch = useSaveSearch();
  const deleteSavedSearch = useDeleteSavedSearch();

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.set(key, value.toString());
      }
    });
    router.push(`?${params.toString()}`, { scroll: false });
  }, [filters, router]);

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({
      query: '',
      sort_by: 'uploaded_at',
      sort_order: 'DESC',
      page: 1,
      limit: 20,
    });
  };

  const handleRemoveFilter = (key: keyof SearchFilters) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return { ...newFilters, page: 1 };
    });
  };

  const handleSaveSearch = () => {
    if (searchName.trim()) {
      saveSearch.mutate({ name: searchName, filters });
      setSearchName('');
      setShowSaveModal(false);
    }
  };

  const handleLoadSavedSearch = (search: any) => {
    setFilters({ ...search.filters, page: 1 });
  };

  const handleSortChange = (field: string) => {
    setFilters((prev) => ({
      ...prev,
      sort_by: field,
      sort_order: prev.sort_by === field && prev.sort_order === 'DESC' ? 'ASC' : 'DESC',
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Get active filters for display
  const activeFilters: Array<{ key: keyof SearchFilters; label: string; value: any }> = [];
  if (filters.bureau) activeFilters.push({ key: 'bureau', label: t('documents.bureau'), value: filters.bureau });
  if (filters.registre_type) activeFilters.push({ key: 'registre_type', label: t('documents.registreType'), value: t(`registreTypes.${filters.registre_type}`) });
  if (filters.year) activeFilters.push({ key: 'year', label: t('documents.year'), value: filters.year });
  if (filters.status) activeFilters.push({ key: 'status', label: t('documents.status'), value: t(`status.${filters.status.replace('_for_update', '')}`) });
  if (filters.registre_number) activeFilters.push({ key: 'registre_number', label: t('documents.registreNumber'), value: filters.registre_number });
  if (filters.acte_number) activeFilters.push({ key: 'acte_number', label: t('documents.acteNumber'), value: filters.acte_number });
  if (filters.agent_name) activeFilters.push({ key: 'agent_name', label: t('search.agentName'), value: filters.agent_name });
  if (filters.supervisor_name) activeFilters.push({ key: 'supervisor_name', label: t('search.supervisorName'), value: filters.supervisor_name });

  const results = searchData?.results || [];
  const pagination = searchData?.pagination;

  const normalizedFacets = facets
    ? {
        bureaux: facets.bureaux.map((f: any) => ({ value: String(f.value), count: f.count })),
        types: facets.types.map((f: any) => ({ value: String(f.value), count: f.count })),
        years: facets.years.map((f: any) => ({ value: Number(f.value), count: f.count })),
        statuses: facets.statuses.map((f: any) => ({ value: String(f.value), count: f.count })),
      }
    : undefined;

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
              <SearchIcon className="h-8 w-8 text-gold-primary" />
              {t('search.title')}
            </h1>
            <p className="text-text-secondary mt-1">{t('search.subtitle')}</p>
          </div>
          <Button
            onClick={() => setShowSaveModal(true)}
            variant="secondary"
            disabled={!filters.query && activeFilters.length === 0}
          >
            <Bookmark className="h-4 w-4 mr-2" />
            {t('search.saveSearch')}
          </Button>
        </div>

        {/* Saved Searches */}
        {savedSearches && savedSearches.length > 0 && (
          <div className="bg-bg-secondary rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-gold-primary" />
              <h3 className="font-semibold text-text-primary">{t('search.savedSearches')}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {savedSearches.map((search: any) => (
                <div key={search.id} className="group relative">
                  <button
                    onClick={() => handleLoadSavedSearch(search)}
                    className="px-3 py-1.5 rounded-full bg-bg-tertiary hover:bg-bg-primary border border-border text-sm text-text-primary transition-colors"
                  >
                    {search.name}
                  </button>
                  <button
                    onClick={() => deleteSavedSearch.mutate(search.id)}
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        

        {/* Advanced Filters */}
        <AdvancedFilters
          filters={filters}
          onFiltersChange={handleFilterChange}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          facets={normalizedFacets}
        />

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-text-secondary">{t('search.activeFilters')}:</span>
            {activeFilters.map((filter) => (
              <FilterChip
                key={filter.key}
                label={filter.label}
                value={filter.value}
                onRemove={() => handleRemoveFilter(filter.key)}
                variant="primary"
              />
            ))}
            {activeFilters.length > 1 && (
              <button
                onClick={handleResetFilters}
                className="text-sm text-gold-primary hover:underline"
              >
                {t('search.clearAll')}
              </button>
            )}
          </div>
        )}

        {/* Sort Options */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-text-secondary" />
            <span className="text-sm text-text-secondary">{t('search.sortBy')}:</span>
            <select
              value={filters.sort_by}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-bg-secondary border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-gold-primary"
            >
              <option value="uploaded_at">{t('search.uploadDate')}</option>
              <option value="reviewed_at">{t('search.reviewDate')}</option>
              <option value="bureau">{t('documents.bureau')}</option>
              <option value="year">{t('documents.year')}</option>
              <option value="status">{t('documents.status')}</option>
            </select>
            <button
              onClick={() => setFilters((prev) => ({ ...prev, sort_order: prev.sort_order === 'ASC' ? 'DESC' : 'ASC' }))}
              className="px-2 py-1.5 rounded-lg bg-bg-secondary border border-border text-text-primary text-sm hover:bg-bg-tertiary transition-colors"
            >
              {filters.sort_order === 'ASC' ? '↑' : '↓'}
            </button>
          </div>
          {pagination && (
            <div className="text-sm text-text-secondary">
              {t('search.showing')} {pagination.showing} {t('search.of')} {pagination.total}
            </div>
          )}
        </div>

        {/* Search Results */}
        <SearchResults
          results={results}
          isLoading={isLoading}
          searchQuery={filters.query}
        />

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              variant="secondary"
              size="sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={cn(
                      'h-8 w-8 rounded-lg text-sm font-medium transition-colors',
                      pageNum === pagination.page
                        ? 'bg-gold-primary text-white'
                        : 'bg-bg-secondary text-text-primary hover:bg-bg-tertiary'
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <Button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasMore}
              variant="secondary"
              size="sm"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Save Search Modal */}
      <Modal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        title={t('search.saveSearch')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('search.searchName')}
            </label>
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder={t('search.enterSearchName')}
              className="w-full px-3 py-2 rounded-lg bg-bg-secondary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-gold-primary"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSaveSearch} className="flex-1">
              {t('common.save')}
            </Button>
            <Button onClick={() => setShowSaveModal(false)} variant="secondary" className="flex-1">
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
