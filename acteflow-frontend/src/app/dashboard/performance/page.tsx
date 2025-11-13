'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { 
  TrendingUp, TrendingDown, Users, Activity, 
  Clock, Award, Download, Calendar, 
  Link
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  useDashboardOverview, 
  useWeeklyComparison,
  useExportPerformanceCSV 
} from '@/hooks/usePerformance';
import '@/lib/i18n';

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
}

const StatCard = ({ icon, title, value, change, trend }: StatCardProps) => (
  <div className="bg-bg-secondary border border-border-primary rounded-xl p-6 hover:border-gold-primary/50 transition-all duration-200">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm text-text-secondary mb-2">{title}</p>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
        {change !== undefined && trend && (
          <div className={`flex items-center mt-2 text-sm ${
            trend === 'up' ? 'text-success' : 
            trend === 'down' ? 'text-error' : 
            'text-text-secondary'
          }`}>
            {trend === 'up' && <TrendingUp size={16} className="mr-1" />}
            {trend === 'down' && <TrendingDown size={16} className="mr-1" />}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <div className="bg-gold-primary/10 p-3 rounded-lg">
        {icon}
      </div>
    </div>
  </div>
);

export default function PerformanceDashboard() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });
  const [selectedView, setSelectedView] = useState<'overview' | 'topPerformers' | 'weekly'>('overview');

  // Use React Query hooks
  const { data: dashboardData, isLoading } = useDashboardOverview(dateRange.start_date, dateRange.end_date);
  const { data: weeklyComparison } = useWeeklyComparison(dateRange.start_date, dateRange.end_date);
  const exportCSV = useExportPerformanceCSV();

  useEffect(() => {
    document.title = `${t('app.name')} - ${t('performance.title')}`;
  }, [t]);

  const handleExportCSV = () => {
    exportCSV.mutate({
      startDate: dateRange.start_date,
      endDate: dateRange.end_date
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-bg-primary">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-gold-primary/20 to-gold-hover/10 border border-gold-primary/30 rounded-2xl p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                {t('performance.title')}
              </h1>
              <p className="text-text-secondary">
                {t('performance.subtitle')}
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              disabled={exportCSV.isPending}
              className="flex items-center gap-2 bg-gold-primary text-white px-4 py-2 rounded-lg hover:bg-gold-hover transition-colors disabled:opacity-50"
            >
              <Download size={20} />
              {exportCSV.isPending ? t('common.loading') : t('performance.exportCSV')}
            </button>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="bg-bg-secondary border border-border-primary rounded-xl p-4">
          <div className="flex items-center gap-4">
            <Calendar size={20} className="text-gold-primary" />
            <input
              type="date"
              value={dateRange.start_date}
              onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
              className="border border-border-primary rounded px-3 py-2 bg-bg-tertiary text-text-primary focus:border-gold-primary outline-none"
            />
            <span className="text-text-secondary">{t('performance.to')}</span>
            <input
              type="date"
              value={dateRange.end_date}
              onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
              className="border border-border-primary rounded px-3 py-2 bg-bg-tertiary text-text-primary focus:border-gold-primary outline-none"
            />
          </div>
        </div>

        {/* Stats Cards */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              icon={<Activity className="text-gold-primary" size={24} />}
              title={t('performance.totalActivities')}
              value={dashboardData.summary.total_activities.toLocaleString()}
            />
            <StatCard
              icon={<Users className="text-gold-primary" size={24} />}
              title={t('performance.activeUsers')}
              value={dashboardData.summary.active_users}
            />
            <StatCard
              icon={<TrendingUp className="text-gold-primary" size={24} />}
              title={t('performance.avgActivitiesPerUser')}
              value={dashboardData.summary.avg_activities_per_user}
            />
          </div>
        )}

        {/* View Tabs */}
        <div className="flex gap-4 border-b border-border-primary">
          <button
            onClick={() => setSelectedView('overview')}
            className={`pb-2 px-4 font-semibold transition-colors ${
              selectedView === 'overview' 
                ? 'border-b-2 border-gold-primary text-gold-primary' 
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t('performance.overview')}
          </button>
          <button
            onClick={() => setSelectedView('topPerformers')}
            className={`pb-2 px-4 font-semibold transition-colors ${
              selectedView === 'topPerformers' 
                ? 'border-b-2 border-gold-primary text-gold-primary' 
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t('performance.topPerformers')}
          </button>
          <button
            onClick={() => setSelectedView('weekly')}
            className={`pb-2 px-4 font-semibold transition-colors ${
              selectedView === 'weekly' 
                ? 'border-b-2 border-gold-primary text-gold-primary' 
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t('performance.weeklyComparison')}
          </button>
        </div>

        {/* Top Performers View */}
        {selectedView === 'topPerformers' && dashboardData && (
          <div className="bg-bg-secondary border border-border-primary rounded-xl p-6">
            <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
              <Award className="text-gold-primary" />
              {t('performance.topPerformersTitle')}
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-bg-tertiary">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">{t('performance.rank')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">{t('performance.user')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">{t('performance.role')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">{t('performance.totalActivities')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">{t('performance.activeDays')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">{t('performance.avgPerDay')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-primary">
                  {dashboardData.top_performers.map((performer, index) => (
                    <tr key={performer.user_id} className="hover:bg-bg-hover transition-colors">
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-semibold ${
                          index === 0 ? 'bg-gold-primary/20 text-gold-primary' :
                          index === 1 ? 'bg-gray-400/20 text-gray-400' :
                          index === 2 ? 'bg-orange-400/20 text-orange-400' :
                          'bg-blue-400/20 text-blue-400'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-text-primary">{performer.full_name} </div>
                          <div className="text-sm text-text-secondary">{performer.username}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-400/10 text-blue-400">
                          {t(`common.roles.${performer.role}`)}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-text-primary">{performer.total_activities}</td>
                      <td className="px-6 py-4 text-text-primary">{performer.active_days}</td>
                      <td className="px-6 py-4 text-text-primary">{performer.avg_activities_per_day}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Weekly Comparison View */}
        {selectedView === 'weekly' && weeklyComparison && weeklyComparison.length > 0 && (
          <div className="bg-bg-secondary border border-border-primary rounded-xl p-6">
            <h2 className="text-xl font-bold text-text-primary mb-4">{t('performance.weeklyComparisonTitle')}</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={weeklyComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="username" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Legend />
                <Bar dataKey="total_activities" fill="#D4AF37" name={t('performance.activities')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Overview - All Users Performance */}
        {selectedView === 'overview' && dashboardData && (
          <div className="bg-bg-secondary border border-border-primary rounded-xl p-6">
            <h2 className="text-xl font-bold text-text-primary mb-4">{t('performance.allUsersPerformance')}</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-bg-tertiary">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">{t('performance.user')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">{t('performance.role')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">{t('performance.documentsUploaded')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">{t('performance.fieldsFilled')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">{t('performance.documentsReviewed')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">{t('performance.workHours')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-primary">
                  {dashboardData.all_users.map((user) => (
                    <tr key={user.id} className="hover:bg-bg-hover transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-text-primary">
                          <a href={`/dashboard/performance/${user.id}`}>{user.full_name}</a></div>
                        <div className="text-sm text-text-secondary">{user.username}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-400/10 text-blue-400">
                          {t(`common.roles.${user.role}`)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-text-primary">{user.documents_uploaded}</td>
                      <td className="px-6 py-4 text-text-primary">{user.fields_filled}</td>
                      <td className="px-6 py-4 text-text-primary">{user.documents_reviewed}</td>
                      <td className="px-6 py-4 text-text-primary">{user.work_hours}h {user.work_minutes}m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
