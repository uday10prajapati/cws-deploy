import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import NavbarNew from "../components/NavbarNew";
import { FiAward, FiGift, FiTrendingUp, FiList, FiCheck } from "react-icons/fi";

const CustomerLoyaltyDashboard = () => {
  const [user, setUser] = useState(null);
  const [loyalty, setLoyalty] = useState(null);
  const [offers, setOffers] = useState({ available: [], all: [] });
  const [history, setHistory] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // overview, offers, history, redemptions
  const [redeemingOffer, setRedeemingOffer] = useState(null);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (auth?.user) {
          setUser(auth.user);
          await fetchLoyaltyData(auth.user.id);
          await fetchHistory(auth.user.id);
          await fetchRedemptions(auth.user.id);
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
      const res = await fetch(`http://localhost:5000/customer-loyalty/loyalty/${userId}`);
      const data = await res.json();
      if (data.success) {
        setLoyalty(data.loyalty);
        setOffers(data.offers);
      }
    } catch (error) {
      console.error("Error fetching loyalty data:", error);
    }
  };

  const fetchHistory = async (userId) => {
    try {
      const res = await fetch(`http://localhost:5000/customer-loyalty/history/${userId}?days=90`);
      const data = await res.json();
      if (data.success) {
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  const fetchRedemptions = async (userId) => {
    try {
      const res = await fetch(`http://localhost:5000/customer-loyalty/redemptions/${userId}`);
      const data = await res.json();
      if (data.success) {
        setRedemptions(data.redemptions || []);
      }
    } catch (error) {
      console.error("Error fetching redemptions:", error);
    }
  };

  const handleRedeemOffer = async (offerId) => {
    if (!user) return;
    
    setRedeeming(true);
    try {
      const res = await fetch("http://localhost:5000/customer-loyalty/loyalty/redeem-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: user.id,
          offer_id: offerId
        })
      });

      const data = await res.json();
      if (data.success) {
        alert(`✅ Offer redeemed! Coupon: ${data.redemption.coupon_code}`);
        setRedeemingOffer(null);
        await fetchLoyaltyData(user.id);
        await fetchRedemptions(user.id);
      } else {
        alert(`❌ ${data.error}`);
      }
    } catch (error) {
      console.error("Error redeeming offer:", error);
      alert("Failed to redeem offer");
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <p className="text-white text-lg">Loading loyalty data...</p>
      </div>
    );
  }

  const progressPercentage = loyalty
    ? Math.min((loyalty.total_points / (offers.all[0]?.points_required || 100)) * 100, 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <NavbarNew />
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 shadow-md">
          <div className="flex items-center justify-between mb-6 flex-col md:flex-row gap-4">
            <div className="flex items-center gap-4">
              <FiAward size={48} className="text-white" />
              <div>
                <h1 className="text-3xl font-bold text-white">Loyalty Rewards</h1>
                <p className="text-blue-100 text-sm">Earn points every time your car is washed</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-5xl font-bold text-white">{loyalty?.total_points || 0}</p>
              <p className="text-blue-100 text-sm">Total Points</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <p className="text-blue-100">Progress to next offer</p>
              <p className="text-white font-semibold">{Math.round(progressPercentage)}%</p>
            </div>
            <div className="w-full bg-blue-900/30 rounded-full h-3 overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <FiTrendingUp className="text-blue-600" size={24} />
              <h3 className="text-slate-900 font-semibold">Cars Washed</h3>
            </div>
            <p className="text-4xl font-bold text-blue-600">{loyalty?.cars_washed || 0}</p>
            <p className="text-slate-600 text-sm mt-2">Total washes</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <FiGift className="text-purple-600" size={24} />
              <h3 className="text-slate-900 font-semibold">Available Offers</h3>
            </div>
            <p className="text-4xl font-bold text-purple-600">
              {offers.available?.length || 0}
            </p>
            <p className="text-slate-600 text-sm mt-2">Ready to redeem</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <FiCheck className="text-emerald-600" size={24} />
              <h3 className="text-slate-900 font-semibold">Redeemed</h3>
            </div>
            <p className="text-4xl font-bold text-emerald-600">{redemptions?.length || 0}</p>
            <p className="text-slate-600 text-sm mt-2">Total offers used</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200 overflow-x-auto bg-white rounded-t-lg shadow-sm">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-3 font-semibold transition border-b-2 whitespace-nowrap ${
              activeTab === "overview"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("offers")}
            className={`px-6 py-3 font-semibold transition border-b-2 whitespace-nowrap ${
              activeTab === "offers"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            Available Offers ({offers.available?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-6 py-3 font-semibold transition border-b-2 whitespace-nowrap ${
              activeTab === "history"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            Wash History
          </button>
          <button
            onClick={() => setActiveTab("redemptions")}
            className={`px-6 py-3 font-semibold transition border-b-2 whitespace-nowrap ${
              activeTab === "redemptions"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            My Redemptions ({redemptions?.length || 0})
          </button>
        </div>

        {/* Content Sections */}

        {/* Overview */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-md">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900">
                <FiAward className="text-amber-600" />
                How Loyalty Points Work
              </h3>
              <div className="space-y-4">
                <div className="flex gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-2xl">🚗</div>
                  <div>
                    <p className="font-semibold text-slate-900">1 Wash = 1 Point</p>
                    <p className="text-sm text-slate-600">Every time your car is washed, you earn 1 loyalty point</p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-2xl">🎁</div>
                  <div>
                    <p className="font-semibold text-slate-900">Unlock Offers</p>
                    <p className="text-sm text-slate-600">Reach point thresholds to unlock exclusive offers and discounts</p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-2xl">💳</div>
                  <div>
                    <p className="font-semibold text-slate-900">Redeem & Save</p>
                    <p className="text-sm text-slate-600">Redeem offers to get discounts on future car washes</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Milestone */}
            {offers.all && offers.all.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 shadow-md">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900">
                  <FiGift className="text-emerald-600" />
                  Next Milestone
                </h3>
                {offers.all[0] ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="text-slate-900 font-semibold">{offers.all[0].offer_title}</p>
                      <p className="text-emerald-700 font-bold">{offers.all[0].points_required} points</p>
                    </div>
                    <p className="text-sm text-slate-700">{offers.all[0].offer_description}</p>
                    <div className="pt-2">
                      <p className="text-xs text-slate-600 mb-2">
                        {offers.all[0].points_required - (loyalty?.total_points || 0)} points to unlock
                      </p>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full"
                          style={{
                            width: `${Math.min(
                              ((loyalty?.total_points || 0) / offers.all[0].points_required) * 100,
                              100
                            )}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-600">No offers available yet</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Available Offers */}
        {activeTab === "offers" && (
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-md">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900">
              <FiGift className="text-purple-600" />
              Offers You Can Redeem Now
            </h3>

            {offers.available && offers.available.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {offers.available.map(offer => (
                  <div
                    key={offer.id}
                    className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-5 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-slate-900 text-lg">{offer.offer_title}</h4>
                        <p className="text-sm text-slate-700">{offer.offer_description}</p>
                      </div>
                      <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {offer.discount_percentage}% OFF
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <p className="text-slate-600">Cost:</p>
                        <p className="text-slate-900 font-semibold flex items-center gap-1">
                          <FiAward size={16} />
                          {offer.points_required} points
                        </p>
                      </div>

                      {offer.coupon_code && (
                        <div className="bg-slate-100 p-3 rounded border border-slate-300">
                          <p className="text-xs text-slate-600 mb-1">Coupon Code:</p>
                          <p className="text-slate-900 font-mono font-bold">{offer.coupon_code}</p>
                        </div>
                      )}

                      {offer.valid_until && (
                        <p className="text-xs text-slate-600">
                          Valid until: {new Date(offer.valid_until).toLocaleDateString()}
                        </p>
                      )}

                      <button
                        onClick={() => handleRedeemOffer(offer.id)}
                        disabled={redeeming}
                        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white font-semibold py-2 rounded-lg transition mt-2"
                      >
                        {redeeming ? "Redeeming..." : "Redeem Offer"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-600 text-lg">No offers available yet</p>
                <p className="text-slate-500 text-sm mt-2">Keep earning points to unlock offers!</p>
              </div>
            )}

            {/* All Offers Preview */}
            {offers.all && offers.all.length > offers.available.length && (
              <div className="mt-8 pt-8 border-t border-slate-200">
                <h4 className="font-semibold text-slate-900 mb-4">Future Offers to Unlock</h4>
                <div className="space-y-2">
                  {offers.all
                    .filter(o => !offers.available.some(a => a.id === o.id))
                    .slice(0, 3)
                    .map(offer => (
                      <div key={offer.id} className="flex justify-between items-center p-3 bg-slate-50 rounded border border-slate-200">
                        <p className="text-slate-900">{offer.offer_title}</p>
                        <p className="text-slate-600 text-sm">
                          {offer.points_required - (loyalty?.total_points || 0)} points away
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Wash History */}
        {activeTab === "history" && (
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-md">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900">
              <FiList className="text-blue-600" />
              Wash History - Last 90 Days
            </h3>

            {history.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3 text-left text-slate-900 font-semibold">Date</th>
                      <th className="px-4 py-3 text-left text-slate-900 font-semibold">Car</th>
                      <th className="px-4 py-3 text-left text-slate-900 font-semibold">Plate</th>
                      <th className="px-4 py-3 text-left text-slate-900 font-semibold">Washer</th>
                      <th className="px-4 py-3 text-left text-slate-900 font-semibold">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(wash => (
                      <tr
                        key={wash.id}
                        className="border-b border-slate-200 hover:bg-slate-50 transition"
                      >
                        <td className="px-4 py-3 text-slate-900">
                          {new Date(wash.wash_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-slate-900">
                          {wash.cars?.brand} {wash.cars?.model}
                        </td>
                        <td className="px-4 py-3 text-slate-900">
                          <span className="font-mono bg-slate-100 px-2 py-1 rounded border border-slate-300">
                            {wash.cars?.number_plate}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {wash.profiles?.full_name || "N/A"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-semibold text-xs">
                            +1
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-600 text-lg">No wash history yet</p>
                <p className="text-slate-500 text-sm mt-2">Your washes will appear here</p>
              </div>
            )}
          </div>
        )}

        {/* Redemptions */}
        {activeTab === "redemptions" && (
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-md">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900">
              <FiCheck className="text-emerald-600" />
              My Redeemed Offers
            </h3>

            {redemptions.length > 0 ? (
              <div className="space-y-4">
                {redemptions.map(redemption => (
                  <div
                    key={redemption.id}
                    className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-200"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {redemption.loyalty_offers?.offer_title}
                      </p>
                      <p className="text-sm text-slate-700">
                        {redemption.loyalty_offers?.offer_description}
                      </p>
                      <p className="text-xs text-slate-600 mt-2">
                        Redeemed: {new Date(redemption.redeemed_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-700 font-bold text-lg">
                        -{redemption.points_spent}
                        <FiAward className="inline ml-1" size={18} />
                      </p>
                      <p className="text-xs text-slate-600">{redemption.loyalty_offers?.discount_percentage}% OFF</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-600 text-lg">No redeemed offers yet</p>
                <p className="text-slate-500 text-sm mt-2">Earn points and unlock offers to get started!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerLoyaltyDashboard;
