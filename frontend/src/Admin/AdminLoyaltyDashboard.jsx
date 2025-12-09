import React, { useEffect, useState } from "react";
import { FiAward, FiTrendingUp, FiUsers, FiBarChart2 } from "react-icons/fi";

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
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg p-6 text-white">
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
            <p className="text-4xl font-bold">{dailySummary?.summary.total_cars_washed || 0}</p>
            <p className="text-yellow-100 text-sm">Cars Washed Today</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Active Washers */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <FiUsers className="text-blue-400" size={20} />
            <p className="text-slate-300 font-semibold text-sm">Active Washers</p>
          </div>
          <p className="text-3xl font-bold text-blue-400">
            {dailySummary?.summary.active_washers || 0}
          </p>
          <p className="text-slate-400 text-xs mt-2">Worked today</p>
        </div>

        {/* Total Cars Washed */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <FiBarChart2 className="text-green-400" size={20} />
            <p className="text-slate-300 font-semibold text-sm">Total Washes</p>
          </div>
          <p className="text-3xl font-bold text-green-400">
            {dailySummary?.summary.total_cars_washed || 0}
          </p>
          <p className="text-slate-400 text-xs mt-2">Today's total</p>
        </div>

        {/* Points Earned Today */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <FiAward className="text-yellow-400" size={20} />
            <p className="text-slate-300 font-semibold text-sm">Points Earned</p>
          </div>
          <p className="text-3xl font-bold text-yellow-400">
            {dailySummary?.summary.total_points_earned || 0}
          </p>
          <p className="text-slate-400 text-xs mt-2">Today's points</p>
        </div>

        {/* Average Per Washer */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <FiTrendingUp className="text-purple-400" size={20} />
            <p className="text-slate-300 font-semibold text-sm">Avg/Washer</p>
          </div>
          <p className="text-3xl font-bold text-purple-400">
            {dailySummary?.summary.average_cars_per_washer || 0}
          </p>
          <p className="text-slate-400 text-xs mt-2">Cars per washer</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700">
        <button
          onClick={() => setActiveTab("summary")}
          className={`px-6 py-3 font-semibold transition border-b-2 ${
            activeTab === "summary"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          Today's Summary
        </button>
        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`px-6 py-3 font-semibold transition border-b-2 ${
            activeTab === "leaderboard"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          All-Time Leaderboard
        </button>
      </div>

      {/* Today's Summary */}
      {activeTab === "summary" && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <FiBarChart2 className="text-blue-400" />
            Today's Active Washers
          </h3>

          {!dailySummary?.washers || dailySummary.washers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">No washers worked today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dailySummary.washers.map((washer, index) => (
                <div
                  key={washer.id}
                  className="flex items-center justify-between p-4 bg-slate-700/20 rounded-lg hover:bg-slate-700/40 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {washer.profiles?.full_name || "Unknown Washer"}
                      </p>
                      <p className="text-sm text-slate-400">
                        {washer.profiles?.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <p className="text-2xl font-bold text-green-400">
                        {washer.cars_washed_today}
                      </p>
                      <p className="text-xs text-slate-400">Today</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-yellow-400">
                        {washer.total_points}
                      </p>
                      <p className="text-xs text-slate-400">Total</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-400">
                        {washer.cars_washed_all_time}
                      </p>
                      <p className="text-xs text-slate-400">All-time</p>
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
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <FiAward className="text-yellow-400" />
            All-Time Loyalty Points Leaderboard
          </h3>

          {leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">No leaderboard data yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="px-4 py-3 text-left text-slate-300 font-semibold">Rank</th>
                    <th className="px-4 py-3 text-left text-slate-300 font-semibold">Washer</th>
                    <th className="px-4 py-3 text-right text-slate-300 font-semibold">
                      Total Points
                    </th>
                    <th className="px-4 py-3 text-right text-slate-300 font-semibold">
                      All-Time Washes
                    </th>
                    <th className="px-4 py-3 text-right text-slate-300 font-semibold">
                      Today's Washes
                    </th>
                    <th className="px-4 py-3 text-right text-slate-300 font-semibold">
                      Last Wash
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((washer, index) => {
                    let medalEmoji = "";
                    if (index === 0) medalEmoji = "🥇";
                    else if (index === 1) medalEmoji = "🥈";
                    else if (index === 2) medalEmoji = "🥉";

                    return (
                      <tr
                        key={washer.id}
                        className="border-b border-slate-700 hover:bg-slate-700/20 transition"
                      >
                        <td className="px-4 py-3 font-bold text-slate-300">
                          {medalEmoji || `#${index + 1}`}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-white font-semibold">
                              {washer.profiles?.full_name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {washer.profiles?.email}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full font-bold">
                            {washer.total_points}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-green-400 font-semibold">
                          {washer.cars_washed_all_time}
                        </td>
                        <td className="px-4 py-3 text-right text-blue-400 font-semibold">
                          {washer.cars_washed_today}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-400">
                          {washer.last_wash_date
                            ? new Date(washer.last_wash_date).toLocaleDateString()
                            : "N/A"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminLoyaltyDashboard;
