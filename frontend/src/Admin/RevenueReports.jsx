import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import NavbarNew from "../components/NavbarNew";
import { FiTrendingUp, FiBarChart2, FiPieChart, FiDownload, FiFilter, FiDollarSign, FiMapPin, FiCreditCard, FiCalendar } from "react-icons/fi";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";

export default function RevenueReports() {
  const [transactions, setTransactions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("month");
  const [villageRevenueData, setVillageRevenueData] = useState([]);
  const [cityRevenueData, setCityRevenueData] = useState([]);
  const [paymentMethodData, setPaymentMethodData] = useState([]);
  const [timeSeriesRevenue, setTimeSeriesRevenue] = useState([]);
  const [topVillages, setTopVillages] = useState([]);
  const [topCities, setTopCities] = useState([]);

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];

  useEffect(() => {
    loadRevenueData();
  }, [dateRange]);

  const loadRevenueData = async () => {
    setLoading(true);
    try {
      // Fetch transactions (revenue data)
      const { data: transactionList } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });
      setTransactions(transactionList || []);

      // Fetch bookings for correlation
      const { data: bookingList } = await supabase
        .from("bookings")
        .select("*");
      setBookings(bookingList || []);

      // Fetch profiles to get location data
      const { data: profilesList } = await supabase
        .from("profiles")
        .select("id, village, city, state");
      setProfiles(profilesList || []);

      // Process revenue data
      processRevenueData(transactionList || [], bookingList || [], profilesList || []);
    } catch (err) {
      console.error("Error loading revenue data:", err);
    }
    setLoading(false);
  };

  const processRevenueData = (transactionList, bookingList, profilesList) => {
    const filteredTransactions = filterByDateRange(transactionList);

    // Create location lookup map
    const profileMap = {};
    profilesList.forEach(profile => {
      profileMap[profile.id] = profile;
    });

    // Process village-wise revenue
    const villageRevenue = {};
    const cityRevenue = {};
    const paymentMethod = {};
    let totalRevenue = 0;

    filteredTransactions.forEach(tx => {
      const profile = profileMap[tx.customer_id];
      const village = profile?.village || "Unknown Village";
      const city = profile?.city || "Unknown City";
      const amount = tx.amount || 0;
      const method = tx.payment_method || "Unknown";

      totalRevenue += amount;

      // Village-wise
      if (!villageRevenue[village]) {
        villageRevenue[village] = { revenue: 0, count: 0, city: city };
      }
      villageRevenue[village].revenue += amount;
      villageRevenue[village].count += 1;

      // City-wise
      if (!cityRevenue[city]) {
        cityRevenue[city] = { revenue: 0, count: 0 };
      }
      cityRevenue[city].revenue += amount;
      cityRevenue[city].count += 1;

      // Payment method
      if (!paymentMethod[method]) {
        paymentMethod[method] = 0;
      }
      paymentMethod[method] += amount;
    });

    // Convert to array and sort
    const villageData = Object.entries(villageRevenue)
      .map(([village, data]) => ({
        village,
        city: data.city,
        revenue: (data.revenue / 1000).toFixed(2), // Convert to thousands
        count: data.count,
        avg: (data.revenue / data.count).toFixed(0),
      }))
      .sort((a, b) => parseFloat(b.revenue) - parseFloat(a.revenue));

    const cityData = Object.entries(cityRevenue)
      .map(([city, data]) => ({
        city,
        revenue: (data.revenue / 1000).toFixed(2),
        count: data.count,
        avg: (data.revenue / data.count).toFixed(0),
      }))
      .sort((a, b) => parseFloat(b.revenue) - parseFloat(a.revenue));

    const paymentData = Object.entries(paymentMethod)
      .map(([method, amount]) => ({
        method,
        amount: parseFloat(amount),
      }))
      .sort((a, b) => b.amount - a.amount);

    setVillageRevenueData(villageData);
    setCityRevenueData(cityData);
    setPaymentMethodData(paymentData);
    setTopVillages(villageData.slice(0, 5));
    setTopCities(cityData.slice(0, 5));

    // Time series revenue
    const timeData = {};
    filteredTransactions.forEach(tx => {
      const date = new Date(tx.created_at).toLocaleDateString();
      timeData[date] = (timeData[date] || 0) + (tx.amount || 0);
    });

    const timeSeriesProcessed = Object.entries(timeData)
      .map(([date, amount]) => ({
        date,
        revenue: parseFloat((amount / 1000).toFixed(2)),
        amount: amount,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    setTimeSeriesRevenue(timeSeriesProcessed);
  };

  const filterByDateRange = (transactionList) => {
    const now = new Date();
    let startDate = new Date();

    if (dateRange === "week") {
      startDate.setDate(now.getDate() - 7);
    } else if (dateRange === "month") {
      startDate.setMonth(now.getMonth() - 1);
    } else if (dateRange === "year") {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    return transactionList.filter(t => new Date(t.created_at) >= startDate);
  };

  // Calculate statistics
  const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const avgTransactionValue = transactions.length > 0 ? (totalRevenue / transactions.length).toFixed(0) : 0;
  const successfulTransactions = transactions.filter(t => t.status === "success").length;
  const successRate = transactions.length > 0 ? ((successfulTransactions / transactions.length) * 100).toFixed(1) : 0;

  const downloadReport = () => {
    const csvContent = [
      ["Revenue Analysis Report"],
      ["Generated:", new Date().toLocaleString()],
      [],
      ["Total Revenue", `₹${totalRevenue.toFixed(0)}`],
      ["Successful Transactions", successfulTransactions],
      ["Success Rate", `${successRate}%`],
      [],
      ["Village-wise Breakdown"],
      ["Village", "Revenue (₹K)", "Transactions", "Avg Value"],
      ...villageRevenueData.slice(0, 10).map(v => [v.village, v.revenue, v.count, v.avg]),
      [],
      ["City-wise Breakdown"],
      ["City", "Revenue (₹K)", "Transactions", "Avg Value"],
      ...cityRevenueData.slice(0, 10).map(c => [c.city, c.revenue, c.count, c.avg])
    ]
      .map(row => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenue-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-green-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-700">Loading revenue data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-green-50 to-slate-100">
      <NavbarNew />
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
            <FiDollarSign className="text-emerald-600" />
            💰 Revenue & Finance Reports
          </h1>
          <p className="text-slate-600">Analyze revenue trends, location-wise spending, and payment patterns</p>
        </div>

        {/* FILTERS */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8 shadow-md flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <FiFilter className="text-emerald-600" />
            <label className="font-medium text-slate-700">Date Range:</label>
          </div>
          <div className="flex gap-2">
            {["week", "month", "year"].map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  dateRange === range
                    ? "bg-emerald-600 text-white"
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
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition shadow-sm"
            >
              <FiDownload /> Download Report
            </button>
          </div>
        </div>

        {/* KEY METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-emerald-200 rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Revenue</p>
                <p className="text-4xl font-bold text-emerald-600 mt-2">₹{(totalRevenue / 1000).toFixed(1)}K</p>
                <p className="text-xs text-slate-500 mt-1">{transactions.length} transactions</p>
              </div>
              <FiDollarSign className="text-5xl text-emerald-100" />
            </div>
          </div>

          <div className="bg-white border border-blue-200 rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Avg Transaction</p>
                <p className="text-4xl font-bold text-blue-600 mt-2">₹{avgTransactionValue}</p>
                <p className="text-xs text-slate-500 mt-1">per transaction</p>
              </div>
              <FiCreditCard className="text-5xl text-blue-100" />
            </div>
          </div>

          <div className="bg-white border border-amber-200 rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Success Rate</p>
                <p className="text-4xl font-bold text-amber-600 mt-2">{successRate}%</p>
                <p className="text-xs text-slate-500 mt-1">{successfulTransactions} successful</p>
              </div>
              <FiTrendingUp className="text-5xl text-amber-100" />
            </div>
          </div>

          <div className="bg-white border border-purple-200 rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Top Location</p>
                <p className="text-2xl font-bold text-purple-600 mt-2">{topCities[0]?.city || "N/A"}</p>
                <p className="text-xs text-slate-500 mt-1">₹{topCities[0]?.revenue}K spent</p>
              </div>
              <FiMapPin className="text-5xl text-purple-100" />
            </div>
          </div>
        </div>

        {/* REVENUE TRENDS CHART */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-md mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <FiTrendingUp className="text-emerald-600" />
            📈 Revenue Trends Over Time
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timeSeriesRevenue}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
                </linearGradient>
              </defs>
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
                formatter={(value) => [`₹${value}K`, "Revenue"]}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10B981" 
                fillOpacity={1} 
                fill="url(#colorRevenue)"
                name="Daily Revenue"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* TWO COLUMN CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* VILLAGE-WISE REVENUE */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <FiMapPin className="text-blue-600" />
              🏘️ Revenue by Village
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={villageRevenueData.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="village" stroke="#64748b" style={{ fontSize: "11px" }} />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px" }}
                  formatter={(value) => [`₹${value}K`, "Revenue"]}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#3B82F6" name="Revenue (₹K)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* CITY-WISE REVENUE */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <FiMapPin className="text-green-600" />
              🏙️ Revenue by City
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cityRevenueData.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="city" stroke="#64748b" style={{ fontSize: "11px" }} />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px" }}
                  formatter={(value) => [`₹${value}K`, "Revenue"]}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#10B981" name="Revenue (₹K)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PAYMENT METHOD & LOCATION PIE CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* PAYMENT METHOD DISTRIBUTION */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <FiCreditCard className="text-purple-600" />
              💳 Payment Methods
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  dataKey="amount"
                  nameKey="method"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ method, percent }) => `${method} ${(percent * 100).toFixed(0)}%`}
                >
                  {paymentMethodData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px" }}
                  formatter={(value) => `₹${(value / 1000).toFixed(1)}K`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* CITY DISTRIBUTION */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <FiPieChart className="text-amber-600" />
              🥧 Revenue Distribution (Cities)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={cityRevenueData.slice(0, 6)}
                  dataKey="revenue"
                  nameKey="city"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ city, percent }) => `${city} ${(percent * 100).toFixed(0)}%`}
                >
                  {cityRevenueData.slice(0, 6).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px" }}
                  formatter={(value) => `₹${value}K`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TOP VILLAGES & CITIES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* TOP VILLAGES */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <FiTrendingUp className="text-blue-600" />
              🏆 Top Earning Villages
            </h2>
            <div className="space-y-3">
              {topVillages.map((village, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-transparent rounded-lg border border-blue-200 hover:border-blue-300 transition">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{village.village}</p>
                      <p className="text-xs text-slate-500">{village.count} transactions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600">₹{village.revenue}K</p>
                    <p className="text-xs text-slate-500">₹{village.avg} avg</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TOP CITIES */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <FiTrendingUp className="text-green-600" />
              🏆 Top Earning Cities
            </h2>
            <div className="space-y-3">
              {topCities.map((city, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-transparent rounded-lg border border-green-200 hover:border-green-300 transition">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{city.city}</p>
                      <p className="text-xs text-slate-500">{city.count} transactions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600">₹{city.revenue}K</p>
                    <p className="text-xs text-slate-500">₹{city.avg} avg</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* DETAILED VILLAGE ANALYSIS TABLE */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-md mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <FiBarChart2 className="text-blue-600" />
            📋 Detailed Village Revenue Analysis
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Village</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">City</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Revenue (₹K)</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Transactions</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Avg Value</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {villageRevenueData.slice(0, 15).map((village, index) => (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-medium text-slate-900">{village.village}</td>
                    <td className="py-3 px-4 text-slate-700">{village.city}</td>
                    <td className="text-center py-3 px-4">
                      <span className="inline-block bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold">
                        ₹{village.revenue}K
                      </span>
                    </td>
                    <td className="text-center py-3 px-4 text-slate-700">{village.count}</td>
                    <td className="text-center py-3 px-4 text-slate-700 font-medium">₹{village.avg}</td>
                    <td className="text-center py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500"
                            style={{
                              width: `${(parseFloat(village.revenue) / parseFloat(villageRevenueData[0]?.revenue)) * 100}%`
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-600">
                          {((parseFloat(village.revenue) / villageRevenueData.reduce((sum, v) => sum + parseFloat(v.revenue), 0)) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* DETAILED CITY ANALYSIS TABLE */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-md">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <FiBarChart2 className="text-green-600" />
            📋 Detailed City Revenue Analysis
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">City</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Revenue (₹K)</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Transactions</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Avg Value</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">% of Total</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Rank</th>
                </tr>
              </thead>
              <tbody>
                {cityRevenueData.map((city, index) => (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-medium text-slate-900">{city.city}</td>
                    <td className="text-center py-3 px-4">
                      <span className="inline-block bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold">
                        ₹{city.revenue}K
                      </span>
                    </td>
                    <td className="text-center py-3 px-4 text-slate-700">{city.count}</td>
                    <td className="text-center py-3 px-4 text-slate-700 font-medium">₹{city.avg}</td>
                    <td className="text-center py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                            style={{
                              width: `${(parseFloat(city.revenue) / parseFloat(cityRevenueData[0]?.revenue)) * 100}%`
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-600">
                          {((parseFloat(city.revenue) / cityRevenueData.reduce((sum, c) => sum + parseFloat(c.revenue), 0)) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className={`inline-block w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-sm ${
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
