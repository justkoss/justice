'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  X,
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  Upload,
  Download,
  Edit,
  Trash2,
  User as UserIcon,
  Clock,
  RefreshCw,
  Filter,
  Calendar,
  Activity,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { formatRelativeTime, formatDateTime } from '@/lib/utils';
import { useActivityLogs } from '@/hooks/useActivityLogs';
import type { User } from '@/types';

interface UserLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

type BadgeVariant = 'default' | 'pending' | 'reviewing' | 'rejected' | 'stored' | 'success' | 'error' | 'warning' | 'info';

const actionIcons: Record<string, any> = {
  document_uploaded: Upload,
  document_reviewed_started: Eye,
  document_approved: CheckCircle,
  document_rejected: XCircle,
  document_processing_started: RefreshCw,
  document_processing_completed: CheckCircle,
  document_downloaded: Download,
  document_updated: Edit,
  document_deleted: Trash2,
  document_viewed: Eye,
  user_created: UserIcon,
  user_updated: Edit,
  user_deleted: Trash2,
  user_login: UserIcon,
  user_logout: UserIcon,
};

const actionColors: Record<string, string> = {
  document_uploaded: 'blue',
  document_reviewed_started: 'yellow',
  document_approved: 'green',
  document_rejected: 'red',
  document_processing_started: 'purple',
  document_processing_completed: 'green',
  document_downloaded: 'blue',
  document_updated: 'yellow',
  document_deleted: 'red',
  document_viewed: 'gray',
  user_created: 'green',
  user_updated: 'yellow',
  user_deleted: 'red',
  user_login: 'blue',
  user_logout: 'gray',
};

const actionBadgeVariant: Record<string, BadgeVariant> = {
  document_uploaded: 'stored',
  document_reviewed_started: 'reviewing',
  document_approved: 'success',
  document_rejected: 'rejected',
  document_processing_started: 'pending',
  document_processing_completed: 'success',
  document_downloaded: 'info',
  document_updated: 'info',
  document_deleted: 'error',
  document_viewed: 'default',
  user_created: 'success',
  user_updated: 'info',
  user_deleted: 'error',
  user_login: 'info',
  user_logout: 'default',
};

