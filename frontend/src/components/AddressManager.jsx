import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { FiMapPin, FiEdit2, FiSave, FiX } from "react-icons/fi";

export default function AddressManager({ userId }) {
  const [address, setAddress] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    address: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    address_type: "home",
  });

  // Load address on mount
  useEffect(() => {
    loadAddress();
  }, [userId]);

  const loadAddress = async () => {
    try {
      // Fetch address from backend API instead of direct Supabase query
      const response = await fetch(`http://localhost:5000/profile/address/${userId}`);
      const result = await response.json();

      if (result.success && result.address) {
        setAddress(result.address);
        setFormData(result.address);
      } else if (!result.success) {
        console.error("Error loading address:", result.error);
      }
    } catch (err) {
      console.error("Error loading address:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Save address via backend API instead of direct Supabase query
      const response = await fetch(`http://localhost:5000/profile/address/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: formData.address,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postal_code,
          country: formData.country,
          address_type: formData.address_type,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setAddress(formData);
        setIsEditing(false);
        alert("Address saved successfully!");
      } else {
        alert("Error saving address: " + result.error);
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(address || {
      address: "",
      city: "",
      state: "",
      postal_code: "",
      country: "",
      address_type: "home",
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <FiMapPin className="text-blue-400" size={24} />
          <h3 className="text-lg font-semibold text-white">Address</h3>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
          >
            <FiEdit2 size={18} />
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          {/* Address */}
          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Street Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Enter your street address"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm text-slate-300 mb-2">City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              placeholder="Enter your city"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* State */}
          <div>
            <label className="block text-sm text-slate-300 mb-2">State</label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleInputChange}
              placeholder="Enter your state"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Postal Code */}
          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Postal Code
            </label>
            <input
              type="text"
              name="postal_code"
              value={formData.postal_code}
              onChange={handleInputChange}
              placeholder="Enter your postal code"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm text-slate-300 mb-2">Country</label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              placeholder="Enter your country"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Address Type */}
          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Address Type
            </label>
            <select
              name="address_type"
              value={formData.address_type}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="home">Home</option>
              <option value="office">Office</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 rounded-lg text-white transition-colors"
            >
              <FiSave size={18} />
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
            >
              <FiX size={18} />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-700/50 rounded-lg p-4">
          {address?.address ? (
            <div className="space-y-2 text-slate-300">
              <p className="text-white font-semibold">{address.address}</p>
              <p>{address.city}, {address.state} {address.postal_code}</p>
              <p>{address.country}</p>
              <p className="text-xs text-blue-400 uppercase tracking-wide mt-3">
                {address.address_type}
              </p>
            </div>
          ) : (
            <p className="text-slate-400 text-center py-4">
              No address saved. Click Edit to add one.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
