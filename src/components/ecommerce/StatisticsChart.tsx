import { motion } from 'framer-motion';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchAnalytics, setPeriod } from '../../store/analyticsSlice';
import { TrendingUp } from 'lucide-react';

const PERIODS = [
  { label: 'Monthly',   value: 'monthly'   },
  { label: 'Quarterly', value: 'quarterly' },
  { label: 'Annually',  value: 'annually'  },
] as const;

type PeriodValue = typeof PERIODS[number]['value'];

export default function StatisticsChart() {
  const dispatch   = useAppDispatch();
  const statistics = useAppSelector((s) => s.analytics.statistics ?? []);
  const period     = useAppSelector((s) => s.analytics.period ?? 'annually');
  const loading    = useAppSelector((s) => s.analytics.loading);
  const role       = useAppSelector((s) => s.auth.user?.role)?.toLowerCase() ?? 'user';

  const handlePeriod = (val: PeriodValue) => {
    dispatch(setPeriod(val));
    dispatch(fetchAnalytics(val));
  };

  const labels  = statistics.map((s) => s.label);
  const devices = statistics.map((s) => s.devices);
  const users   = statistics.map((s) => s.users ?? 0);
  const hasUsers = role !== 'user' && users.some((v) => v > 0);

  // ── Summary numbers ────────────────────────────────────────────────────
  const totalDevices = devices.reduce((s, v) => s + v, 0);
  const totalUsers   = users.reduce((s, v)   => s + v, 0);

  const options: ApexOptions = {
    chart: {
      fontFamily: 'Sora, sans-serif',
      height: 300,
      type: 'area',
      toolbar: { show: false },
      background: 'transparent',
      animations: { enabled: true, speed: 500 },
    },
    colors: ['#6366f1', '#f59e0b'],
    stroke: { curve: 'smooth', width: [2.5, 2.5] },
    fill: {
      type: 'gradient',
      gradient: {
        type: 'vertical',
        shadeIntensity: 1,
        opacityFrom: 0.3,
        opacityTo: 0.0,
        stops: [0, 100],
      },
    },
    markers: {
      size: 0,
      hover: { size: 5, sizeOffset: 2 },
    },
    grid: {
      borderColor: '#e2e8f020',
      strokeDashArray: 4,
      yaxis: { lines: { show: true  } },
      xaxis: { lines: { show: false } },
    },
    dataLabels: { enabled: false },
    xaxis: {
      type: 'category',
      categories: labels,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { fontSize: '11px', fontFamily: 'Sora, sans-serif', colors: Array(labels.length).fill('#94a3b8') },
      },
    },
    yaxis: {
      tickAmount: 4,
      labels: {
        style: { fontSize: '11px', fontFamily: 'Sora, sans-serif', colors: ['#94a3b8'] },
        formatter: (v) => v.toFixed(0),
      },
    },
    legend: { show: false },
    tooltip: {
      theme: 'dark',
      style: { fontSize: '12px', fontFamily: 'Sora, sans-serif' },
      shared: true,
      intersect: false,
    },
  };

  const series = hasUsers
    ? [{ name: 'Devices', data: devices }, { name: 'Users', data: users }]
    : [{ name: 'Devices', data: devices }];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 }}
      className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-white/[0.03] px-5 pt-5 pb-3 sm:px-6 sm:pt-6"
    >
      {/* Header row */}
      <div className="flex flex-col gap-4 mb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">Statistics</h3>
          </div>
          <p className="mt-1 ml-10 text-xs text-gray-400 dark:text-gray-500">Growth trend by period</p>
        </div>

        {/* Period toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-white/[0.03] self-start">
          {PERIODS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => handlePeriod(value)}
              className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all ${
                period === value
                  ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-sm ring-1 ring-gray-100 dark:ring-gray-700'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend dots + totals */}
      {!loading && (
        <div className="flex items-center gap-5 mb-4 ml-10">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Devices <strong className="text-gray-700 dark:text-gray-300 ml-1">{totalDevices.toLocaleString()}</strong>
            </span>
          </div>
          {hasUsers && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Users <strong className="text-gray-700 dark:text-gray-300 ml-1">{totalUsers.toLocaleString()}</strong>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      {loading ? (
        <div className="h-[300px] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[560px] xl:min-w-full">
            <Chart options={options} series={series} type="area" height={300} />
          </div>
        </div>
      )}
    </motion.div>
  );
}