import { useState } from "react";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { motion } from "framer-motion";

interface LogEntry {
  timestamp: string;
  [key: string]: any;
}

interface Props {
  logs: LogEntry[];
  selectedParam: string;
  paramKeys: any[];
  parameterLabels: Record<string, string>;
  parameterUnits: Record<string, string>;
  consumptionShow?: boolean;
  consumptionValue?: string;
  decimalPoints?: string;
}

const DeviceLogListTableConsumption: React.FC<Props> = ({
  logs,
  selectedParam,
  parameterLabels,
  parameterUnits,
  consumptionShow,
  consumptionValue,
  decimalPoints,
}) => {
  const [visibleCount, setVisibleCount] = useState<number>(20);

  // ── Decimal formatting ────────────────────────────────────────────────────
  const decimalPlaces =
    decimalPoints === "none" ? 0
    : decimalPoints?.startsWith(".") ? Math.min(decimalPoints.length - 1, 9)
    : 2;

  const formatDecimal = (val: number | string) => {
    const num = Number(val);
    if (isNaN(num)) return "--";
    const rounded =
      Math.round((num + Number.EPSILON) * Math.pow(10, decimalPlaces)) /
      Math.pow(10, decimalPlaces);
    const [i, d = ""] = rounded.toFixed(decimalPlaces).split(".");
    return `${i.padStart(2, "0")}.${d.padEnd(decimalPlaces, "0")}`;
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const extractValueByLabel = (log: LogEntry, label: string): any => {
    const ll = label.toLowerCase();
    const match = Object.entries(log).find(([k]) => k.toLowerCase() === ll);
    return match?.[1];
  };

  // Consumption = current row value − next row value (newest-first ordering)
  // Returns null if either value is missing/invalid, 0 if diff is negative
  const calculateConsumption = (cur: LogEntry, next: LogEntry): number | null => {
    if (!consumptionValue) return null;
    const cv = extractValueByLabel(cur, consumptionValue);
    const nv = extractValueByLabel(next, consumptionValue);
    if (cv == null || nv == null || isNaN(Number(cv)) || isNaN(Number(nv))) return null;
    const diff = Number(cv) - Number(nv);
    return diff < 0 ? 0 : diff;
  };

  // ── Derived display config ────────────────────────────────────────────────
  const allLabels = Object.values(parameterLabels);
  const displayLabels = allLabels.filter((label) =>
    logs.some((log) =>
      Object.keys(log).some((k) => k.toLowerCase() === label.toLowerCase())
    )
  );
  const filteredLabels =
    !selectedParam ||
    selectedParam.toLowerCase() === "all" ||
    selectedParam.toLowerCase() === "none"
      ? displayLabels
      : displayLabels.filter(
          (l) => l.toLowerCase() === selectedParam.toLowerCase()
        );

  const consumptionUnit = (() => {
    if (!consumptionValue) return "";
    const key = Object.keys(parameterLabels).find(
      (k) =>
        parameterLabels[k].toLowerCase() === consumptionValue.toLowerCase()
    );
    return parameterUnits[key ?? ""] ?? "";
  })();

  // ── consumptionShow drives everything — if true, always show the column ──
  // (no need to check selectedParam; admin explicitly enabled this)
  const showConsumption = consumptionShow === true && !!consumptionValue;

  // ── Sort & paginate ───────────────────────────────────────────────────────
  const sortedLogs = [...logs].sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const visibleLogs = sortedLogs.slice(0, visibleCount);

  // ── Per-row consumption values (for visible rows) ─────────────────────────
  const visibleConsumption: (number | null)[] = visibleLogs.map((log, i) =>
    showConsumption && i < visibleLogs.length - 1
      ? calculateConsumption(log, visibleLogs[i + 1])
      : null
  );

  const totalConsumption = visibleConsumption.reduce<number>(
    (acc, v) => (v === null ? acc : acc + v),
    0
  );

  // ── Excel export ──────────────────────────────────────────────────────────
  const exportToExcel = () => {
    // Export ALL sorted logs, not just visible
    const allConsumption: (number | null)[] = sortedLogs.map((log, i) => {
      if (!showConsumption || i === sortedLogs.length - 1) return null;
      return calculateConsumption(log, sortedLogs[i + 1]);
    });

    const consumptionHeader = `Consumption ${consumptionValue ?? ""}${
      consumptionUnit ? ` (${consumptionUnit})` : ""
    }`;

    const headers = [
      "Timestamp",
      ...filteredLabels.map((l) => {
        const k = Object.keys(parameterLabels).find(
          (p) => parameterLabels[p].toLowerCase() === l.toLowerCase()
        );
        const u = parameterUnits?.[k ?? ""] ?? "";
        return `${l}${u ? ` (${u})` : ""}`;
      }),
      ...(showConsumption ? [consumptionHeader] : []),
    ];

    const excelData = sortedLogs.map((row, idx) => {
      const r: Record<string, any> = {
        Timestamp: format(new Date(row.timestamp), "dd-MM-yyyy hh:mm:ss a"),
      };

      filteredLabels.forEach((l) => {
        const k = Object.keys(parameterLabels).find(
          (p) => parameterLabels[p].toLowerCase() === l.toLowerCase()
        );
        const u = parameterUnits?.[k ?? ""] ?? "";
        const hk = `${l}${u ? ` (${u})` : ""}`;
        const v = extractValueByLabel(row, l);
        r[hk] =
          v == null || v === ""
            ? "-"
            : isNaN(Number(v))
            ? v
            : formatDecimal(v);
      });

      if (showConsumption) {
        const val = allConsumption[idx];
        r[consumptionHeader] = val === null ? "--" : formatDecimal(val);
      }

      return r;
    });

    // Total row at the bottom
    if (showConsumption) {
      const total = allConsumption.reduce<number>(
        (acc, v) => (v === null ? acc : acc + v),
        0
      );
      const totalRow: Record<string, any> = { Timestamp: "TOTAL" };
      filteredLabels.forEach((l) => {
        const k = Object.keys(parameterLabels).find(
          (p) => parameterLabels[p].toLowerCase() === l.toLowerCase()
        );
        const u = parameterUnits?.[k ?? ""] ?? "";
        totalRow[`${l}${u ? ` (${u})` : ""}`] = "";
      });
      totalRow[consumptionHeader] = formatDecimal(total);
      excelData.push(totalRow);
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length, 15) }));
    XLSX.utils.book_append_sheet(wb, ws, "Device Logs");
    XLSX.writeFile(
      wb,
      `device_logs_${format(new Date(), "yyyy-MM-dd_HH-mm-ss")}.xlsx`
    );
  };

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!logs.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 bg-gray-50 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-gray-300 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-sm text-gray-400 font-semibold">No logs available</p>
      </div>
    );
  }

  return (
    <div>
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-gray-700">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Showing</p>
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-0.5">
            {visibleLogs.length} of {sortedLogs.length} records
            {showConsumption && (
              <span className="ml-2 text-indigo-500 dark:text-indigo-400">
                · consumption enabled
              </span>
            )}
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={exportToExcel}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all shadow-md shadow-emerald-100 dark:shadow-emerald-900/30"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export Excel
        </motion.button>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50 border-y border-gray-100 dark:border-gray-700">
              <th className="py-3 px-5 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest whitespace-nowrap">
                Timestamp
              </th>
              {filteredLabels.map((label) => {
                const key = Object.keys(parameterLabels).find(
                  (k) => parameterLabels[k].toLowerCase() === label.toLowerCase()
                );
                const unit = parameterUnits?.[key ?? ""] ?? "";
                return (
                  <th
                    key={label}
                    className="py-3 px-5 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest whitespace-nowrap"
                  >
                    {label}
                    {unit && (
                      <span className="text-gray-300 dark:text-gray-600 ml-1 normal-case font-normal">
                        ({unit})
                      </span>
                    )}
                  </th>
                );
              })}

              {/* Consumption column header — only when consumptionShow is true */}
              {showConsumption && (
                <th className="py-3 px-5 text-left text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest whitespace-nowrap">
                  Consumption {consumptionValue}
                  {consumptionUnit && (
                    <span className="normal-case font-normal text-indigo-300 dark:text-indigo-500 ml-1">
                      ({consumptionUnit})
                    </span>
                  )}
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {visibleLogs.map((row, idx) => {
              const consVal = showConsumption ? visibleConsumption[idx] : null;
              const consDisplay =
                consVal !== null ? formatDecimal(consVal) : "--";

              return (
                <motion.tr
                  key={idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.01 }}
                  className="hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors"
                >
                  <td className="py-2.5 px-5 font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {format(new Date(row.timestamp), "dd-MM-yyyy hh:mm:ss a")}
                  </td>

                  {filteredLabels.map((label) => {
                    const value = extractValueByLabel(row, label);
                    const shown =
                      value == null || value === ""
                        ? "-"
                        : formatDecimal(value);
                    return (
                      <td
                        key={label}
                        className="py-2.5 px-5 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap"
                      >
                        {shown}
                      </td>
                    );
                  })}

                  {/* Consumption cell */}
                  {showConsumption && (
                    <td
                      className={`py-2.5 px-5 font-bold whitespace-nowrap ${
                        consDisplay !== "--"
                          ? "text-indigo-600 dark:text-indigo-400"
                          : "text-gray-300 dark:text-gray-600"
                      }`}
                    >
                      {consDisplay}
                    </td>
                  )}
                </motion.tr>
              );
            })}
          </tbody>

          {/* Total row — only when consumptionShow is true */}
          {showConsumption && (
            <tfoot>
              <tr className="bg-indigo-50 dark:bg-indigo-900/20 border-t-2 border-indigo-100 dark:border-indigo-800/40">
                <td
                  colSpan={filteredLabels.length + 1}
                  className="py-3 px-5 text-xs font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-widest"
                >
                  Total
                </td>
                <td className="py-3 px-5 text-sm font-black text-indigo-700 dark:text-indigo-300 whitespace-nowrap">
                  {formatDecimal(totalConsumption)}
                  {consumptionUnit && (
                    <span className="text-xs font-semibold text-indigo-400 dark:text-indigo-500 ml-1">
                      ({consumptionUnit})
                    </span>
                  )}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* ── Load More ────────────────────────────────────────────────────── */}
      {visibleCount < sortedLogs.length && (
        <div className="flex justify-center py-5">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setVisibleCount((p) => p + 20)}
            className="flex items-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold py-2.5 px-6 rounded-xl border border-gray-200 dark:border-gray-600 transition-all shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
            Load 20 More
            <span className="text-gray-400 dark:text-gray-500 font-normal">
              ({sortedLogs.length - visibleCount} remaining)
            </span>
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default DeviceLogListTableConsumption;