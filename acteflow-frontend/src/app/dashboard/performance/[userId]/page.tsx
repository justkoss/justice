'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { ArrowLeft, Clock, Calendar, TrendingUp, Activity } from 'lucide-react';
import type { 
  UserPerformanceReport, 
  HourlyDistribution, 
  DailyActivity,
  ActivitySummary
} from '@/types';
import '@/lib/i18n';

export default function UserPerformanceDetail() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { user: currentUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [userReport, setUserReport] = useState<{
    user: {
      id: number;
      username: string;
      full_name: string;
      role: string;
    };
    report: UserPerformanceReport;
  } | null>(null);
  const [hourlyData, setHourlyData] = useState<HourlyDistribution[]>([]);
  const [dailyData, setDailyData] = useState<DailyActivity[]>([]);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (params.userId) {
      fetchUserPerformance();
    }
  }, [params.userId, dateRange]);

  const fetchUserPerformance = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const reportRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/performance/user/${params.userId}?start_date=${dateRange.start_date}&end_date=${dateRange.end_date}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const reportJson = await reportRes.json();
      
      const hourlyRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/performance/user/${params.userId}/hourly?start_date=${dateRange.start_date}&end_date=${dateRange.end_date}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const hourlyJson = await hourlyRes.json();
      
      const dailyRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/performance/user/${params.userId}/daily?start_date=${dateRange.start_date}&end_date=${dateRange.end_date}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const dailyJson = await dailyRes.json();

      if (reportJson.success) setUserReport(reportJson);
      if (hourlyJson.success) setHourlyData(hourlyJson.data);
      if (dailyJson.success) setDailyData(dailyJson.data);
    } catch (error) {
      console.error('Error fetching user performance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-primary"></div>
      </div>
    );
  }

  if (!userReport) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-error">{t('common.errorLoadingData')}</p>
        </div>
      </div>
    );
  }

  const { user, report } = userReport;

  return (
    <div className="h-full overflow-auto bg-bg-primary">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gold-primary hover:text-gold-hover mb-4 font-semibold transition-colors"
        >
          <ArrowLeft size={20} />
          {t('performance.backToDashboard')}
        </button>

        <div className="bg-gradient-to-br from-gold-primary/20 to-gold-hover/10 border border-gold-primary/30 rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-text-primary">{user.full_name}</h1>
          <p className="text-text-secondary mt-2">@{user.username} • {t(`common.roles.${user.role}`)}</p>
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-bg-secondary border border-border-primary rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary mb-2">{t('performance.totalActivities')}</p>
                <p className="text-2xl font-bold text-text-primary">{report.summary.total_activities}</p>
              </div>
              <div className="bg-gold-primary/10 p-3 rounded-lg">
                <TrendingUp className="text-gold-primary" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-bg-secondary border border-border-primary rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary mb-2">{t('performance.activeDays')}</p>
                <p className="text-2xl font-bold text-text-primary">{report.summary.active_days}</p>
              </div>
              <div className="bg-success/10 p-3 rounded-lg">
                <Calendar className="text-success" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-bg-secondary border border-border-primary rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary mb-2">{t('performance.avgPerDay')}</p>
                <p className="text-2xl font-bold text-text-primary">{report.summary.avg_activities_per_day}</p>
              </div>
              <div className="bg-info/10 p-3 rounded-lg">
                <Activity className="text-info" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-bg-secondary border border-border-primary rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary mb-2">{t('performance.workHours')}</p>
                <p className="text-2xl font-bold text-text-primary">
                  {report.summary.work_hours.total_hours}h {report.summary.work_hours.total_minutes}m
                </p>
              </div>
              <div className="bg-warning/10 p-3 rounded-lg">
                <Clock className="text-warning" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Activities by Type */}
        <div className="bg-bg-secondary border border-border-primary rounded-xl p-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">{t('performance.activitiesByType')}</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-bg-tertiary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                    {t('performance.activityType')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                    {t('performance.count')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary">
                {report.activities_by_type.map((activity) => (
                  <tr key={activity.action} className="hover:bg-bg-hover transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-400/10 text-blue-400">
                        {activity.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-text-primary">
                      {activity.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Hourly Distribution */}
        <div className="bg-bg-secondary border border-border-primary rounded-xl p-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">{t('performance.productiveHours')}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="hour" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
              />
              <Bar dataKey="activity_count" fill="#D4AF37" name={t('performance.activities')} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-sm text-text-secondary mt-4">{t('performance.productiveHoursDesc')}</p>
        </div>

        {/* Daily Activity Trend */}
        <div className="bg-bg-secondary border border-border-primary rounded-xl p-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">{t('performance.dailyActivityTrend')}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
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
              <Line 
                type="monotone" 
                dataKey="total_activities" 
                stroke="#D4AF37" 
                strokeWidth={2}
                name={t('performance.activities')}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