export function UserLogsModal({ isOpen, onClose, user }: UserLogsModalProps) {
  const { t } = useTranslation();
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterEntityType, setFilterEntityType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 20;

  // Fetch logs for the user
  const { data, isLoading, error } = useActivityLogs(
    {
      user_id: user?.id,
      limit: 1000, // Get more logs for local filtering/pagination
    },
    {
      enabled: isOpen && !!user,
    }
  );

  interface ActivityLog {
    id: string | number;
    action: string;
    entity_type: string;
    entity_id?: string | number | null;
    details?: string | null;
    created_at: string;
    metadata?: Record<string, any>;
    ip_address?: string | null;
    user_agent?: string | null;
  }

  const logs: ActivityLog[] = ((data as any)?.data?.logs as ActivityLog[]) ?? [];

  // Filter logs locally
  const filteredLogs = useMemo(() => {
    let filtered = [...logs];

    if (filterAction !== 'all') {
      filtered = filtered.filter(log => log.action === filterAction);
    }

    if (filterEntityType !== 'all') {
      filtered = filtered.filter(log => log.entity_type === filterEntityType);
    }

    return filtered;
  }, [logs, filterAction, filterEntityType]);

  // Paginate filtered logs
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * logsPerPage,
    currentPage * logsPerPage
  );

  // Get unique actions and entity types for filters
  const uniqueActions = useMemo(() => {
    const actions = new Set(logs.map(log => log.action));
    return Array.from(actions);
  }, [logs]);

  const uniqueEntityTypes = useMemo(() => {
    const types = new Set(logs.map(log => log.entity_type));
    return Array.from(types);
  }, [logs]);

  const getActionIcon = (action: string) => {
    const Icon = actionIcons[action] || Activity;
    return <Icon className="w-4 h-4" />;
  };

  const getActionColor = (action: string) => {
    return actionColors[action] || 'gray';
  };

  const getBadgeVariant = (action: string): BadgeVariant => {
    return actionBadgeVariant[action] || 'default';
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset page when filters change
  const handleFilterChange = (type: 'action' | 'entity', value: string) => {
    setCurrentPage(1);
    if (type === 'action') {
      setFilterAction(value);
    } else {
      setFilterEntityType(value);
    }
  };

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border-primary">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-gold-primary/10 flex items-center justify-center">
            <Activity className="h-6 w-6 text-gold-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">
              {t('users.activityLogs')}
            </h2>
            <p className="text-sm text-text-secondary">
              {user.username} - {user.full_name || user.email || ''}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-bg-hover rounded-lg transition-colors"
        >
          <X className="h-5 w-5 text-text-secondary" />
        </button>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-border-primary bg-bg-secondary">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-text-secondary" />
            <span className="text-sm text-text-secondary">{t('common.filters')}:</span>
          </div>

          {/* Action Filter */}
          <select
            value={filterAction}
            onChange={(e) => handleFilterChange('action', e.target.value)}
            className="px-3 py-1.5 bg-bg-primary border border-border-primary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-gold-primary"
          >
            <option value="all">{t('users.allActions')}</option>
            {uniqueActions.map(action => (
              <option key={action} value={action}>
                {t(`acts.actions.${action}`, action)}
              </option>
            ))}
          </select>

          {/* Entity Type Filter */}
          <select
            value={filterEntityType}
            onChange={(e) => handleFilterChange('entity', e.target.value)}
            className="px-3 py-1.5 bg-bg-primary border border-border-primary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-gold-primary"
          >
            <option value="all">{t('users.allEntityTypes')}</option>
            {uniqueEntityTypes.map(type => (
              <option key={type} value={type}>
                {t(`users.entityType.${type}`, type)}
              </option>
            ))}
          </select>

          {/* Stats */}
          <div className="ml-auto flex items-center gap-2 text-sm text-text-secondary">
            <span>{t('users.totalLogs')}:</span>
            <Badge variant="default" size="sm">
              {filteredLogs.length}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-h-[600px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gold-primary border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <XCircle className="h-12 w-12 text-error mx-auto mb-4" />
            <p className="text-text-secondary">{t('common.errorLoadingData')}</p>
          </div>
        ) : paginatedLogs.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-text-secondary mx-auto mb-4 opacity-50" />
            <p className="text-text-secondary">
              {filteredLogs.length === 0 && logs.length > 0
                ? t('users.noLogsMatchFilter')
                : t('users.noActivityLogsYet')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedLogs.map((log) => (
              <div
                key={log.id}
                className="flex gap-3 p-4 bg-bg-secondary rounded-lg hover:bg-bg-tertiary transition-colors"
              >
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full bg-${getActionColor(log.action)}-500/10 flex items-center justify-center text-${getActionColor(log.action)}-500`}>
                    {getActionIcon(log.action)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-text-primary">
                        {t(`acts.actions.${log.action}`, log.action)}
                      </p>
                      {log.details && (
                        <p className="text-xs text-text-secondary mt-1">
                          {log.details}
                        </p>
                      )}
                    </div>
                    <Badge 
                      variant={getBadgeVariant(log.action)} 
                      size="sm"
                      className="flex-shrink-0"
                    >
                      {t(`users.entityType.${log.entity_type}`, log.entity_type)}
                    </Badge>
                  </div>

                  {/* Entity ID */}
                  {log.entity_id && (
                    <div className="text-xs text-text-tertiary mb-2">
                      {t('users.entityId')}: #{log.entity_id}
                    </div>
                  )}

                  {/* Time */}
                  <div className="flex items-center gap-1 text-xs text-text-tertiary">
                    <Clock className="w-3 h-3" />
                    <span>{formatRelativeTime(new Date(log.created_at))}</span>
                    <span className="mx-2">•</span>
                    <Calendar className="w-3 h-3" />
                    <span>{formatDateTime(log.created_at)}</span>
                  </div>

                  {/* Metadata */}
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="mt-3 p-3 bg-bg-primary rounded-lg text-xs">
                      <p className="font-medium text-text-secondary mb-2">
                        {t('users.metadata')}:
                      </p>
                      {Object.entries(log.metadata).map(([key, value]) => (
                        <div key={key} className="flex gap-2 mb-1">
                          <span className="text-text-tertiary">{key}:</span>
                          <span className="text-text-primary">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* IP & User Agent */}
                  {(log.ip_address || log.user_agent) && (
                    <div className="mt-2 text-xs text-text-muted">
                      {log.ip_address && (
                        <div>IP: {log.ip_address}</div>
                      )}
                      {log.user_agent && (
                        <div className="truncate">UA: {log.user_agent}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-border-primary flex items-center justify-between">
          <div className="text-sm text-text-secondary">
            {t('users.showingLogs', {
              from: (currentPage - 1) * logsPerPage + 1,
              to: Math.min(currentPage * logsPerPage, filteredLogs.length),
              total: filteredLogs.length
            })}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              icon={<ChevronLeft className="h-4 w-4" />}
            >
              {t('common.previous')}
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 rounded text-sm ${
                      currentPage === pageNum
                        ? 'bg-gold-primary text-white'
                        : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              icon={<ChevronRight className="h-4 w-4" />}
            >
              {t('common.next')}
            </Button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 border-t border-border-primary flex justify-end">
        <Button variant="secondary" onClick={onClose}>
          {t('common.close')}
        </Button>
      </div>
    </Modal>
  );
}
