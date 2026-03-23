 
import {
  AreaChart, Area,
  BarChart, Bar,
  CartesianGrid, XAxis, YAxis, Tooltip,
  ResponsiveContainer,  
} from "recharts";
import { motion } from "framer-motion";
import { Activity, BarChart2,   Layers } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type ChartKey = { key: string; label: string };

type DeviceChartProps = {
  chartData: Record<string, any>[];
  chartKeys: ChartKey[];
  parameterUnits: Record<string, string>;
  selectedParam: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const CHART_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#f97316", "#84cc16", "#ec4899", "#64748b",
];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({
  active, payload, label, parameterUnits,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  parameterUnits: Record<string, string>;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                    rounded-2xl p-3 shadow-2xl backdrop-blur-sm min-w-[160px]">
      <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wider">
        {new Date(label!).toLocaleTimeString([], {
          hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
        })}
      </p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mt-1">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: entry.color }} />
          <span className="text-xs text-gray-500 dark:text-gray-400">{entry.name}:</span>
          <span className="text-xs font-bold text-gray-900 dark:text-white">
            {entry.value}&nbsp;
            {parameterUnits[entry.name?.toLowerCase?.().trim()] || ""}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Chart Header ─────────────────────────────────────────────────────────────
const ChartHeader = ({
  icon: Icon, title, subtitle, gradient,
}: {
  icon: any; title: string; subtitle: string; gradient: string;
}) => (
  <div className="flex items-center gap-3 mb-5">
    <div className={`w-9 h-9 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-md flex-shrink-0`}>
      <Icon size={17} className="text-white" />
    </div>
    <div>
      <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">{title}</h3>
      <p className="text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>
    </div>
  </div>
);

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyChart = ({ icon: Icon }: { icon: any }) => (
  <div className="flex flex-col items-center justify-center h-[260px] text-center">
    <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mb-3">
      <Icon size={24} className="text-gray-300 dark:text-gray-600" />
    </div>
    <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold">Not enough data</p>
    <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">At least 4 valid log entries required</p>
  </div>
);

// ─── Shared Axis / Grid Props ─────────────────────────────────────────────────
const axisTickStyle = { fontSize: 11, fill: "#9ca3af" };
const gridProps = { strokeDasharray: "3 3", stroke: "rgba(156,163,175,0.15)" };

// ─── Main Component ───────────────────────────────────────────────────────────
const DeviceChart = ({
  chartData,
  chartKeys,
  parameterUnits,
  selectedParam,
}: DeviceChartProps) => {
  const paramLabel =
    selectedParam === "all" || !selectedParam ? "All Parameters" : selectedParam;

  const hasEnoughData = chartData.length >= 4;

  // ── Color Legend Dots ─────────────────────────────────────────────────────
  const LegendDots = () => (
    <div className="flex flex-wrap gap-3 mt-3">
      {chartKeys.map(({ key, label }, idx) => (
        <div key={key} className="flex items-center gap-1.5">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: CHART_COLORS[idx % CHART_COLORS.length] }}
          />
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {label}
            {parameterUnits[label?.toLowerCase?.().trim()]
              ? ` (${parameterUnits[label.toLowerCase().trim()]})`
              : ""}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-5">

      {/* ── Section Label ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
          <Layers size={17} className="text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Analytics</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {paramLabel} — {chartData.length} data points
          </p>
        </div>
        {hasEnoughData && (
          <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400
                          bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Live
          </div>
        )}
      </div>

      {/* ── Two Charts Side by Side ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* ── Area Chart Card ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-md dark:shadow-gray-900/50
                     border border-gray-100 dark:border-gray-700 p-6"
        >
          <ChartHeader
            icon={Activity}
            title="Area Chart"
            subtitle={`Trend over last ${chartData.length} readings`}
            gradient="from-blue-500 to-cyan-500"
          />

          {hasEnoughData ? (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    {chartKeys.map(({ label }, idx) => (
                      <linearGradient key={label} id={`area-grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={CHART_COLORS[idx % CHART_COLORS.length]} stopOpacity={0.45} />
                        <stop offset="100%" stopColor={CHART_COLORS[idx % CHART_COLORS.length]} stopOpacity={0.02} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid {...gridProps} />
                  <XAxis
                    dataKey="timestamp"
                    axisLine={false} tickLine={false}
                    tick={axisTickStyle}
                    tickFormatter={t =>
                      new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    }
                  />
                  <YAxis
                    domain={[0, 120]}
                    axisLine={false} tickLine={false}
                    tick={axisTickStyle}
                  />
                  <Tooltip content={<CustomTooltip parameterUnits={parameterUnits} />} />
                  {chartKeys.map(({ key, label }, idx) => (
                    <Area
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                      fill={`url(#area-grad-${idx})`}
                      name={label}
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
              <LegendDots />
            </>
          ) : (
            <EmptyChart icon={Activity} />
          )}
        </motion.div>

        {/* ── Bar Chart Card ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-md dark:shadow-gray-900/50
                     border border-gray-100 dark:border-gray-700 p-6"
        >
          <ChartHeader
            icon={BarChart2}
            title="Bar Chart"
            subtitle={`Comparison over last ${chartData.length} readings`}
            gradient="from-violet-500 to-purple-600"
          />

          {hasEnoughData ? (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} barGap={3} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid {...gridProps} vertical={false} />
                  <XAxis
                    dataKey="timestamp"
                    axisLine={false} tickLine={false}
                    tick={axisTickStyle}
                    tickFormatter={t =>
                      new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    }
                  />
                  <YAxis
                    domain={[0, 120]}
                    axisLine={false} tickLine={false}
                    tick={axisTickStyle}
                  />
                  <Tooltip content={<CustomTooltip parameterUnits={parameterUnits} />} />
                  {chartKeys.map(({ key, label }, idx) => (
                    <Bar
                      key={key}
                      dataKey={key}
                      fill={CHART_COLORS[idx % CHART_COLORS.length]}
                      name={label}
                      radius={[5, 5, 0, 0]}
                      maxBarSize={32}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
              <LegendDots />
            </>
          ) : (
            <EmptyChart icon={BarChart2} />
          )}
        </motion.div>

      </div>
    </div>
  );
};

export default DeviceChart;