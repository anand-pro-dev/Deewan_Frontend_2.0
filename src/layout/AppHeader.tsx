import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useSidebar } from "../context/SidebarContext";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";
import NotificationDropdown from "../components/header/NotificationDropdown";
import UserDropdown from "../components/header/UserDropdown";
import { adminSearchDeviceApi, adminSearchUserApi } from "../apis/adminApi";
import { useAppSelector } from "../store/hooks"; // ← Redux hook

const RECENT_KEY = "recentSearches";
const MAX_RECENT = 5;

const getRecentSearches = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
};

const saveRecentSearch = (query: string) => {
  const trimmed = query.trim();
  if (!trimmed) return;
  const prev    = getRecentSearches();
  const updated = [trimmed, ...prev.filter((q) => q !== trimmed)].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
};

const AppHeader: React.FC = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const navigate  = useNavigate();
  const location  = useLocation();

  // ── Redux ───────────────────────────────────────────────────────────────────
  const authUser = useAppSelector((state) => state.auth.user);
 const isAdmin = ["admin", "superadmin"].includes(authUser?.role?.toLowerCase() ?? "");

  const [searchQuery,     setSearchQuery]     = useState("");
  const [suggestions,     setSuggestions]     = useState<any[]>([]);
  const [userSuggestions, setUserSuggestions] = useState<any[]>([]);
  const [recentSearches,  setRecentSearches]  = useState<string[]>([]);
  const [isSearching,     setIsSearching]     = useState(false);
  const [showDropdown,    setShowDropdown]    = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const isMounted = useRef(true);

  const isUsersListActive = location.pathname === "/allUsers" && isAdmin;
  const hasResults        = suggestions.length > 0 || userSuggestions.length > 0;
  const showRecent        = showDropdown && !searchQuery.trim() && recentSearches.length > 0;
  const showResults       = showDropdown && hasResults;

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  useEffect(() => {
    isMounted.current = true;
    setRecentSearches(getRecentSearches());
    return () => { isMounted.current = false; };
  }, []);

  // ── ⌘K shortcut ────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ── Close dropdown on outside click ────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Search function ─────────────────────────────────────────────────────────
  const runSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setUserSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    try {
      if (isUsersListActive) {
        const res = await adminSearchUserApi(query.trim());
        if (!isMounted.current) return;
        const users = res?.success && Array.isArray(res.data) ? res.data : [];
        setUserSuggestions(users);
        setSuggestions([]);
      } else {
        const res = await adminSearchDeviceApi(query.trim());
        if (!isMounted.current) return;
        const devices = res?.success && Array.isArray(res.data) ? res.data : [];
        setSuggestions(devices);
        setUserSuggestions([]);
      }
    } catch {
      if (!isMounted.current) return;
      setSuggestions([]);
      setUserSuggestions([]);
    } finally {
      if (isMounted.current) setIsSearching(false);
    }
  }, [isUsersListActive]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setShowDropdown(true);
    if (!val.trim()) {
      setSuggestions([]);
      setUserSuggestions([]);
      setIsSearching(false);
      return;
    }
    runSearch(val);
  };

