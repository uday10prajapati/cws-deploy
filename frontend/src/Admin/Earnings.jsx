import { useEffect, useState } from "react";
import { FiTrendingUp, FiDollarSign, FiRefreshCw, FiSearch, FiCalendar, FiDownload, FiEye } from "react-icons/fi";
import { supabase } from "../supabaseClient";
import { generateTransactionPDF, viewTransactionPDF } from "../utils/pdfGenerator";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import NavbarNew from "../components/NavbarNew";

export default function Earnings() {
  const [user, setUser] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all"); // all, today, week, month
  const [villageFilter, setVillageFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [customerProfiles, setCustomerProfiles] = useState({});

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
    loadEarningsData();
  }, []);

  const loadEarningsData = async () => {
    setLoading(true);
    try {
      // Fetch all system earnings/transactions with authentication
      const url = new URL("http://localhost:5000/earnings/transactions/admin");
      if (user?.id) {
        url.searchParams.append('user_id', user.id);
      }
      
      const response = await fetch(url.toString(), {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const result = await response.json();
      if (result.success) {
        setEarnings({
          totalEarnings: parseFloat(result.data.totalEarnings),
          thisMonthEarnings: parseFloat(result.data.thisMonthEarnings),
          totalTransactions: result.data.totalTransactions,
          thisMonthTransactions: result.data.thisMonthTransactions,
        });
        setTransactions(result.data.transactions || []);
        setFilteredTransactions(result.data.transactions || []);
        
        // Fetch customer profiles for all transactions
        const transactionsList = result.data.transactions || [];
        const customerIds = [...new Set(transactionsList.map(t => t.customer_id))];
        
        for (const customerId of customerIds) {
          const profile = await getCustomerProfile(customerId);
          setCustomerProfiles(prev => ({ ...prev, [customerId]: profile }));
        }
      }
    } catch (error) {
      console.error("Error loading earnings:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions based on search and date filter
  useEffect(() => {
    let filtered = transactions;

    // Apply date filter
    if (dateFilter !== "all") {
      const now = new Date();
      let startDate = new Date();

      if (dateFilter === "today") {
        startDate.setHours(0, 0, 0, 0);
      } else if (dateFilter === "week") {
        startDate.setDate(now.getDate() - 7);
      } else if (dateFilter === "month") {
        startDate.setDate(now.getDate() - 30);
      }

      filtered = filtered.filter(t => new Date(t.created_at) >= startDate);
    }

    // Apply search filter by customer name
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t => {
        const profile = customerProfiles[t.customer_id];
        return profile && profile.name && profile.name.toLowerCase().includes(term);
      });
    }

    // Apply village filter
    if (villageFilter) {
      const term = villageFilter.toLowerCase();
      filtered = filtered.filter(t => {
        const profile = customerProfiles[t.customer_id];
        return profile && profile.village && profile.village.toLowerCase().includes(term);
      });
    }

    // Apply city filter
    if (cityFilter) {
      const term = cityFilter.toLowerCase();
      filtered = filtered.filter(t => {
        const profile = customerProfiles[t.customer_id];
        return profile && profile.city && profile.city.toLowerCase().includes(term);
      });
    }

    // Apply state filter
    if (stateFilter) {
      const term = stateFilter.toLowerCase();
      filtered = filtered.filter(t => {
        const profile = customerProfiles[t.customer_id];
        return profile && profile.state && profile.state.toLowerCase().includes(term);
      });
    }

    setFilteredTransactions(filtered);
  }, [searchTerm, dateFilter, villageFilter, cityFilter, stateFilter, transactions, customerProfiles]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  // Get customer profile using customer_id from transaction
  const getCustomerProfile = async (customerId) => {
    try {
      if (!customerId) return null;
      
      // Try to fetch from profiles table using correct column names
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("name, email, phone, village, city, state")
        .eq("id", customerId)
        .single();
      
      if (profile) {
        console.log("Customer profile found:", profile);
        return {
          name: profile.name || 'Customer',
          email: profile.email || 'N/A',
          phone: profile.phone || 'N/A',
          village: profile.village || '',
          city: profile.city || '',
          state: profile.state || ''
        };
      }
      
      // If profiles table doesn't have data, try to get from backend
      try {
        const response = await fetch(`http://localhost:5000/auth/user/${customerId}`);
        const result = await response.json();
        if (result.success && result.user) {
          console.log("Fetching from backend:", result.user);
          return {
            name: result.user.full_name || result.user.email || 'Customer',
            email: result.user.email || 'N/A',
            phone: result.user.phone || 'N/A',
            village: result.user.village || '',
            city: result.user.city || '',
            state: result.user.state || ''
          };
        }
      } catch (backendError) {
        console.log("Backend fetch failed:", backendError);
      }
      
      return {
        name: 'Customer',
        email: 'N/A',
        phone: 'N/A',
        village: '',
        city: '',
        state: ''
      };
    } catch (error) {
      console.error("Error fetching customer profile:", error);
      return {
        name: 'Customer',
        email: 'N/A',
        phone: 'N/A',
        village: '',
        city: '',
        state: ''
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <FiRefreshCw className="text-4xl animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600">Loading earnings data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* NAVBAR */}
      <NavbarNew />

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-2 leading-tight">All System Earnings 💰</h1>
            <p className="text-slate-600 text-base">Complete transaction and earnings overview</p>
          </div>
          <button
            onClick={loadEarningsData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
          >
            <FiRefreshCw /> Refresh
          </button>
        </div>

        {/* STATS CARDS */}
        {earnings && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-3">
                <p className="text-slate-600 text-sm font-semibold">Total Earnings</p>
                <FiDollarSign className="text-blue-600 text-2xl" />
              </div>
              <p className="text-4xl font-bold text-blue-600">
                ₹{earnings.totalEarnings.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-slate-500 mt-2">All time earnings</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-3">
                <p className="text-slate-600 text-sm font-semibold">{new Date().toLocaleString('en-US', { month: 'long' })} Earnings</p>
                <FiCalendar className="text-green-600 text-2xl" />
              </div>
              <p className="text-4xl font-bold text-green-600">
                ₹{earnings.thisMonthEarnings.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-slate-500 mt-2">{earnings.thisMonthTransactions} transactions this month</p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-3">
                <p className="text-slate-600 text-sm font-semibold">Total Transactions</p>
                <FiTrendingUp className="text-amber-600 text-2xl" />
              </div>
              <p className="text-4xl font-bold text-amber-600">{earnings.totalTransactions}</p>
              <p className="text-xs text-slate-500 mt-2">Completed bookings</p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-3">
                <p className="text-slate-600 text-sm font-semibold">Avg Per Transaction</p>
                <span className="text-red-600 text-2xl">📊</span>
              </div>
              <p className="text-4xl font-bold text-red-600">
                ₹{earnings.totalTransactions > 0 ? (earnings.totalEarnings / earnings.totalTransactions).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : 0}
              </p>
              <p className="text-xs text-slate-500 mt-2">Average value</p>
            </div>
          </div>
        )}

        {/* FILTERS AND SEARCH */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Search by Name */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-sm"
            />
            
            {/* Search Suggestions */}
            {searchTerm && (
              <div className="absolute top-full left-0 right-0 bg-white border border-slate-300 border-t-0 rounded-b-lg shadow-lg max-h-48 overflow-y-auto z-10">
                {Object.values(customerProfiles)
                  .filter(profile => profile?.name && profile.name.toLowerCase().startsWith(searchTerm.toLowerCase()))
                  .map((profile, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSearchTerm(profile.name)}
                      className="px-4 py-2 text-slate-700 hover:bg-blue-100 cursor-pointer transition border-b border-slate-100 last:border-b-0"
                    >
                      <p className="font-medium">{profile.name}</p>
                      <p className="text-xs text-slate-500">{profile.email}</p>
                    </div>
                  ))}
                {Object.values(customerProfiles).filter(profile => profile?.name && profile.name.toLowerCase().startsWith(searchTerm.toLowerCase())).length === 0 && (
                  <div className="px-4 py-2 text-slate-500 text-sm">No matching customers</div>
                )}
              </div>
            )}
          </div>

          {/* Date Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
            {[
              { label: "All", value: "all" },
              { label: "Today", value: "today" },
              { label: "Week", value: "week" },
              { label: "Month", value: "month" },
            ].map(filter => (
              <button
                key={filter.value}
                onClick={() => setDateFilter(filter.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  dateFilter === filter.value
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-slate-600 border border-slate-300 hover:border-slate-400"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Location Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Village Filter */}
            <div className="relative">
              <input
                type="text"
                placeholder="Filter by Village..."
                value={villageFilter}
                onChange={(e) => setVillageFilter(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-sm"
              />
              {villageFilter && (
                <div className="absolute top-full left-0 right-0 bg-white border border-slate-300 border-t-0 rounded-b-lg shadow-lg max-h-40 overflow-y-auto z-10">
                  {[...new Set(Object.values(customerProfiles).map(p => p?.village).filter(Boolean))]
                    .filter(village => village.toLowerCase().startsWith(villageFilter.toLowerCase()))
                    .map((village, idx) => (
                      <div
                        key={idx}
                        onClick={() => setVillageFilter(village)}
                        className="px-4 py-2 text-slate-700 hover:bg-blue-100 cursor-pointer transition border-b border-slate-100 last:border-b-0"
                      >
                        {village}
                      </div>
                    ))}
                  {[...new Set(Object.values(customerProfiles).map(p => p?.village).filter(Boolean))].filter(village => village.toLowerCase().startsWith(villageFilter.toLowerCase())).length === 0 && (
                    <div className="px-4 py-2 text-slate-500 text-sm">No villages found</div>
                  )}
                </div>
              )}
            </div>

            {/* City Filter */}
            <div className="relative">
              <input
                type="text"
                placeholder="Filter by City..."
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-sm"
              />
              {cityFilter && (
                <div className="absolute top-full left-0 right-0 bg-white border border-slate-300 border-t-0 rounded-b-lg shadow-lg max-h-40 overflow-y-auto z-10">
                  {[...new Set(Object.values(customerProfiles).map(p => p?.city).filter(Boolean))]
                    .filter(city => city.toLowerCase().startsWith(cityFilter.toLowerCase()))
                    .map((city, idx) => (
                      <div
                        key={idx}
                        onClick={() => setCityFilter(city)}
                        className="px-4 py-2 text-slate-700 hover:bg-blue-100 cursor-pointer transition border-b border-slate-100 last:border-b-0"
                      >
                        {city}
                      </div>
                    ))}
                  {[...new Set(Object.values(customerProfiles).map(p => p?.city).filter(Boolean))].filter(city => city.toLowerCase().startsWith(cityFilter.toLowerCase())).length === 0 && (
                    <div className="px-4 py-2 text-slate-500 text-sm">No cities found</div>
                  )}
                </div>
              )}
            </div>

            {/* State Filter */}
            <div className="relative">
              <input
                type="text"
                placeholder="Filter by State..."
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-sm"
              />
              {stateFilter && (
                <div className="absolute top-full left-0 right-0 bg-white border border-slate-300 border-t-0 rounded-b-lg shadow-lg max-h-40 overflow-y-auto z-10">
                  {[...new Set(Object.values(customerProfiles).map(p => p?.state).filter(Boolean))]
                    .filter(state => state.toLowerCase().startsWith(stateFilter.toLowerCase()))
                    .map((state, idx) => (
                      <div
                        key={idx}
                        onClick={() => setStateFilter(state)}
                        className="px-4 py-2 text-slate-700 hover:bg-blue-100 cursor-pointer transition border-b border-slate-100 last:border-b-0"
                      >
                        {state}
                      </div>
                    ))}
                  {[...new Set(Object.values(customerProfiles).map(p => p?.state).filter(Boolean))].filter(state => state.toLowerCase().startsWith(stateFilter.toLowerCase())).length === 0 && (
                    <div className="px-4 py-2 text-slate-500 text-sm">No states found</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TRANSACTIONS TABLE */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-slate-900">
            <FiTrendingUp className="text-blue-600" />
            All Transactions
          </h2>

          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600 text-lg">
                {searchTerm || dateFilter !== "all" ? "No transactions match your filters." : "No transactions yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-slate-900">Date & Time</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-900">Customer Name</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-900">Type</th>
                    <th className="px-6 py-4 text-center font-semibold text-slate-900">Amount</th>
                    <th className="px-6 py-4 text-center font-semibold text-slate-900">GST</th>
                    <th className="px-6 py-4 text-center font-semibold text-slate-900">Total</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-900">Payment Method</th>
                    <th className="px-6 py-4 text-center font-semibold text-slate-900">Status</th>
                    <th className="px-6 py-4 text-center font-semibold text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction, idx) => (
                    <tr
                      key={transaction.id || idx}
                      className="border-b border-slate-200 hover:bg-slate-50 transition"
                    >
                      <td className="px-6 py-4 text-slate-700">
                        <div className="text-sm">
                          <p className="font-medium">{new Date(transaction.created_at).toLocaleDateString()}</p>
                          <p className="text-xs text-slate-500">{new Date(transaction.created_at).toLocaleTimeString()}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700 text-sm">
                        {customerProfiles[transaction.customer_id]?.name || "Unknown Customer"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold capitalize">
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-900 font-semibold">
                        ₹{parseFloat(transaction.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-600 text-sm">
                        {transaction.gst ? `₹${parseFloat(transaction.gst).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : "—"}
                      </td>
                      <td className="px-6 py-4 text-right text-green-600 font-bold">
                        ₹{parseFloat(transaction.total_amount || transaction.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs capitalize">
                          {transaction.payment_method || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded text-xs font-semibold capitalize ${
                          transaction.status === 'success'
                            ? 'bg-green-100 text-green-700'
                            : transaction.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {transaction.status === 'success' ? (
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={async () => {
                                const customerProfile = await getCustomerProfile(transaction.customer_id);
                                viewTransactionPDF(transaction, { name: customerProfile?.name || 'Customer', email: customerProfile?.email || 'N/A', phone: customerProfile?.phone || 'N/A' }, 'customer');
                              }}
                              className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
                              title="View PDF Invoice"
                            >
                              <FiEye size={14} />
                            </button>
                            <button
                              onClick={async () => {
                                const customerProfile = await getCustomerProfile(transaction.customer_id);
                                generateTransactionPDF(transaction, { name: customerProfile?.name || 'Customer', email: customerProfile?.email || 'N/A', phone: customerProfile?.phone || 'N/A' }, 'customer');
                              }}
                              className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs transition-colors"
                              title="Download PDF Invoice"
                            >
                              <FiDownload size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TABLE INFO */}
          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-sm text-slate-600">
            <p>Showing {filteredTransactions.length} of {transactions.length} transactions</p>
            {filteredTransactions.length > 0 && (
              <p className="text-green-600 font-semibold">
                Total: ₹{filteredTransactions.reduce((sum, t) => sum + (parseFloat(t.total_amount || t.amount) || 0), 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
