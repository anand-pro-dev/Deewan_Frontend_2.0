import React, { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { motion } from "framer-motion";

interface LogItem {
  timestamp: string;
  [key: string]: string | number;
}

interface Props {
  logs: LogItem[];
  consumptionValue: string;
  consumptionShow: boolean;
  decimalPoints: string;
  parameterLabels: Record<string, string>;
  parameterUnits: Record<string, string>;
}

type Range = "day" | "week" | "month";

const TableDataDetailsConsumption: React.FC<Props> = ({
  logs,
  consumptionValue,
  consumptionShow,
  decimalPoints,
  parameterLabels,
  parameterUnits,
}) => {
  const [series, setSeries] = useState<{ name: string; data: number[] }[]>([]);
  const [options, setOptions] = useState<any>({});
  const [range, setRange] = useState<Range>("day");

  // ── Decimal ────────────────────────────────────────────────────────────────
  const decimalPlaces =
    decimalPoints === "none" ? 0
    : decimalPoints?.startsWith(".") ? Math.min(decimalPoints.length - 1, 9)
    : 2;

  const formatDecimal = (val: number | string) => {
    const num = Number(val);
    if (isNaN(num)) return "--";
    const rounded = Math.round((num + Number.EPSILON) * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
    const [i, d = ""] = rounded.toFixed(decimalPlaces).split(".");
    return `${i.padStart(2, "0")}.${d.padEnd(decimalPlaces, "0")}`;
  };

  // ── Label / unit ───────────────────────────────────────────────────────────
  const label = parameterLabels?.[consumptionValue] || consumptionValue;
  const unit = parameterUnits?.[consumptionValue] || "";
  const labelWithUnit = unit ? `${label} (${unit})` : label;

  // ── Extract numeric value from log ────────────────────────────────────────
  const extractValue = (log: LogItem, key: string): number | null => {
    const ll = key.toLowerCase();
    const match = Object.entries(log).find(([k]) => k.toLowerCase() === ll);
    if (!match) return null;
    const v = Number(match[1]);
    return isNaN(v) ? null : v;
  };

  // ── Dynamic Y axis domain ─────────────────────────────────────────────────
  const getDomain = (values: number[]) => {
    if (!values.length) return { min: 0, max: 10 };
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = (max - min) * 0.1 || 1;
    return { min: Math.max(0, Math.floor(min - pad)), max: Math.ceil(max + pad) };
  };

  // ── Build chart options ────────────────────────────────────────────────────
  const buildOptions = (categories: string[], values: number[]) => {
    const { min, max } = getDomain(values);
    return {
      legend: { show: false },
      colors: ["#6366f1"],
      chart: {
        fontFamily: "inherit",
        type: "area",
        toolbar: { show: false },
        background: "transparent",
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: 600,
        },
      },
      stroke: { width: 2.5, curve: "smooth" },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.2,
          opacityTo: 0,
          stops: [0, 95, 100],
        },
      },
      grid: {
        borderColor: "#f1f5f9",
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
      },
      dataLabels: { enabled: false },
      markers: {
        size: 3.5,
        colors: "#fff",
        strokeColors: "#6366f1",
        strokeWidth: 2.5,
        hover: { sizeOffset: 3 },
      },
      xaxis: {
        categories,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { fontSize: "10px", fontWeight: 600, colors: "#94a3b8" } },
      },
      yaxis: {
        min,
        max,
        labels: {
          formatter: (v: number) => `${formatDecimal(v)}${unit ? " " + unit : ""}`,
          style: { fontSize: "10px", fontWeight: 600, colors: "#94a3b8" },
        },
      },
      tooltip: {
        theme: "light",
        style: { fontSize: "12px" },
        y: { formatter: (v: number) => `${formatDecimal(v)}${unit ? " " + unit : ""} (${label})` },
      },
    };
  };

  // ── Generate chart data per range ─────────────────────────────────────────
  const generateChartData = (interval: Range) => {
    const sorted = [...logs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    if (!sorted.length) return;

    if (interval === "day") {
      let prev: number | null = null;
      const grouped: Record<string, number> = {};

      sorted.forEach(log => {
        const d = new Date(log.timestamp);
        const key = `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
        const value = extractValue(log, consumptionValue);
        if (value !== null) {
          if (prev !== null) {
            const diff = value - prev;
            grouped[key] = (grouped[key] || 0) + (diff > 0 ? diff : 0);
          }
          prev = value;
        }
      });

      const values = Object.values(grouped);
      setSeries([{ name: labelWithUnit, data: values }]);
      setOptions(buildOptions(Object.keys(grouped), values));
      return;
    }

    if (interval === "week") {
      const grouped: Record<string, number[]> = {};
      sorted.forEach(log => {
        const d = new Date(log.timestamp);
        const sow = new Date(d);
        sow.setDate(d.getDate() - d.getDay());
        const key = sow.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" });
        const value = extractValue(log, consumptionValue);
        if (value !== null) {
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(value);
        }
      });

      const categories = Object.keys(grouped).sort((a, b) => {
        const [da, ma] = a.split("/").map(Number);
        const [db, mb] = b.split("/").map(Number);
        return new Date(2024, ma - 1, da).getTime() - new Date(2024, mb - 1, db).getTime();
      });
      const values = categories.map(k => grouped[k].length > 1 ? grouped[k][grouped[k].length - 1] - grouped[k][0] : 0);
      setSeries([{ name: labelWithUnit, data: values }]);
      setOptions(buildOptions(categories.map(c => `Week ${c}`), values));
      return;
    }

    if (interval === "month") {
      const grouped: Record<string, number[]> = {};
      sorted.forEach(log => {
        const key = new Date(log.timestamp).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
        const value = extractValue(log, consumptionValue);
        if (value !== null) {
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(value);
        }
      });

      const categories = Object.keys(grouped).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      const values = categories.map(k => grouped[k].length > 1 ? grouped[k][grouped[k].length - 1] - grouped[k][0] : 0);
      setSeries([{ name: labelWithUnit, data: values }]);
      setOptions(buildOptions(categories, values));
    }
  };

  useEffect(() => {
    if (logs.length && consumptionValue) generateChartData(range);
  }, [logs, range, consumptionValue, decimalPoints]);

  if (!consumptionShow) return null;

  const rangeLabels: Record<Range, string> = { day: "Day", week: "Week", month: "Month" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <p className="text-xs font-bold text-gray-800 uppercase tracking-widest">{labelWithUnit}</p>
          </div>
          <p className="text-[10px] text-gray-400 font-medium ml-4">
            {range === "day" ? "Hourly breakdown today" : range === "week" ? "Weekly totals" : "Monthly totals"}
          </p>
        </div>

        {/* Range toggle */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {(["day", "week", "month"] as Range[]).map(r => (
            <motion.button
              key={r}
              whileTap={{ scale: 0.95 }}
              onClick={() => setRange(r)}
              className={`relative px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                range === r ? "bg-white shadow-sm text-indigo-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {range === r && (
                <motion.span
                  layoutId="rangeHighlight"
                  className="absolute inset-0 bg-white rounded-lg shadow-sm"
                  style={{ zIndex: 0 }}
                />
              )}
              <span className="relative z-10">{rangeLabels[r]}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="px-2 pb-4 pt-3">
        {series.length > 0 && options.chart ? (
          <ReactApexChart
            options={options}
            series={series}
            type="area"
            height={300}
          />
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-300 text-sm">
            No consumption data available
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TableDataDetailsConsumption;