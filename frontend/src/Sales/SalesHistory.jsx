import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import NavbarNew from "../components/NavbarNew";
import { FiCalendar, FiUsers, FiCheck, FiMapPin  } from "react-icons/fi";

export default function SalesHistory() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [salesHistory, setSalesHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArea, setSelectedArea] = useState("all");
  const [assignedArea, setAssignedArea] = useState("Ankleshwar");

  useRoleBasedRedirect("sales");

  const areas = [
    "Ankleshwar",
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) {
        navigate("/login");
        return;
      }

      setUser(auth.user);

      // Fetch sales cars for this sales person from sales_cars table
      const { data: cars, error } = await supabase
        .from("sales_cars")
        .select("*")
        .eq("sales_person_id", auth.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching sales history:", error);
        setSalesHistory([]);
      } else {
        setSalesHistory(cars || []);
      }
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = salesHistory.filter((item) => {
    const areaMatch = selectedArea === "all" || item.model === selectedArea;
    return areaMatch;
  });

  const stats = {
    totalRegistered: salesHistory.length,
    thisMonth: salesHistory.filter((c) => {
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return new Date(c.created_at) >= thisMonth;
    }).length,
    thisWeek: salesHistory.filter((c) => {
      const now = new Date();
      const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return new Date(c.created_at) >= thisWeek;
    }).length,
    today: salesHistory.filter((c) => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return new Date(c.created_at) >= today;
    }).length,
    approved: salesHistory.length, // All registered cars are considered approved
  };

  if (loading) {
    return (
      <div className="pt-20 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading sales history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 pt-20">
      <NavbarNew />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Sales History</h1>
          <p className="text-slate-600">
            View all customers you've registered and their approval status
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <p className="text-sm text-slate-600 mb-2">Total Registered</p>
            <p className="text-3xl font-bold text-slate-900">{stats.totalRegistered}</p>
            <p className="text-xs text-slate-500 mt-2">All time</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <p className="text-sm text-slate-600 mb-2">This Month</p>
            <p className="text-3xl font-bold text-slate-900">{stats.thisMonth}</p>
            <p className="text-xs text-slate-500 mt-2">New customers</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <p className="text-sm text-slate-600 mb-2">This Week</p>
            <p className="text-3xl font-bold text-slate-900">{stats.thisWeek}</p>
            <p className="text-xs text-slate-500 mt-2">New customers</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <p className="text-sm text-slate-600 mb-2">Today</p>
            <p className="text-3xl font-bold text-slate-900">{stats.today}</p>
            <p className="text-xs text-slate-500 mt-2">New customers</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-600">
            <p className="text-sm text-slate-600 mb-2">Approved</p>
            <p className="text-3xl font-bold text-slate-900">{stats.approved}</p>
            <p className="text-xs text-slate-500 mt-2">Verified customers</p>
          </div>
        </div>

        {/* Assigned Area Card */}
                  {assignedArea && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-8 border-l-4 border-blue-600">
                      <div className="flex items-center gap-3">
                        <FiMapPin className="text-blue-600" size={24} />
                        <div>
                          <p className="text-sm text-slate-600">Your Assigned Area</p>
                          <p className="text-2xl font-bold text-slate-900">
                            {assignedArea}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

        {/* Sales History Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {filteredHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-100 border-b-2 border-slate-200">
                    <th className="text-left py-4 px-6 font-semibold text-slate-700">
                      Customer Name
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-700">
                      Contact
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-700">
                      Area
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-700">
                      Car Details
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-700">
                      Documents
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-700">
                      Status
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-slate-700">
                      Date Registered
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition"
                    >
                      <td className="py-4 px-6">
                        <p className="font-semibold text-slate-900">
                          {item.customer_name || "N/A"}
                        </p>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-sm text-slate-600">
                            {item.customer_phone || "N/A"}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          {assignedArea}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {item.number_plate || "N/A"}
                          </p>
                          <p className="text-xs text-slate-600">
                            {item.model || "N/A"} ({item.color || "N/A"})
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2">
                          {item.image_url_1 && (
                            <span
                              className="w-6 h-6 bg-green-100 text-green-700 rounded flex items-center justify-center text-xs font-bold"
                              title="Car Photo 1"
                            >
                              📷
                            </span>
                          )}
                          {item.image_url_2 && (
                            <span
                              className="w-6 h-6 bg-green-100 text-green-700 rounded flex items-center justify-center text-xs font-bold"
                              title="Car Photo 2"
                            >
                              📷
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          Registered
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-slate-600">
                          {new Date(item.created_at).toLocaleDateString(
                            "en-IN",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(item.created_at).toLocaleTimeString(
                            "en-IN",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <FiUsers className="mx-auto text-slate-400 mb-3" size={40} />
              <p className="text-slate-600 font-medium">
                No sales records found
              </p>
              <p className="text-slate-500 text-sm mt-1">
                Start registering customers to see them here
              </p>
            </div>
          )}
        </div>

        {/* Summary Footer */}
        {filteredHistory.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-slate-700">
              Showing <strong>{filteredHistory.length}</strong> out of{" "}
              <strong>{salesHistory.length}</strong> total registrations
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
