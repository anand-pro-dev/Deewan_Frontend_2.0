import { useAppSelector } from "../../store/hooks";
import PageBreadcrumb from "../common/PageBreadCrumb";
import PageMeta from "../common/PageMeta";

// ── tiny copy-to-clipboard helper ────────────────────────────────────────────
const copy = (text: string) => navigator.clipboard.writeText(text);

interface FieldRowProps {
  label: string;
  value: string;
  mono?: boolean;
  badge?: boolean;
  badgeColor?: string;
}

const FieldRow: React.FC<FieldRowProps> = ({
  label,
  value,
  mono = false,
  badge = false,
  badgeColor = "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
}) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 group">
    <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 w-28 shrink-0">
      {label}
    </span>

    <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
      {badge ? (
        <span className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${badgeColor}`}>
          {value}
        </span>
      ) : (
        <span
          className={`truncate text-sm text-gray-800 dark:text-gray-100 ${
            mono ? "font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded" : "font-medium"
          }`}
        >
          {value}
        </span>
      )}

      {/* copy button */}
      <button
        onClick={() => copy(value)}
        title="Copy to clipboard"
        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
        </svg>
      </button>
    </div>
  </div>
);

// ── role badge colour map ─────────────────────────────────────────────────────
const roleBadge = (role: string) => {
  const map: Record<string, string> = {
    admin:      "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    superAdmin: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    user:       "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  };
  return map[role?.toLowerCase()] ?? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
};

// ── download helper ───────────────────────────────────────────────────────────
const downloadAsJson = (data: object, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// ── main component ────────────────────────────────────────────────────────────
export default function AccountInfo() {
  const { user, token, isAuthenticated } = useAppSelector((s) => s.auth);

  const handleDownload = () => {
    downloadAsJson(
      {
        id:             user?._id,
        userId:         user?.userId,
        role:           user?.role,
        token,
        firstName:      user?.firstName,
        lastName:       user?.lastName,
        email:          user?.email,
        organization:   user?.organization,
        status:         user?.status,
      },
      "account-info.json"
    );
  };

  return (
    <>
      <PageMeta title="Account Info · Deewan Dashboard" description="Your account credentials and session info" />
      <PageBreadcrumb pageTitle="Account Info" />

      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── Session status banner ─────────────────────────────────────── */}
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
          isAuthenticated
            ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800"
            : "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800"
        }`}>
          <span className={`w-2 h-2 rounded-full shrink-0 ${isAuthenticated ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
          {isAuthenticated ? "Active session — you are authenticated" : "No active session"}
        </div>

        {/* ── Identity card ─────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">

          {/* header strip */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-white/[0.02]">
            <div className="flex items-center gap-3">
              {/* avatar initials */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {(user?.firstName?.[0] ?? user?.email?.[0] ?? "?").toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.firstName ?? "—"}
                </p>
                <p className="text-xs text-gray-400">{user?.email ?? "No email"}</p>
              </div>
            </div>

            {/* download button */}
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-800 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              Download
            </button>
          </div>

          {/* field rows */}
          <div className="px-5 py-1">
            <FieldRow label="ID"       value={user?._id    ?? "—"} mono />
            <FieldRow label="User ID"  value={user?.userId ?? "—"} mono />
            <FieldRow
              label="Role"
              value={user?.role ?? "—"}
              badge
              badgeColor={roleBadge(user?.role ?? "")}
            />
            <FieldRow label="Status"
              value={user?.status ?? "—"}
              badge
              badgeColor={
                user?.status?.toLowerCase() === "active"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
              }
            />
            <FieldRow label="Org"      value={user?.organization ?? "—"} />
          </div>
        </div>

        {/* ── Token card ────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-white/[0.02]">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Session Token</p>
            {token && (
              <button
                onClick={() => copy(token)}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Copy full token
              </button>
            )}
          </div>

          <div className="px-5 py-4">
            {token ? (
              <p className="font-mono text-xs text-gray-600 dark:text-gray-300 break-all leading-relaxed bg-gray-50 dark:bg-gray-800/60 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                {token}
              </p>
            ) : (
              <p className="text-sm text-gray-400 italic">No token in store</p>
            )}
          </div>
        </div>

      </div>
    </>
  );
}