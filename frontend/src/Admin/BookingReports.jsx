import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import NavbarNew from "../components/NavbarNew";
import { FiTrendingUp, FiBarChart2, FiPieChart, FiCalendar, FiDownload, FiFilter, FiStar, FiMap, FiUsers, FiDollarSign } from "react-icons/fi";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function BookingReports() {
  const [bookings, setBookings] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("month"); // week, month, year
  const [selectedState, setSelectedState] = useState("all");
  const [stateWiseData, setStateWiseData] = useState([]);
  const [stateWiseRatings, setStateWiseRatings] = useState([]);
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [topStates, setTopStates] = useState([]);
  const [states, setStates] = useState([]);

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];

  useEffect(() => {
    loadReportData();
  }, [dateRange, selectedState]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      // Fetch all bookings
      const { data: bookingList } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });
      setBookings(bookingList || []);

      // Fetch ratings
      const { data: ratingsList } = await supabase
        .from("ratings")
        .select("*");
      setRatings(ratingsList || []);

      // Fetch profiles to get state information
      const { data: profiles } = await supabase
        .from("profiles")
        .select("state");
      
      if (profiles) {
        const uniqueStates = [...new Set(profiles.map(p => p.state).filter(Boolean))].sort();
        setStates(uniqueStates);
      }

      // Process data
      processBookingData(bookingList || [], ratingsList || []);
    } catch (err) {
      console.error("Error loading report data:", err);
    }
    setLoading(false);
  };

  const processBookingData = (bookingList, ratingsList) => {
    // Filter by date range
    const filteredBookings = filterByDateRange(bookingList);

    // State-wise booking distribution
    const stateBookings = {};
    const stateRatings = {};

    filteredBookings.forEach(booking => {
      const state = booking.location?.split(",").pop()?.trim() || "Unknown";
      stateBookings[state] = (stateBookings[state] || 0) + 1;
    });

    // Calculate average ratings by state
    ratingsList.forEach(rating => {
      const state = rating.state || "Unknown";
      if (!stateRatings[state]) {
        stateRatings[state] = { total: 0, count: 0 };
      }
      stateRatings[state].total += rating.rating || 0;
      stateRatings[state].count += 1;
    });

    const stateWiseDataProcessed = Object.entries(stateBookings)
      .map(([state, count]) => ({
        state,
        bookings: count,
        rating: stateRatings[state] 
          ? (stateRatings[state].total / stateRatings[state].count).toFixed(2) 
          : 0,
      }))
      .sort((a, b) => b.bookings - a.bookings);

    setStateWiseData(stateWiseDataProcessed);
    setTopStates(stateWiseDataProcessed.slice(0, 5));

    const stateRatingsData = Object.entries(stateRatings)
      .map(([state, data]) => ({
        state,
        rating: (data.total / data.count).toFixed(2),
        count: data.count,
      }))
      .sort((a, b) => b.rating - a.rating);

    setStateWiseRatings(stateRatingsData.slice(0, 8));

    // Time series data (daily bookings for last 30 days)
    const timeData = {};
    filteredBookings.forEach(booking => {
      const date = new Date(booking.created_at).toLocaleDateString();
      timeData[date] = (timeData[date] || 0) + 1;
    });

    const timeSeriesProcessed = Object.entries(timeData)
      .map(([date, count]) => ({ date, bookings: count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    setTimeSeriesData(timeSeriesProcessed);
  };

  const filterByDateRange = (bookingList) => {
    const now = new Date();
    let startDate = new Date();

    if (dateRange === "week") {
      startDate.setDate(now.getDate() - 7);
    } else if (dateRange === "month") {
      startDate.setMonth(now.getMonth() - 1);
    } else if (dateRange === "year") {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    return bookingList.filter(b => new Date(b.created_at) >= startDate);
  };

  // Calculate stats
  const totalBookings = bookings.length;
  const completedBookings = bookings.filter(b => b.status === "completed").length;
  const averageRating = ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length).toFixed(2)
    : 0;
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);

  const downloadReport = () => {
    const csvContent = [
      ["State", "Bookings", "Rating"],
      ...stateWiseData.map(d => [d.state, d.bookings, d.rating])
    ]
      .map(row => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `booking-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-700">Loading report data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100">
      <NavbarNew />
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
            <FiBarChart2 className="text-blue-600" />
            📊 Booking Reports & Analytics
          </h1>
          <p className="text-slate-600">Comprehensive insights into bookings, ratings, and revenue by state</p>
        </div>

        {/* FILTERS */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8 shadow-md flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <FiFilter className="text-blue-600" />
            <label className="font-medium text-slate-700">Date Range:</label>
          </div>
          <div className="flex gap-2">
            {["week", "month", "year"].map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  dateRange === range
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>

          <div className="ml-auto">
            <button
              onClick={downloadReport}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition shadow-sm"
            >
              <FiDownload /> Download Report
            </button>
          </div>
        </div>

        {/* KEY METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-blue-200 rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Bookings</p>
                <p className="text-4xl font-bold text-blue-600 mt-2">{totalBookings}</p>
              </div>
              <FiBarChart2 className="text-5xl text-blue-100" />
            </div>
          </div>

          <div className="bg-white border border-emerald-200 rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Completed</p>
                <p className="text-4xl font-bold text-emerald-600 mt-2">{completedBookings}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {((completedBookings / totalBookings) * 100).toFixed(1)}% completion
                </p>
              </div>
              <FiTrendingUp className="text-5xl text-emerald-100" />
            </div>
          </div>

          <div className="bg-white border border-amber-200 rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Avg. Rating</p>
                <p className="text-4xl font-bold text-amber-600 mt-2">{averageRating}</p>
                <div className="flex gap-1 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <FiStar
                      key={i}
                      className={`w-3 h-3 ${i < Math.round(averageRating) ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                    />
                  ))}
                </div>
              </div>
              <FiStar className="text-5xl text-amber-100" />
            </div>
          </div>

          <div className="bg-white border border-purple-200 rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Revenue</p>
                <p className="text-4xl font-bold text-purple-600 mt-2">₹{(totalRevenue / 1000).toFixed(1)}K</p>
                <p className="text-xs text-slate-500 mt-1">
                  ₹{(totalRevenue / totalBookings).toFixed(0)}/booking avg
                </p>
              </div>
              <FiDollarSign className="text-5xl text-purple-100" />
            </div>
          </div>
        </div>

        {/* CHARTS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* STATE-WISE BOOKINGS CHART */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <FiMap className="text-blue-600" />
              📍 Bookings by State
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stateWiseData.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="state" stroke="#64748b" style={{ fontSize: "12px" }} />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px" }}
                  formatter={(value) => [value, "Bookings"]}
                />
                <Legend />
                <Bar dataKey="bookings" fill="#3B82F6" name="Bookings" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* STATE-WISE RATINGS CHART */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <FiStar className="text-amber-600" />
              ⭐ Average Ratings by State
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stateWiseRatings}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="state" stroke="#64748b" style={{ fontSize: "12px" }} />
                <YAxis stroke="#64748b" domain={[0, 5]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px" }}
                  formatter={(value) => [value, "Rating"]}
                />
                <Legend />
                <Bar dataKey="rating" fill="#F59E0B" name="Avg Rating" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TIME SERIES CHART */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-md mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <FiTrendingUp className="text-emerald-600" />
            📈 Booking Trends
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                stroke="#64748b" 
                style={{ fontSize: "12px" }}
                tick={{ angle: -45, textAnchor: "end", height: 60 }}
              />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px" }}
                formatter={(value) => [value, "Bookings"]}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="bookings" 
                stroke="#10B981" 
                dot={{ fill: "#10B981", r: 4 }}
                activeDot={{ r: 6 }}
                strokeWidth={2}
                name="Daily Bookings"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* PIE CHART - STATE DISTRIBUTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <FiPieChart className="text-purple-600" />
              🥧 State Distribution (%)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stateWiseData.slice(0, 6)}
                  dataKey="bookings"
                  nameKey="state"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ state, percent }) => `${state} ${(percent * 100).toFixed(0)}%`}
                >
                  {stateWiseData.slice(0, 6).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px" }}
                  formatter={(value) => [value, "Bookings"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* TOP STATES TABLE */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <FiUsers className="text-blue-600" />
              🏆 Top Performing States
            </h2>
            <div className="space-y-3">
              {topStates.map((state, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-200 transition">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{state.state}</p>
                      <p className="text-xs text-slate-500">{state.bookings} bookings</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-amber-600 flex items-center gap-1">
                      {state.rating}
                      <FiStar className="w-4 h-4" />
                    </p>
                    <p className="text-xs text-slate-500">avg rating</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* DETAILED STATE WISE TABLE */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-md">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <FiBarChart2 className="text-blue-600" />
            📋 Detailed State Analysis
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">State</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Total Bookings</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Avg Rating</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">% of Total</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Rank</th>
                </tr>
              </thead>
              <tbody>
                {stateWiseData.map((state, index) => (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-medium text-slate-900">{state.state}</td>
                    <td className="text-center py-3 px-4 text-slate-700">
                      <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                        {state.bookings}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-semibold text-amber-600">{state.rating}</span>
                        <FiStar className="w-4 h-4 text-amber-400" />
                      </div>
                    </td>
                    <td className="text-center py-3 px-4 text-slate-700">
                      {((state.bookings / totalBookings) * 100).toFixed(1)}%
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className={`inline-block w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm ${
                        index < 3 ? "bg-gradient-to-r from-yellow-400 to-yellow-600" : "bg-slate-400"
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
