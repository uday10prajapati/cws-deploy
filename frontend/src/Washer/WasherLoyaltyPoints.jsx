import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { FiAward, FiTrendingUp, FiCalendar } from "react-icons/fi";

const WasherLoyaltyPoints = () => {
  const [user, setUser] = useState(null);
  const [loyalty, setLoyalty] = useState(null);
  const [washHistory, setWashHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // overview, history, leaderboard

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (auth?.user) {
          setUser(auth.user);
          await fetchLoyaltyData(auth.user.id);
          await fetchWashHistory(auth.user.id);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const fetchLoyaltyData = async (userId) => {
    try {
      const res = await fetch(`http://localhost:5000/loyalty/loyalty/${userId}`);
      const data = await res.json();
      if (data.success) {
        setLoyalty(data.loyalty);
      }
    } catch (error) {
      console.error("Error fetching loyalty data:", error);
    }
  };

  const fetchWashHistory = async (userId) => {
    try {
      const res = await fetch(`http://localhost:5000/loyalty/history/${userId}?days=30`);
      const data = await res.json();
      if (data.success) {
        setWashHistory(data.history || []);
      }
    } catch (error) {
      console.error("Error fetching wash history:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <p className="text-white text-lg">Loading loyalty data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <FiAward size={40} className="text-white" />
              <div>
                <h1 className="text-3xl font-bold text-white">Loyalty Points</h1>
                <p className="text-yellow-100 text-sm">Earn 1 point per car you wash</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-5xl font-bold text-white">{loyalty?.total_points || 0}</p>
              <p className="text-yellow-100 text-sm">Total Points</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Today's Washes */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <FiCalendar className="text-blue-400" size={24} />
              <h3 className="text-slate-300 font-semibold">Today's Washes</h3>
            </div>
            <p className="text-4xl font-bold text-blue-400">
              {loyalty?.cars_washed_today || 0}
            </p>
            <p className="text-slate-400 text-sm mt-2">
              +{loyalty?.cars_washed_today || 0} points today
            </p>
          </div>

          {/* All-Time Washes */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <FiTrendingUp className="text-green-400" size={24} />
              <h3 className="text-slate-300 font-semibold">All-Time Washes</h3>
            </div>
            <p className="text-4xl font-bold text-green-400">
              {loyalty?.cars_washed_all_time || 0}
            </p>
            <p className="text-slate-400 text-sm mt-2">Total cars washed</p>
          </div>

          {/* Last Wash */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <FiCalendar className="text-purple-400" size={24} />
              <h3 className="text-slate-300 font-semibold">Last Wash</h3>
            </div>
            <p className="text-2xl font-bold text-purple-400">
              {loyalty?.last_wash_date
                ? new Date(loyalty.last_wash_date).toLocaleDateString()
                : "N/A"}
            </p>
            <p className="text-slate-400 text-sm mt-2">Date of last wash</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-700">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-3 font-semibold transition border-b-2 ${
              activeTab === "overview"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-6 py-3 font-semibold transition border-b-2 ${
              activeTab === "history"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Wash History (30 days)
          </button>
        </div>

        {/* Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Points Breakdown */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <FiAward className="text-yellow-400" />
                Points Breakdown
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-slate-700/30 rounded-lg">
                  <div>
                    <p className="text-slate-300 font-semibold">Total Points Earned</p>
                    <p className="text-sm text-slate-400">All time</p>
                  </div>
                  <p className="text-3xl font-bold text-yellow-400">
                    {loyalty?.total_points || 0}
                  </p>
                </div>

                <div className="flex justify-between items-center p-4 bg-slate-700/30 rounded-lg">
                  <div>
                    <p className="text-slate-300 font-semibold">Points Today</p>
                    <p className="text-sm text-slate-400">Cars washed today</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-400">
                    {loyalty?.cars_washed_today || 0}
                  </p>
                </div>

                <div className="mt-6 p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg">
                  <p className="text-sm text-slate-300 mb-2">💡 How it works:</p>
                  <ul className="text-sm text-slate-400 space-y-1">
                    <li>✓ 1 point = 1 car washed</li>
                    <li>✓ Points reset daily (cars_washed_today)</li>
                    <li>✓ Total points accumulate over time</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Rewards Info */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-6">🎁 Rewards Tier</h3>
              <div className="space-y-3">
                <div className={`p-4 rounded-lg border-2 ${
                  (loyalty?.total_points || 0) >= 100
                    ? "border-gold bg-yellow-500/10"
                    : "border-slate-600 opacity-50"
                }`}>
                  <p className="font-semibold text-slate-200">Gold Tier</p>
                  <p className="text-sm text-slate-400">100+ points</p>
                  <p className="text-xs text-slate-500 mt-2">🏆 Top performer badge</p>
                </div>

                <div className={`p-4 rounded-lg border-2 ${
                  (loyalty?.total_points || 0) >= 50
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-slate-600 opacity-50"
                }`}>
                  <p className="font-semibold text-slate-200">Silver Tier</p>
                  <p className="text-sm text-slate-400">50+ points</p>
                  <p className="text-xs text-slate-500 mt-2">⭐ Reliable performer</p>
                </div>

                <div className={`p-4 rounded-lg border-2 ${
                  (loyalty?.total_points || 0) >= 20
                    ? "border-green-500 bg-green-500/10"
                    : "border-slate-600 opacity-50"
                }`}>
                  <p className="font-semibold text-slate-200">Bronze Tier</p>
                  <p className="text-sm text-slate-400">20+ points</p>
                  <p className="text-xs text-slate-500 mt-2">🎯 Good start</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wash History */}
        {activeTab === "history" && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-6">Wash History - Last 30 Days</h3>

            {washHistory.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400 text-lg">No wash history found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="px-4 py-3 text-left text-slate-300 font-semibold">Date</th>
                      <th className="px-4 py-3 text-left text-slate-300 font-semibold">Car</th>
                      <th className="px-4 py-3 text-left text-slate-300 font-semibold">Plate</th>
                      <th className="px-4 py-3 text-left text-slate-300 font-semibold">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {washHistory.map((wash) => (
                      <tr
                        key={wash.id}
                        className="border-b border-slate-700 hover:bg-slate-700/20 transition"
                      >
                        <td className="px-4 py-3 text-slate-300">
                          {new Date(wash.wash_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {wash.cars?.brand} {wash.cars?.model}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          <span className="font-mono bg-slate-700/50 px-2 py-1 rounded">
                            {wash.cars?.number_plate}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full font-semibold">
                            +1 point
                          </span>
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
    </div>
  );
};

export default WasherLoyaltyPoints;
