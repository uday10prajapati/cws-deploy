import React, { useEffect, useState } from "react";
import {
  FiCheck,
  FiX,
  FiEye,
  FiRefreshCw,
  FiDownload,
  FiAlertCircle,
  FiSearch,
  FiArrowLeft,
  FiMapPin,
} from "react-icons/fi";
import NavbarNew from "../components/NavbarNew";
import { supabase } from "../supabaseClient";

const AdminDocumentVerification = () => {
  const [profileCodes, setProfileCodes] = useState([]);
  const [selectedWasher, setSelectedWasher] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [washerProfile, setWasherProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState({});
  const [notes, setNotes] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedTaluko, setSelectedTaluko] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [talukoOptions, setTalukoOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);
  const [talukoInput, setTalukoInput] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [stateInput, setStateInput] = useState("");
  const [showTalukoSuggestions, setShowTalukoSuggestions] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [showStateSuggestions, setShowStateSuggestions] = useState(false);

  useEffect(() => {
    loadProfileCodes();
  }, []);

  const loadProfileCodes = async () => {
    try {
      const res = await fetch("http://localhost:5000/documents/admin/profile-codes");
      const data = await res.json();
      if (data.success) {
        const profileCodesToEnrich = data.profileCodes || [];
        
        // Fetch washer profile data with location info
        const washerIds = profileCodesToEnrich.map(pc => pc.washer_id);
        if (washerIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, taluko, city, state")
            .in("id", washerIds);

          const profileMap = {};
          (profilesData || []).forEach(profile => {
            profileMap[profile.id] = profile;
          });

          // Enrich profile codes with location data
          const enrichedProfileCodes = profileCodesToEnrich.map(pc => ({
            ...pc,
            washer_taluko: profileMap[pc.washer_id]?.taluko || "",
            washer_city: profileMap[pc.washer_id]?.city || "",
            washer_state: profileMap[pc.washer_id]?.state || "",
          }));

          setProfileCodes(enrichedProfileCodes);

          // Extract unique locations
          const talukoSet = new Set();
          const citySet = new Set();
          const stateSet = new Set();

          enrichedProfileCodes.forEach(pc => {
            if (pc.washer_taluko) talukoSet.add(pc.washer_taluko);
            if (pc.washer_city) citySet.add(pc.washer_city);
            if (pc.washer_state) stateSet.add(pc.washer_state);
          });

          setTalukoOptions(Array.from(talukoSet).sort());
          setCityOptions(Array.from(citySet).sort());
          setStateOptions(Array.from(stateSet).sort());
        }
      }
    } catch (error) {
      console.error("Error loading profile codes:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadWasherDocuments = async (washerId) => {
    try {
      setSelectedWasher(washerId);
      const res = await fetch(
        `http://localhost:5000/documents/admin/documents/${washerId}`
      );
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents || []);
        setWasherProfile(data.washerProfile);
      }
    } catch (error) {
      console.error("Error loading documents:", error);
    }
  };

  const handleVerifyDocument = async (documentId, verified) => {
    try {
      setVerifying((prev) => ({ ...prev, [documentId]: true }));

      const res = await fetch(
        "http://localhost:5000/documents/admin/verify-document",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            document_id: documentId,
            verified,
            notes: notes[documentId] || "",
            admin_id: "admin-id", // Replace with actual admin ID from auth
          }),
        }
      );

      const result = await res.json();
      if (result.success) {
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === documentId
              ? {
                  ...d,
                  verified,
                  verified_at: new Date(),
                  notes: notes[documentId],
                }
              : d
          )
        );

        // Reload profile codes to update status
        loadProfileCodes();
      }
    } catch (error) {
      console.error("Error verifying document:", error);
      alert("Error verifying document");
    } finally {
      setVerifying((prev) => ({ ...prev, [documentId]: false }));
    }
  };

  const filteredProfileCodes = profileCodes.filter((pc) => {
    const matchesSearch =
      pc.profile?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pc.profile?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pc.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pc.profile_code?.toLowerCase().includes(searchTerm.toLowerCase());

    let statusMatch = true;
    if (filterStatus === "complete") statusMatch = pc.documents_complete;
    if (filterStatus === "pending") statusMatch = !pc.documents_complete;

    let locationMatch = true;
    if (selectedTaluko || selectedCity || selectedState) {
      const talukoMatch = !selectedTaluko || pc.washer_taluko?.toLowerCase() === selectedTaluko.toLowerCase();
      const cityMatch = !selectedCity || pc.washer_city?.toLowerCase() === selectedCity.toLowerCase();
      const stateMatch = !selectedState || pc.washer_state?.toLowerCase() === selectedState.toLowerCase();
      locationMatch = talukoMatch && cityMatch && stateMatch;
    }

    return matchesSearch && statusMatch && locationMatch;
  });

  const filteredTalukos = talukoOptions.filter(t => t.toLowerCase().startsWith(talukoInput.toLowerCase()));
  const filteredCities = cityOptions.filter(c => c.toLowerCase().startsWith(cityInput.toLowerCase()));
  const filteredStates = stateOptions.filter(s => s.toLowerCase().startsWith(stateInput.toLowerCase()));

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100">
        <NavbarNew />
        <main className="flex-1 overflow-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin text-4xl mb-4">⏳</div>
              <p className="text-slate-600">Loading documents...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-slate-100">
      <NavbarNew />
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
    <div className="space-y-6">
      {/* List View */}
      {!selectedWasher ? (
        <>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-2 leading-tight">
              Document Verification 📄
            </h1>
            <p className="text-slate-600 text-base">Review and approve washer documents</p>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <FiSearch className="absolute left-3 top-3 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, email, or profile code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-sm"
            />
          </div>

          {/* Filters Section */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-lg mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Filters</h3>
            
            {/* First Row - Status */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Verification Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
              >
                <option value="all">All Washers</option>
                <option value="complete">✓ Verified</option>
                <option value="pending">⏳ Pending</option>
              </select>
            </div>

            {/* Location Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Taluko Filter */}
              <div className="relative">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Taluko</label>
                <input
                  type="text"
                  placeholder="Select or type taluko..."
                  value={talukoInput}
                  onChange={(e) => {
                    setTalukoInput(e.target.value);
                    setShowTalukoSuggestions(true);
                  }}
                  onFocus={() => setShowTalukoSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowTalukoSuggestions(false), 150)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                />
                {showTalukoSuggestions && filteredTalukos.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                    {filteredTalukos.map((taluko) => (
                      <div
                        key={taluko}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSelectedTaluko(taluko);
                          setTalukoInput(taluko);
                          setShowTalukoSuggestions(false);
                        }}
                        className="px-3 py-2 hover:bg-slate-100 cursor-pointer text-slate-900 text-sm"
                      >
                        {taluko}
                      </div>
                    ))}
                  </div>
                )}
                {selectedTaluko && (
                  <button
                    onClick={() => {
                      setSelectedTaluko("");
                      setTalukoInput("");
                    }}
                    className="absolute right-3 top-10 text-slate-500 hover:text-slate-700 text-sm font-semibold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* City Filter */}
              <div className="relative">
                <label className="block text-sm font-semibold text-slate-700 mb-2">City</label>
                <input
                  type="text"
                  placeholder="Select or type city..."
                  value={cityInput}
                  onChange={(e) => {
                    setCityInput(e.target.value);
                    setShowCitySuggestions(true);
                  }}
                  onFocus={() => setShowCitySuggestions(true)}
                  onBlur={() => setTimeout(() => setShowCitySuggestions(false), 150)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                />
                {showCitySuggestions && filteredCities.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                    {filteredCities.map((city) => (
                      <div
                        key={city}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSelectedCity(city);
                          setCityInput(city);
                          setShowCitySuggestions(false);
                        }}
                        className="px-3 py-2 hover:bg-slate-100 cursor-pointer text-slate-900 text-sm"
                      >
                        {city}
                      </div>
                    ))}
                  </div>
                )}
                {selectedCity && (
                  <button
                    onClick={() => {
                      setSelectedCity("");
                      setCityInput("");
                    }}
                    className="absolute right-3 top-10 text-slate-500 hover:text-slate-700 text-sm font-semibold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* State Filter */}
              <div className="relative">
                <label className="block text-sm font-semibold text-slate-700 mb-2">State</label>
                <input
                  type="text"
                  placeholder="Select or type state..."
                  value={stateInput}
                  onChange={(e) => {
                    setStateInput(e.target.value);
                    setShowStateSuggestions(true);
                  }}
                  onFocus={() => setShowStateSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowStateSuggestions(false), 150)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                />
                {showStateSuggestions && filteredStates.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                    {filteredStates.map((state) => (
                      <div
                        key={state}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSelectedState(state);
                          setStateInput(state);
                          setShowStateSuggestions(false);
                        }}
                        className="px-3 py-2 hover:bg-slate-100 cursor-pointer text-slate-900 text-sm"
                      >
                        {state}
                      </div>
                    ))}
                  </div>
                )}
                {selectedState && (
                  <button
                    onClick={() => {
                      setSelectedState("");
                      setStateInput("");
                    }}
                    className="absolute right-3 top-10 text-slate-500 hover:text-slate-700 text-sm font-semibold"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Reset Button */}
            <div className="mt-4">
              <button
                onClick={() => {
                  setFilterStatus("all");
                  setSearchTerm("");
                  setSelectedTaluko("");
                  setSelectedCity("");
                  setSelectedState("");
                  setTalukoInput("");
                  setCityInput("");
                  setStateInput("");
                }}
                className="bg-slate-600 hover:bg-slate-700 text-white rounded-lg px-4 py-2 font-semibold transition"
              >
                Reset All Filters
              </button>
            </div>
          </div>

          {/* Washers Grid */}
          <div className="grid gap-4">
            {filteredProfileCodes.length === 0 ? (
              <div className="text-center py-12 bg-white border border-slate-200 rounded-xl">
                <FiAlertCircle className="text-slate-300 mx-auto mb-4" size={48} />
                <p className="text-slate-600 text-lg">No washers found</p>
              </div>
            ) : (
              filteredProfileCodes.map((pc) => (
                <div
                  key={pc.id}
                  onClick={() => loadWasherDocuments(pc.washer_id)}
                  className={`rounded-xl border p-5 cursor-pointer transition hover:shadow-lg hover:-translate-y-1 ${
                    pc.documents_complete
                      ? "bg-linear-to-br from-green-50 to-emerald-50 border-green-200"
                      : "bg-white border-slate-200 hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Washer Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-lg font-bold text-blue-700">
                          {pc.profile?.first_name?.charAt(0) || "W"}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg">
                            {pc.profile?.first_name} {pc.profile?.last_name}
                          </h3>
                          <p className="text-sm text-slate-600">
                            {pc.profile?.email}
                          </p>
                        </div>
                      </div>

                      {/* Location Info */}
                      {(pc.washer_taluko || pc.washer_city || pc.washer_state) && (
                        <div className="flex items-center gap-2 text-xs text-slate-600 ml-15">
                          <FiMapPin size={14} className="text-blue-600" />
                          <span>
                            {[pc.washer_taluko, pc.washer_city, pc.washer_state]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Profile Code */}
                    <div className="text-right">
                      <p className="text-xs text-slate-600 mb-1">Profile Code</p>
                      <p className="font-mono text-blue-600 font-bold text-sm">
                        {pc.profile_code}
                      </p>
                    </div>

                    {/* Document Status Indicators */}
                    <div className="flex gap-3">
                      <div className="text-center">
                        <div className={`text-2xl mb-1 ${pc.aadhar_verified ? "text-green-600" : "text-slate-300"}`}>
                          {pc.aadhar_verified ? "✓" : "◯"}
                        </div>
                        <p className="text-xs text-slate-600">Aadhar</p>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl mb-1 ${pc.identity_verified ? "text-green-600" : "text-slate-300"}`}>
                          {pc.identity_verified ? "✓" : "◯"}
                        </div>
                        <p className="text-xs text-slate-600">Identity</p>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl mb-1 ${pc.bank_verified ? "text-green-600" : "text-slate-300"}`}>
                          {pc.bank_verified ? "✓" : "◯"}
                        </div>
                        <p className="text-xs text-slate-600">Bank</p>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl mb-1 ${pc.profile_pic_uploaded ? "text-green-600" : "text-slate-300"}`}>
                          {pc.profile_pic_uploaded ? "✓" : "◯"}
                        </div>
                        <p className="text-xs text-slate-600">Photo</p>
                      </div>
                    </div>

                    {/* Overall Status */}
                    <div className="text-3xl">
                      {pc.documents_complete ? "✨" : "⏳"}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          {/* Detail View */}
          <button
            onClick={() => {
              setSelectedWasher(null);
              setDocuments([]);
              setNotes({});
            }}
            className="mb-6 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 rounded-lg transition flex items-center gap-2 font-semibold"
          >
            <FiArrowLeft />
            Back to List
          </button>

          {washerProfile && (
            <div className="bg-linear-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6 mb-6 shadow-lg">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                {washerProfile.first_name} {washerProfile.last_name}
              </h2>
              <p className="text-slate-600 text-sm">
                {washerProfile.email} • {washerProfile.phone}
              </p>
            </div>
          )}

          {/* Documents Section */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Documents to Review</h3>
            
            {documents.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                <FiAlertCircle className="text-slate-300 mx-auto mb-4" size={48} />
                <p className="text-slate-600">No documents uploaded yet</p>
              </div>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`rounded-xl border p-6 shadow-lg transition ${
                    doc.verified
                      ? "bg-linear-to-br from-green-50 to-emerald-50 border-green-200"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900 capitalize">
                        {doc.document_type.replace(/_/g, " ")}
                      </h3>
                      <p className="text-sm text-slate-600 mt-2">
                        📅 Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                      {doc.verified && (
                        <p className="text-sm text-green-600 mt-1 font-semibold">
                          ✓ Verified on {new Date(doc.verified_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div className={`text-4xl ${doc.verified ? "text-green-600" : "text-amber-500"}`}>
                      {doc.verified ? "✓" : "⏳"}
                    </div>
                  </div>

                  {/* Document Preview */}
                  <a
                    href={doc.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-4 block"
                  >
                    {doc.document_url.endsWith(".pdf") ? (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center hover:bg-slate-100 transition">
                        <p className="text-2xl mb-2">📄</p>
                        <p className="text-slate-600 font-semibold">PDF Document</p>
                        <p className="text-sm text-blue-600 mt-2">Click to view</p>
                      </div>
                    ) : (
                      <img
                        src={doc.document_url}
                        alt={doc.document_type}
                        className="max-h-64 rounded-lg border border-slate-200 object-cover"
                      />
                    )}
                  </a>

                  {!doc.verified && (
                    <>
                      {/* Notes Section */}
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Review Notes (optional)
                        </label>
                        <textarea
                          value={notes[doc.id] || ""}
                          onChange={(e) =>
                            setNotes((prev) => ({
                              ...prev,
                              [doc.id]: e.target.value,
                            }))
                          }
                          placeholder="Add notes about document quality, visibility, etc..."
                          className="w-full p-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                          rows="3"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleVerifyDocument(doc.id, true)}
                          disabled={verifying[doc.id]}
                          className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                        >
                          {verifying[doc.id] ? (
                            <>
                              <div className="animate-spin">⌛</div>
                              Verifying...
                            </>
                          ) : (
                            <>
                              <FiCheck size={18} />
                              Approve
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleVerifyDocument(doc.id, false)}
                          disabled={verifying[doc.id]}
                          className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                        >
                          {verifying[doc.id] ? (
                            <>
                              <div className="animate-spin">⌛</div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <FiX size={18} />
                              Reject
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}

                  {doc.notes && (
                    <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">
                      <p className="font-semibold mb-2">📝 Admin Notes:</p>
                      <p>{doc.notes}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDocumentVerification;
