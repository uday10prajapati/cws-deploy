import { useEffect, useState } from "react";
import { FiTrendingUp, FiDollarSign, FiRefreshCw } from "react-icons/fi";
import { supabase } from "../supabaseClient";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import NavbarNew from "../components/NavbarNew";

export default function AllRevenue() {
  const [user, setUser] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState("monthly"); // monthly, daily, yearly

  useRoleBasedRedirect("admin");

  useEffect(() => {
    const loadUser = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user) {
        setUser(auth.user);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    loadRevenueData();
  }, []);

  const loadRevenueData = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/admin/all-revenue");
      const result = await response.json();
      if (result.success) {
        setRevenueData(result.data);
      }
    } catch (error) {
      console.error("Error loading revenue:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <FiRefreshCw className="text-4xl animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600">Loading revenue data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* NAVBAR */}
      <NavbarNew />

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-10">

        {/* STATS CARDS */}
        {revenueData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-linear-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-600 text-sm font-semibold">Total Revenue</p>
                <FiDollarSign className="text-blue-600 text-2xl" />
              </div>
              <p className="text-4xl font-bold text-blue-600">
                ₹{revenueData.totalRevenue.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-2">From {revenueData.totalTransactions} transactions</p>
            </div>

            <div className="bg-linear-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-600 text-sm font-semibold">Avg Per Transaction</p>
                <FiTrendingUp className="text-green-600 text-2xl" />
              </div>
              <p className="text-4xl font-bold text-green-600">
                ₹{revenueData.averagePerTransaction.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-2">Average transaction value</p>
            </div>

            <div className="bg-linear-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-600 text-sm font-semibold">Total Transactions</p>
                <FiDollarSign className="text-amber-600 text-2xl" />
              </div>
              <p className="text-4xl font-bold text-amber-600">{revenueData.totalTransactions}</p>
              <p className="text-xs text-slate-500 mt-2">Completed bookings</p>
            </div>
          </div>
        )}

        {/* CHART TABS */}
        <div className="flex gap-2 mb-6 bg-white border border-slate-200 rounded-lg p-2 w-fit shadow-sm">
          <button
            onClick={() => setChartView("daily")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              chartView === "daily"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setChartView("monthly")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              chartView === "monthly"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setChartView("yearly")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              chartView === "yearly"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Yearly
          </button>
        </div>

        {/* BREAKDOWN & CHARTS */}
        {revenueData && Object.keys(revenueData.monthlyBreakdown).length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* DAILY VIEW */}
            {chartView === "daily" && (
              <>
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-lg">
                  <h2 className="text-xl font-semibold mb-6 text-slate-900">Daily Revenue</h2>
                  <div className="space-y-3">
                    {Object.entries(revenueData.dailyBreakdown || {})
                      .sort()
                      .reverse()
                      .slice(0, 7)
                      .map(([day, amount]) => (
                        <div key={day} className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200">
                          <span className="text-sm font-medium text-slate-700">{day}</span>
                          <span className="text-lg font-bold text-blue-600">₹{amount.toLocaleString()}</span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-lg">
                  <h2 className="text-xl font-semibold mb-6 text-slate-900">Daily Chart</h2>
                  <div className="flex items-end justify-between gap-1 h-48 p-4 bg-slate-50 rounded-lg border border-slate-200 overflow-x-auto">
                    {Object.entries(revenueData.dailyBreakdown || {})
                      .sort()
                      .slice(0, 30)
                      .map(([day, amount]) => {
                        const maxAmount = Math.max(
                          ...Object.values(revenueData.dailyBreakdown || {}),
                          1
                        );
                        return (
                          <div
                            key={day}
                            className="flex flex-col items-center gap-2 flex-1 min-w-max"
                          >
                            <div
                              className="w-full bg-linear-to-t from-blue-500 to-blue-400 rounded-t hover:opacity-80 transition group relative cursor-pointer"
                              style={{
                                height: `${(amount / maxAmount) * 120}px`,
                                minHeight: "4px",
                              }}
                            >
                              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-700 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                                ₹{amount.toLocaleString()}
                              </div>
                            </div>
                            <p className="text-xs text-slate-500">{day.split("-")[2]}</p>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </>
            )}

            {/* MONTHLY VIEW */}
            {chartView === "monthly" && (
              <>
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-lg">
                  <h2 className="text-xl font-semibold mb-6 text-slate-900">Monthly Revenue</h2>
                  <div className="space-y-3">
                    {Object.entries(revenueData.monthlyBreakdown)
                      .sort()
                      .reverse()
                      .map(([month, amount]) => (
                        <div key={month} className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200">
                          <span className="text-sm font-medium text-slate-700">{month}</span>
                          <span className="text-lg font-bold text-green-600">₹{amount.toLocaleString()}</span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-lg">
                  <h2 className="text-xl font-semibold mb-6 text-slate-900">Monthly Chart</h2>
                  <div className="flex items-end justify-between gap-2 h-48 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    {Object.entries(revenueData.monthlyBreakdown)
                      .sort()
                      .map(([month, amount]) => {
                        const maxAmount = Math.max(
                          ...Object.values(revenueData.monthlyBreakdown),
                          1
                        );
                        return (
                          <div
                            key={month}
                            className="flex flex-col items-center gap-2 flex-1"
                          >
                            <div
                              className="w-full bg-linear-to-t from-green-500 to-green-400 rounded-t hover:opacity-80 transition group relative cursor-pointer"
                              style={{
                                height: `${(amount / maxAmount) * 120}px`,
                                minHeight: "8px",
                              }}
                            >
                              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-700 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                                ₹{amount.toLocaleString()}
                              </div>
                            </div>
                            <p className="text-xs text-slate-500">{month.split("-")[1]}</p>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </>
            )}

            {/* YEARLY VIEW */}
            {chartView === "yearly" && (
              <>
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-lg">
                  <h2 className="text-xl font-semibold mb-6 text-slate-900">Yearly Revenue</h2>
                  <div className="space-y-3">
                    {Object.entries(revenueData.yearlyBreakdown || {})
                      .sort()
                      .reverse()
                      .map(([year, amount]) => (
                        <div key={year} className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200">
                          <span className="text-sm font-medium text-slate-700">{year}</span>
                          <span className="text-lg font-bold text-purple-600">₹{amount.toLocaleString()}</span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-lg">
                  <h2 className="text-xl font-semibold mb-6 text-slate-900">Yearly Chart</h2>
                  <div className="flex items-end justify-between gap-3 h-48 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    {Object.entries(revenueData.yearlyBreakdown || {})
                      .sort()
                      .map(([year, amount]) => {
                        const maxAmount = Math.max(
                          ...Object.values(revenueData.yearlyBreakdown || {}),
                          1
                        );
                        return (
                          <div
                            key={year}
                            className="flex flex-col items-center gap-2 flex-1"
                          >
                            <div
                              className="w-full bg-linear-to-t from-purple-500 to-purple-400 rounded-t hover:opacity-80 transition group relative cursor-pointer"
                              style={{
                                height: `${(amount / maxAmount) * 120}px`,
                                minHeight: "8px",
                              }}
                            >
                              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-700 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                                ₹{amount.toLocaleString()}
                              </div>
                            </div>
                            <p className="text-xs text-slate-500">{year}</p>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* RECENT TRANSACTIONS */}
        {revenueData?.recentTransactions && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-slate-900">Recent Transactions</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="py-3 px-4 text-left font-semibold text-slate-700">Date</th>
                    <th className="py-3 px-4 text-left font-semibold text-slate-700">Customer</th>
                    <th className="py-3 px-4 text-left font-semibold text-slate-700">Car</th>
                    <th className="py-3 px-4 text-left font-semibold text-slate-700">Service</th>
                    <th className="py-3 px-4 text-left font-semibold text-slate-700">Amount</th>
                    <th className="py-3 px-4 text-left font-semibold text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueData.recentTransactions.map((transaction, idx) => (
                    <tr
                      key={transaction.id || idx}
                      className="border-b border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                    >
                      <td className="py-3 px-4">{transaction.date}</td>
                      <td className="py-3 px-4">{transaction.customer_name || "N/A"}</td>
                      <td className="py-3 px-4">{transaction.car_name || "N/A"}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                          {Array.isArray(transaction.services)
                            ? transaction.services[0]
                            : transaction.services || "Service"}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-green-600">
                        ₹{(transaction.amount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
