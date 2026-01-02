import React, { useEffect, useState } from "react";
import { FiAward, FiTrendingUp, FiUsers, FiBarChart2 } from "react-icons/fi";
import NavbarNew from "../components/NavbarNew";


const AdminLoyaltyDashboard = () => {
  const [dailySummary, setDailySummary] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("summary"); // summary, leaderboard

  useEffect(() => {
    fetchData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      // Fetch daily summary
      const summaryRes = await fetch("http://localhost:5000/loyalty/admin/daily-summary");
      const summaryData = await summaryRes.json();
      if (summaryData.success) {
        setDailySummary(summaryData);
      }

      // Fetch leaderboard
      const leaderboardRes = await fetch("http://localhost:5000/loyalty/loyalty/leaderboard");
      const leaderboardData = await leaderboardRes.json();
      if (leaderboardData.success) {
        setLeaderboard(leaderboardData.leaderboard || []);
      }
    } catch (error) {
      console.error("Error fetching loyalty data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-slate-400">Loading loyalty dashboard...</p>
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100">
    {/* Navbar (same as Riders page) */}
    <NavbarNew />

    <main className="flex-1 overflow-auto">
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-linear-to-r from-yellow-500 to-orange-500 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FiAward size={32} />
              <div>
                <h2 className="text-2xl font-bold">Washer Loyalty Points</h2>
                <p className="text-yellow-100 text-sm">
                  Monitor daily wash activity and points earned
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold">
                {dailySummary?.summary.total_cars_washed || 0}
              </p>
              <p className="text-yellow-100 text-sm">Cars Washed Today</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-2">
              <FiUsers className="text-blue-600" />
              <p className="text-slate-600 font-semibold text-sm">
                Active Washers
              </p>
            </div>
            <p className="text-3xl font-bold text-blue-600">
              {dailySummary?.summary.active_washers || 0}
            </p>
            <p className="text-slate-400 text-xs mt-1">Worked today</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-2">
              <FiBarChart2 className="text-green-600" />
              <p className="text-slate-600 font-semibold text-sm">
                Total Washes
              </p>
            </div>
            <p className="text-3xl font-bold text-green-600">
              {dailySummary?.summary.total_cars_washed || 0}
            </p>
            <p className="text-slate-400 text-xs mt-1">Today</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-2">
              <FiAward className="text-yellow-600" />
              <p className="text-slate-600 font-semibold text-sm">
                Points Earned
              </p>
            </div>
            <p className="text-3xl font-bold text-yellow-600">
              {dailySummary?.summary.total_points_earned || 0}
            </p>
            <p className="text-slate-400 text-xs mt-1">Today</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-2">
              <FiTrendingUp className="text-purple-600" />
              <p className="text-slate-600 font-semibold text-sm">
                Avg / Washer
              </p>
            </div>
            <p className="text-3xl font-bold text-purple-600">
              {dailySummary?.summary.average_cars_per_washer || 0}
            </p>
            <p className="text-slate-400 text-xs mt-1">Cars per washer</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-slate-200">
          <button
            onClick={() => setActiveTab("summary")}
            className={`pb-3 font-semibold transition ${
              activeTab === "summary"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Today’s Summary
          </button>
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`pb-3 font-semibold transition ${
              activeTab === "leaderboard"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            All-Time Leaderboard
          </button>
        </div>

        {/* Today's Summary */}
        {activeTab === "summary" && (
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900">
              <FiBarChart2 className="text-blue-600" />
              Today’s Active Washers
            </h3>

            {!dailySummary?.washers?.length ? (
              <p className="text-center text-slate-500 py-10">
                No washers worked today
              </p>
            ) : (
              <div className="space-y-3">
                {dailySummary.washers.map((washer, index) => (
                  <div
                    key={washer.id}
                    className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {washer.profiles?.name || "Unknown Washer"}
                        </p>
                        <p className="text-sm text-slate-500">
                          {washer.profiles?.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8 text-right">
                      <div>
                        <p className="text-xl font-bold text-green-600">
                          {washer.cars_washed_today}
                        </p>
                        <p className="text-xs text-slate-500">Today</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-yellow-600">
                          {washer.total_points}
                        </p>
                        <p className="text-xs text-slate-500">Points</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-purple-600">
                          {washer.cars_washed_all_time}
                        </p>
                        <p className="text-xs text-slate-500">All-time</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Leaderboard */}
        {activeTab === "leaderboard" && (
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900">
              <FiAward className="text-yellow-600" />
              All-Time Loyalty Leaderboard
            </h3>

            {!leaderboard.length ? (
              <p className="text-center text-slate-500 py-10">
                No leaderboard data yet
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left">Rank</th>
                      <th className="px-4 py-3 text-left">Washer</th>
                      <th className="px-4 py-3 text-right">Points</th>
                      <th className="px-4 py-3 text-right">All-Time</th>
                      <th className="px-4 py-3 text-right">Today</th>
                      <th className="px-4 py-3 text-right">Last Wash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((washer, index) => (
                      <tr
                        key={washer.id}
                        className="border-t border-slate-200 hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 font-bold">
                          #{index + 1}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">
                            {washer.profiles?.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {washer.profiles?.email}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-yellow-600">
                          {washer.total_points}
                        </td>
                        <td className="px-4 py-3 text-right text-green-600 font-semibold">
                          {washer.cars_washed_all_time}
                        </td>
                        <td className="px-4 py-3 text-right text-blue-600 font-semibold">
                          {washer.cars_washed_today}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500">
                          {washer.last_wash_date
                            ? new Date(washer.last_wash_date).toLocaleDateString()
                            : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  </div>
);
};

export default AdminLoyaltyDashboard;
