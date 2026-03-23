import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchAnalytics } from "../../store/analyticsSlice";
import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";
import DemographicCard from "../../components/ecommerce/DemographicCard";
import PageMeta from "../../components/common/PageMeta";
import { logout } from "../../store/slices/authSlice";
import { verifyToken } from "../../apis/adminApi";
 

export default function Home()  {
  const dispatch   = useAppDispatch();
  const navigate   = useNavigate();
  const token      = useAppSelector((s) => s.auth.token);
  const analytics  = useAppSelector((s) => s.analytics);
  const period     = analytics?.period  ?? 'annually';
  const loading    = analytics?.loading ?? false;
  const error      = analytics?.error   ?? null;

  // ✅ Verify token on page load
  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        navigate('/signin');
        return;
      }

      try {
        const res = await verifyToken(token);

        if (!res.success) {
          dispatch(logout());
          navigate('/signin');
          return;
        }


           navigate('/');

        // // ✅ Role-based redirect
        // const { role } = res.data;
        // if (role === 'superAdmin') navigate('/superadmin/dashboard');
        // else if (role === 'admin')  navigate('/admin/dashboard');
        // else if (role === 'seller') navigate('/seller/dashboard');
        // // else stay on home for 'user'

      } catch (err) {
        dispatch(logout());
        navigate('/signin');
      }
    };

    checkToken();
  }, [token]);

  // ✅ Fetch analytics after token verified
  useEffect(() => {
    dispatch(fetchAnalytics(period));
  }, [dispatch, period]);

  return (
    <>
      <PageMeta
        title="Analysis Dashboard | Deewan Dashboard"
        description="This is Analysis Dashboard page"
      />

      {loading && (
        <div className="flex justify-center py-3">
          <span className="text-sm text-gray-400 animate-pulse">Loading analytics…</span>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          Failed to load analytics: {error}
        </div>
      )}

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6">
          <EcommerceMetrics />
          <MonthlySalesChart />
        </div>
        <div className="col-span-12">
          <StatisticsChart />
        </div>
        <div className="col-span-12">
          <DemographicCard />
        </div>
      </div>
    </>
  );
} 