'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Calendar,
  Users as UsersIcon,
  FolderTree
} from 'lucide-react';
import '@/lib/i18n';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  useEffect(() => {
    document.title = `${t('app.name')} - ${t('nav.dashboard')}`;
  }, [t]);

  // Mock stats data (will be replaced with real API data later)
  const stats = [
    {
      label: t('dashboard.totalDocuments'),
      value: '1,234',
      icon: <FileText className="h-6 w-6" />,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      change: '+12%',
      changeType: 'increase' as const,
    },
    {
      label: t('dashboard.pendingDocuments'),
      value: '45',
      icon: <Clock className="h-6 w-6" />,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      change: '+5',
      changeType: 'increase' as const,
    },
    {
      label: t('dashboard.storedDocuments'),
      value: '1,154',
      icon: <CheckCircle className="h-6 w-6" />,
      color: 'text-success',
      bgColor: 'bg-success/10',
      change: '+23',
      changeType: 'increase' as const,
    },
    {
      label: t('dashboard.rejectedDocuments'),
      value: '35',
      icon: <XCircle className="h-6 w-6" />,
      color: 'text-error',
      bgColor: 'bg-error/10',
      change: '-8',
      changeType: 'decrease' as const,
    },
  ];

  const recentActivity = [
    { action: 'Document approved', document: 'A0234', time: '2 minutes ago', user: 'Ahmed Benali' },
    { action: 'Document uploaded', document: 'A0235', time: '15 minutes ago', user: 'Sarah Idrissi' },
    { action: 'Document rejected', document: 'A0233', time: '1 hour ago', user: 'Mohamed Alami' },
  ];

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto p-6 space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-br from-gold-primary/20 to-gold-hover/10 border border-gold-primary/30 rounded-2xl p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                {t('auth.welcome')}, {user?.full_name || user?.username}!
              </h1>
              <p className="text-text-secondary">
                {t('dashboard.overview')} - {new Date().toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="hidden md:block">
              <div className="bg-gold-primary/20 p-4 rounded-xl">
                <TrendingUp className="h-12 w-12 text-gold-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-bg-secondary border border-border-primary rounded-xl p-6 hover:border-gold-primary/50 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <div className={stat.color}>
                    {stat.icon}
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                  stat.changeType === 'increase' 
                    ? 'bg-success/10 text-success' 
                    : 'bg-error/10 text-error'
                }`}>
                  {stat.change}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-text-primary mb-1">
                {stat.value}
              </h3>
              <p className="text-sm text-text-secondary">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-bg-secondary border border-border-primary rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-text-primary">
                {t('dashboard.recentActivity')}
              </h2>
              <button className="text-sm text-gold-primary hover:text-gold-hover font-semibold">
                View All
              </button>
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-4 p-4 bg-bg-tertiary rounded-lg hover:bg-bg-hover transition-colors"
                >
                  <div className="h-10 w-10 bg-gold-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-gold-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary">
                      {activity.action}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      Document {activity.document} • {activity.user}
                    </p>
                  </div>
                  <div className="text-xs text-text-muted">
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            {/* This Week */}
            <div className="bg-bg-secondary border border-border-primary rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="h-5 w-5 text-gold-primary" />
                <h3 className="font-semibold text-text-primary">
                  {t('dashboard.documentsThisWeek')}
                </h3>
              </div>
              <p className="text-3xl font-bold text-text-primary mb-2">
                234
              </p>
              <p className="text-sm text-text-secondary">
                +18% from last week
              </p>
            </div>

            {/* Average Processing Time */}
            <div className="bg-bg-secondary border border-border-primary rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="h-5 w-5 text-gold-primary" />
                <h3 className="font-semibold text-text-primary">
                  {t('dashboard.averageProcessingTime')}
                </h3>
              </div>
              <p className="text-3xl font-bold text-text-primary mb-2">
                2.5h
              </p>
              <p className="text-sm text-text-secondary">
                -15 min from last week
              </p>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-info-bg border border-info/20 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="bg-info/20 p-3 rounded-lg flex-shrink-0">
              <TrendingUp className="h-6 w-6 text-info-light" />
            </div>
            <div>
              <h3 className="font-semibold text-info-light mb-2">
                {t('dashboard.title')} Analytics
              </h3>
              <p className="text-text-secondary">
                Full dashboard analytics with charts and detailed statistics coming in the next phase. 
                This includes bureau statistics, document type distribution, and user performance metrics.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
