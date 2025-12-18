import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { FiMapPin, FiEdit2, FiSave, FiX } from "react-icons/fi";

export default function AddressManager({ userId }) {
  const [address, setAddress] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    village: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    address_type: "home",
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [errors, setErrors] = useState({});

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
        setFormData({
          village: result.address.village || "",
          address: result.address.address || "",
          city: result.address.city || "",
          state: result.address.state || "",
          postal_code: result.address.postal_code || "",
          country: result.address.country || "",
          address_type: result.address.address_type || "home",
        });
      } else if (!result.success) {
        console.error("Error loading address:", result.error);
      }
      setIsLoaded(true);
    } catch (err) {
      console.error("Error loading address:", err);
      setIsLoaded(true);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ["village", "city", "state", "country"];

    requiredFields.forEach((field) => {
      if (!formData[field] || formData[field].trim() === "") {
        if (field === "village") {
          newErrors[field] = "Village is required";
        } else {
          newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      alert("Please fill in all required fields: Village, City, State, and Country");
      return;
    }

    setLoading(true);
    try {
      // Save address via backend API instead of direct Supabase query
      const response = await fetch(`http://localhost:5000/profile/address/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          village: formData.village,
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
        setErrors({});
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
      village: "",
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
    <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <FiMapPin className="text-blue-600" size={24} />
          <h3 className="text-lg font-semibold text-slate-900">Address</h3>
        </div>
        {!isEditing && isLoaded && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
          >
            <FiEdit2 size={18} />
            Edit
          </button>
        )}
      </div>

      {!isLoaded ? (
        <p className="text-slate-600">Loading address...</p>
      ) : isEditing ? (
        <div className="space-y-4">
          {/* Village */}
          <div>
            <label className="block text-sm text-slate-700 mb-2">
              Village <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="village"
              value={formData.village}
              onChange={handleInputChange}
              placeholder="Enter your village name"
              className={`w-full px-4 py-2 bg-slate-50 border rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors ${
                errors.village ? "border-red-500" : "border-slate-300"
              }`}
            />
            {errors.village && <p className="text-red-600 text-xs mt-1">{errors.village}</p>}
          </div>

          {/* Address (Street Address) */}
          <div>
            <label className="block text-sm text-slate-700 mb-2">
              Street Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Enter your street address (optional)"
              className={`w-full px-4 py-2 bg-slate-50 border rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors ${
                errors.address ? "border-red-500" : "border-slate-300"
              }`}
            />
            {errors.address && <p className="text-red-600 text-xs mt-1">{errors.address}</p>}
          </div>

          {/* City */}
          <div>
            <label className="block text-sm text-slate-700 mb-2">
              City <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              placeholder="Enter your city"
              className={`w-full px-4 py-2 bg-slate-50 border rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors ${
                errors.city ? "border-red-500" : "border-slate-300"
              }`}
            />
            {errors.city && <p className="text-red-600 text-xs mt-1">{errors.city}</p>}
          </div>

          {/* State */}
          <div>
            <label className="block text-sm text-slate-700 mb-2">
              State <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleInputChange}
              placeholder="Enter your state"
              className={`w-full px-4 py-2 bg-slate-50 border rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors ${
                errors.state ? "border-red-500" : "border-slate-300"
              }`}
            />
            {errors.state && <p className="text-red-600 text-xs mt-1">{errors.state}</p>}
          </div>

          {/* Postal Code */}
          <div>
            <label className="block text-sm text-slate-700 mb-2">
              Postal Code
            </label>
            <input
              type="text"
              name="postal_code"
              value={formData.postal_code}
              onChange={handleInputChange}
              placeholder="Enter your postal code (optional)"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm text-slate-700 mb-2">
              Country <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              placeholder="Enter your country"
              className={`w-full px-4 py-2 bg-slate-50 border rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors ${
                errors.country ? "border-red-500" : "border-slate-300"
              }`}
            />
            {errors.country && <p className="text-red-600 text-xs mt-1">{errors.country}</p>}
          </div>

          {/* Address Type */}
          <div>
            <label className="block text-sm text-slate-700 mb-2">
              Address Type
            </label>
            <select
              name="address_type"
              value={formData.address_type}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
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
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 rounded-lg text-white transition-colors"
            >
              <FiSave size={18} />
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-900 transition-colors"
            >
              <FiX size={18} />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          {address?.village ? (
            <div className="space-y-2 text-slate-700">
              <p className="text-slate-900 font-semibold">📍 {address.village}</p>
              {address.address && <p className="text-slate-600">{address.address}</p>}
              <p>{address.city}, {address.state} {address.postal_code}</p>
              <p>{address.country}</p>
              <p className="text-xs text-blue-600 uppercase tracking-wide mt-3">
                {address.address_type}
              </p>
            </div>
          ) : (
            <p className="text-slate-600 text-center py-4">
              No address saved. Click Edit to add one.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