const handleDeviceSelect = (item: any) => {
  const q = item.deviceName || item.companyName || "";
  setSearchQuery(q);
  setSuggestions([]);
  setShowDropdown(false);
  saveRecentSearch(q);
  setRecentSearches(getRecentSearches());

  // ✅ If only 1 suggestion exists, go directly to device page
  if (suggestions.length === 1) {
    navigate("/DeviceData", { state: { deviceId: item._id } });
  } else {
    // Multiple devices found — show the full results page
    navigate(`/SearchResults?query=${encodeURIComponent(q.trim())}`);
  }
};

  const handleUserSelect = (user: any) => {
    setSearchQuery("");
    setSuggestions([]);
    setUserSuggestions([]);
    setShowDropdown(false);
    const name = user.firstName
      ? `${user.firstName} ${user.lastName || ""}`.trim()
      : user.email || "";
    if (name) { saveRecentSearch(name); setRecentSearches(getRecentSearches()); }
    navigate(`/deviceList/${user.userId || user._id}`);
  };

  const handleRecentSelect = (q: string) => {
    setSearchQuery(q);
    setShowDropdown(true);
    runSearch(q);
  };

  const handleClear = () => {
    setSearchQuery("");
    setSuggestions([]);
    setUserSuggestions([]);
    inputRef.current?.focus();
  };

  const handleViewAll = () => {
    const q = searchQuery.trim();
    if (!q) return;
    saveRecentSearch(q);
    setRecentSearches(getRecentSearches());
    setShowDropdown(false);
    navigate(`/SearchResults?query=${encodeURIComponent(q)}`);
  };

  const handleRemoveRecent = (e: React.MouseEvent, q: string) => {
    e.stopPropagation();
    const updated = getRecentSearches().filter((r) => r !== q);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    setRecentSearches(updated);
  };

  const handleClearAllRecent = () => {
    localStorage.removeItem(RECENT_KEY);
    setRecentSearches([]);
  };

  return (
    <header className="sticky top-0 flex w-full bg-white border-gray-200 z-99999 dark:border-gray-800 dark:bg-gray-900 lg:border-b">
      <div className="flex flex-col items-center justify-between grow lg:flex-row lg:px-6">

        {/* ── Top bar ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between w-full gap-2 px-3 py-3 border-b border-gray-200 dark:border-gray-800 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">

          {/* Sidebar toggle */}
          <button
            className="items-center justify-center w-10 h-10 text-gray-500 border-gray-200 rounded-lg z-99999 dark:border-gray-800 lg:flex dark:text-gray-400 lg:h-11 lg:w-11 lg:border"
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
          >
            {isMobileOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z" fill="currentColor"/>
              </svg>
            ) : (
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z" fill="currentColor"/>
              </svg>
            )}
          </button>

          {/* Mobile logo */}
          <Link to="/" className="lg:hidden">
            <img className="dark:hidden" src="./images/logo/d_logo.png" alt="Logo" width={40} height={40} />
            <img className="hidden dark:block" src="./images/logo/d_logo.png" alt="Logo" width={40} height={40} />
          </Link>

          {/* Mobile 3-dot menu */}
          <button
            onClick={() => setApplicationMenuOpen(!isApplicationMenuOpen)}
            className="flex items-center justify-center w-10 h-10 text-gray-700 rounded-lg z-99999 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M5.99902 10.4951C6.82745 10.4951 7.49902 11.1667 7.49902 11.9951V12.0051C7.49902 12.8335 6.82745 13.5051 5.99902 13.5051C5.1706 13.5051 4.49902 12.8335 4.49902 12.0051V11.9951C4.49902 11.1667 5.1706 10.4951 5.99902 10.4951ZM17.999 10.4951C18.8275 10.4951 19.499 11.1667 19.499 11.9951V12.0051C19.499 12.8335 18.8275 13.5051 17.999 13.5051C17.1706 13.5051 16.499 12.8335 16.499 12.0051V11.9951C16.499 11.1667 17.1706 10.4951 17.999 10.4951ZM13.499 11.9951C13.499 11.1667 12.8275 10.4951 11.999 10.4951C11.1706 10.4951 10.499 11.1667 10.499 11.9951V12.0051C10.499 12.8335 11.1706 13.5051 11.999 13.5051C12.8275 13.5051 13.499 12.8335 13.499 12.0051V11.9951Z" fill="currentColor"/>
            </svg>
          </button>

          {/* ── Desktop Search — admin only ──────────────────────────────────── */}
          {isAdmin && (
            <div ref={searchRef} className="relative hidden lg:block xl:w-[430px]">

              <div className={`flex items-center gap-2.5 h-11 rounded-lg border px-4 transition-all duration-200 bg-transparent ${
                showDropdown
                  ? "border-brand-300 dark:border-brand-800 ring-3 ring-brand-500/10"
                  : "border-gray-200 dark:border-gray-800"
              } dark:bg-white/[0.03]`}>

                {isSearching ? (
                  <div className="w-5 h-5 shrink-0 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5 shrink-0 fill-gray-500 dark:fill-gray-400" viewBox="0 0 20 20">
                    <path fillRule="evenodd" clipRule="evenodd" d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"/>
                  </svg>
                )}

                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleInputChange}
                  onFocus={() => setShowDropdown(true)}
                  placeholder={isUsersListActive ? "Search users…" : "Search devices, company…"}
                  className="flex-1 min-w-0 bg-transparent outline-none text-sm text-gray-800 dark:text-white/90 placeholder:text-gray-400 dark:placeholder:text-white/30"
                />

                {searchQuery ? (
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleClear}
                    className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 hover:bg-red-100 hover:text-red-500 transition-all text-xs font-bold"
                  >
                    ×
                  </button>
                ) : (
                  <span className="shrink-0 inline-flex items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 px-[7px] py-[4.5px] text-xs text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
                    <span>⌘</span><span>K</span>
                  </span>
                )}
              </div>

              {/* ── Dropdown ─────────────────────────────────────────────────── */}
              {(showRecent || showResults) && (
                <div className="absolute top-full left-0 mt-1.5 w-full min-w-[340px] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50">

                  {showRecent && (
                    <>
                      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          Recent Searches
                        </p>
                        <button onMouseDown={(e) => e.preventDefault()} onClick={handleClearAllRecent} className="text-[10px] text-red-400 hover:text-red-600 font-medium transition-colors">
                          Clear all
                        </button>
                      </div>
                      <ul>
                        {recentSearches.map((q, i) => (
                          <li key={i} onMouseDown={(e) => e.preventDefault()} onClick={() => handleRecentSelect(q)}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0 group">
                            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{q}</span>
                            <button onMouseDown={(e) => e.preventDefault()} onClick={(e) => handleRemoveRecent(e, q)}
                              className="w-4 h-4 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 opacity-0 group-hover:opacity-100 transition-all text-xs font-bold">×</button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {/* ── User suggestions (only on /allUsers) ─────────────────── */}
                  {showResults && isUsersListActive && userSuggestions.length > 0 && (
                    <>
                      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                          </svg>
                          Users
                        </p>
                      </div>
                      <ul className="max-h-64 overflow-y-auto">
                        {userSuggestions.map((user, i) => (
                          <li key={`user-${i}`} onMouseDown={(e) => e.preventDefault()} onClick={() => handleUserSelect(user)}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-800 cursor-pointer transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0 group">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shrink-0 text-white text-xs font-bold">
                              {(user.firstName?.[0] || user.email?.[0] || "U").toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                                {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName || "Unnamed User"}
                              </p>
                              <p className="text-xs text-gray-400 truncate">{[user.email, user.organization].filter(Boolean).join(" · ")}</p>
                            </div>

                          {/* ✏️ Edit icon — navigates to UpdateUserProfile */}
                          <button
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDropdown(false);
                              navigate(`/UpdateUserProfile/${user._id}`, { state: { user } });
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg 
                            text-gray-500 hover:text-gray-800 hover:bg-blue-100 
                            dark:hover:bg-blue-900/30 
                            opacity-40 group-hover:opacity-100 
                            transition-all shrink-0"
                            title="Edit User"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {/* ── Device suggestions (all other pages) ─────────────────── */}
                  {showResults && !isUsersListActive && suggestions.length > 0 && (
                    <>
                      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
                          </svg>
                          Devices
                        </p>
                      </div>
                      <ul className="max-h-64 overflow-y-auto">
                        {suggestions.map((item, i) => (
                          <li key={`device-${i}`} onMouseDown={(e) => e.preventDefault()} onClick={() => handleDeviceSelect(item)}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shrink-0">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
                              </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{item.deviceName || "Unnamed Device"}</p>
                              <p className="text-xs text-gray-400 truncate">
                                {item.companyName ? `Company: ${item.companyName}` : item.city ? `City: ${item.city}` : item.userId ? `User: ${item.userId}` : item.adminId ? `Admin: ${item.adminId}` : ""}
                              </p>
                            </div>
                            <svg className="w-3.5 h-3.5 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/>
                            </svg>
                          </li>
                        ))}
                      </ul>
                      <button onMouseDown={(e) => e.preventDefault()} onClick={handleViewAll}
                        className="flex items-center justify-center gap-1.5 w-full py-2.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors border-t border-gray-100 dark:border-gray-800">
                        View all results
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/>
                        </svg>
                      </button>
                    </>
                  )}

                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Bottom bar ───────────────────────────────────────────────────── */}
        <div className={`${isApplicationMenuOpen ? "flex" : "hidden"} items-center justify-between w-full gap-4 px-5 py-4 lg:flex shadow-theme-md lg:justify-end lg:px-0 lg:shadow-none`}>
          <div className="flex items-center gap-2 2xsm:gap-3">
            <ThemeToggleButton />
            <NotificationDropdown />
          </div>
          <UserDropdown />
        </div>

      </div>
    </header>
  );
};

export default AppHeader;