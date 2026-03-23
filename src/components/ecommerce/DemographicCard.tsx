import { useAppSelector } from "../../store/hooks";
import CountryMap from "./CountryMap";

const CITY_COLORS = ["#3B82F6","#8B5CF6","#EC4899","#F59E0B","#10B981","#F97316","#06B6D4","#6366F1"];

const getAbbr = (city: string) => city.trim().slice(0, 2).toUpperCase();

export default function DemographicCard() {
const customerDemographic = useAppSelector((s) => s.analytics?.customerDemographic ?? []);

// Only show top 5
const cities = customerDemographic.slice(0, 5).map((item, i) => ({
  name:       item.city,
  customers:  item.count,
  percentage: item.percentage,
  color:      CITY_COLORS[i % CITY_COLORS.length],
  abbr:       getAbbr(item.city),
}));

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Customers Demographic
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Number of customers based on city
          </p>
        </div>
      </div>

      <div className="px-4 py-6 my-6 overflow-hidden border border-gray-200 rounded-2xl dark:border-gray-800 sm:px-6">
        <div
          id="mapOne"
          className="-mx-4 -my-6 h-[300px] md:h-[420px] xl:h-[520px]
            w-[320px] sm:w-[400px] md:w-[720px] lg:w-[850px] xl:w-[1000px] sm:-mx-6"
        >
          <CountryMap />
        </div>
      </div>

      {cities.length === 0 ? (
        <p className="text-sm text-center text-gray-400">No city data available</p>
      ) : (
        <div className="space-y-5">
          {cities.map((city) => (
            <div key={city.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-bold"
                  style={{ backgroundColor: city.color }}
                >
                  {city.abbr}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-theme-sm dark:text-white/90">
                    {city.name}
                  </p>
                  <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                    {city.customers.toLocaleString()} Customers
                  </span>
                </div>
              </div>

              <div className="flex w-full max-w-[140px] items-center gap-3">
                <div className="relative block h-2 w-full max-w-[100px] rounded-sm bg-gray-200 dark:bg-gray-800">
                  <div
                    className="absolute left-0 top-0 flex h-full rounded-sm transition-all duration-700"
                    style={{ width: `${city.percentage}%`, backgroundColor: city.color }}
                  />
                </div>
                <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                  {city.percentage}%
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}