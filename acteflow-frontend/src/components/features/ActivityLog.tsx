'use client';

import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  Upload,
  Download,
  Edit,
  Trash2,
  User,
  Clock,
  RefreshCw
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import type { ActivityLogEntry } from '@/types';

interface ActivityLogProps {
  documentId?: number;
  logs: ActivityLogEntry[];
}

/**
 * BadgeVariant mirrors the allowed variant values in the Badge component's props.
 * Keep this in sync with Badge.tsx if those types change.
 */
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
};

/**
 * Color names used for Tailwind classes (kept as strings).
 */
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
};

/**
 * A separate mapping from actions to Badge variant values (typed).
 */
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
};

export function ActivityLog({ documentId, logs }: ActivityLogProps) {
  const { t } = useTranslation();

  const getActionIcon = (action: string) => {
    const Icon = actionIcons[action] || FileText;
    return <Icon className="w-4 h-4" />;
  };

  const getActionColor = (action: string) => {
    return actionColors[action] || 'gray';
  };

  const getBadgeVariant = (action: string): BadgeVariant => {
    return actionBadgeVariant[action] || 'default';
  };

  return (
    <Card className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-semibold text-text-primary">
          {t('acts.activityLog')}
        </h3>
        <p className="text-sm text-text-secondary mt-1">
          {logs.length} {t('acts.actionsRecorded')}
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {logs.length === 0 && (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-text-secondary mx-auto mb-3 opacity-50" />
            <p className="text-text-secondary text-sm">
              {t('acts.noActivityYet')}
            </p>
          </div>
        )}

        {logs.map((log) => (
          <div
            key={log.id}
            className="flex gap-3 p-3 bg-bg-primary rounded-lg hover:bg-bg-secondary transition-colors"
          >
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full bg-${getActionColor(log.action)}-500/10 flex items-center justify-center text-${getActionColor(log.action)}-500`}>
                {getActionIcon(log.action)}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">
                    {t(`acts.actions.${log.action}`)}
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
                  {t(`acts.actionTypes.${log.action.split('_')[1]}`)}
                </Badge>
              </div>

              {/* User & Time */}
              <div className="flex items-center gap-3 mt-2 text-xs text-text-secondary">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>{log.user_full_name || log.username}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatRelativeTime(new Date(log.created_at))}</span>
                </div>
              </div>

              {/* Metadata (if any) */}
              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <div className="mt-2 p-2 bg-bg-secondary rounded text-xs">
                  {Object.entries(log.metadata).map(([key, value]) => (
                    <div key={key} className="flex gap-2">
                      <span className="text-text-secondary">{key}:</span>
                      <span className="text-text-primary">{String(value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
