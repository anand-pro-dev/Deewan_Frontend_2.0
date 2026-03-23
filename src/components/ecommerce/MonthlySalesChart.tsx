import { motion } from 'framer-motion';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { useAppSelector } from '../../store/hooks';
import { BarChart3 } from 'lucide-react';

export default function MonthlySalesChart() {
  const monthlyUsers = useAppSelector((s) => s.analytics.monthlyUsers ?? []);
  const loading      = useAppSelector((s) => s.analytics.loading);

  const categories = monthlyUsers.map((p) => p.month);
  const counts     = monthlyUsers.map((p) => p.count);
  const maxVal     = Math.max(...counts, 1);

  const options: ApexOptions = {
    chart: {
      fontFamily: 'Sora, sans-serif',
      type: 'bar',
      height: 260,
      toolbar: { show: false },
      background: 'transparent',
      animations: { enabled: true, speed: 600, animateGradually: { enabled: true, delay: 40 } },
    },
    colors: ['#6366f1'],
    plotOptions: {
      bar: {
        borderRadius: 6,
        borderRadiusApplication: 'end',
        columnWidth: '48%',
        distributed: true,
      },
    },
    fill: {
      type: 'gradient',
      gradient: {
        type: 'vertical',
        gradientToColors: ['#818cf8'],
        opacityFrom: 0.9,
        opacityTo: 0.6,
      },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { fontSize: '11px', fontFamily: 'Sora, sans-serif', colors: Array(12).fill('#94a3b8') },
      },
    },
    yaxis: {
      min: 0,
      max: Math.ceil(maxVal * 1.2),
      tickAmount: 4,
      labels: {
        style: { fontSize: '11px', fontFamily: 'Sora, sans-serif', colors: ['#94a3b8'] },
        formatter: (v) => v.toFixed(0),
      },
    },
    grid: {
      borderColor: '#e2e8f020',
      strokeDashArray: 4,
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
    },
    tooltip: {
      theme: 'dark',
      style: { fontSize: '12px', fontFamily: 'Sora, sans-serif' },
      y: { formatter: (v) => `${v} registrations` },
    },
    states: {
      hover: { filter: { type: 'lighten',  } },
    },
  };

  const total = counts.reduce((s, v) => s + v, 0);
  const peak  = categories[counts.indexOf(Math.max(...counts))] ?? '—';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-white/[0.03] px-5 pt-5 pb-3 sm:px-6 sm:pt-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">Monthly Overview</h3>
          </div>
          <p className="mt-1 ml-10 text-xs text-gray-400 dark:text-gray-500">Registrations per month this year</p>
        </div>

        {/* Quick stats */}
        {!loading && total > 0 && (
          <div className="text-right">
            <p className="text-lg font-bold text-gray-800 dark:text-white tabular-nums">{total.toLocaleString()}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Peak: {peak}</p>
          </div>
        )}
      </div>

      {/* Chart */}
      {loading ? (
        <div className="h-[260px] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : (
        <Chart
          options={options}
          series={[{ name: 'Registrations', data: counts }]}
          type="bar"
          height={260}
        />
      )}
    </motion.div>
  );
}