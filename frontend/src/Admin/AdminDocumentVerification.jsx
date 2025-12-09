import React, { useEffect, useState } from "react";
import {
  FiCheck,
  FiX,
  FiEye,
  FiRefreshCw,
  FiDownload,
  FiAlertCircle,
  FiSearch,
} from "react-icons/fi";

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

  useEffect(() => {
    loadProfileCodes();
  }, []);

  const loadProfileCodes = async () => {
    try {
      const res = await fetch("http://localhost:5000/documents/admin/profile-codes");
      const data = await res.json();
      if (data.success) {
        setProfileCodes(data.profileCodes || []);
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

    if (filterStatus === "all") return matchesSearch;
    if (filterStatus === "complete") return matchesSearch && pc.documents_complete;
    if (filterStatus === "pending") return matchesSearch && !pc.documents_complete;

    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-slate-400">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* List View */}
      {!selectedWasher ? (
        <>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search by name, email, or profile code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Washers</option>
              <option value="complete">Verified ✓</option>
              <option value="pending">Pending ⏳</option>
            </select>
          </div>

          <div className="grid gap-4">
            {filteredProfileCodes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400">No washers found</p>
              </div>
            ) : (
              filteredProfileCodes.map((pc) => (
                <div
                  key={pc.id}
                  className={`rounded-lg border p-4 cursor-pointer transition hover:scale-105 ${
                    pc.documents_complete
                      ? "bg-green-600/10 border-green-500/30"
                      : "bg-slate-800/50 border-slate-700 hover:bg-slate-800"
                  }`}
                  onClick={() => loadWasherDocuments(pc.washer_id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-bold text-white">
                            {pc.profile?.first_name} {pc.profile?.last_name}
                          </h3>
                          <p className="text-sm text-slate-400">
                            {pc.profile?.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mr-4">
                      <div className="text-right">
                        <p className="text-xs text-slate-500 mb-1">Profile Code</p>
                        <p className="font-mono text-blue-400 font-bold">
                          {pc.profile_code}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <div className="text-center">
                          <div
                            className={`text-2xl mb-1 ${
                              pc.aadhar_verified
                                ? "text-green-400"
                                : "text-slate-400"
                            }`}
                          >
                            {pc.aadhar_verified ? "✓" : "◯"}
                          </div>
                          <p className="text-xs text-slate-400">Aadhar</p>
                        </div>
                        <div className="text-center">
                          <div
                            className={`text-2xl mb-1 ${
                              pc.identity_verified
                                ? "text-green-400"
                                : "text-slate-400"
                            }`}
                          >
                            {pc.identity_verified ? "✓" : "◯"}
                          </div>
                          <p className="text-xs text-slate-400">Identity</p>
                        </div>
                        <div className="text-center">
                          <div
                            className={`text-2xl mb-1 ${
                              pc.bank_verified
                                ? "text-green-400"
                                : "text-slate-400"
                            }`}
                          >
                            {pc.bank_verified ? "✓" : "◯"}
                          </div>
                          <p className="text-xs text-slate-400">Bank</p>
                        </div>
                        <div className="text-center">
                          <div
                            className={`text-2xl mb-1 ${
                              pc.profile_pic_uploaded
                                ? "text-green-400"
                                : "text-slate-400"
                            }`}
                          >
                            {pc.profile_pic_uploaded ? "✓" : "◯"}
                          </div>
                          <p className="text-xs text-slate-400">Photo</p>
                        </div>
                      </div>
                    </div>

                    <div className="text-2xl">
                      {pc.documents_complete ? (
                        <div className="text-green-400">✨</div>
                      ) : (
                        <FiAlertCircle className="text-yellow-400" />
                      )}
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
            className="mb-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg transition"
          >
            ← Back to List
          </button>

          {washerProfile && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {washerProfile.first_name} {washerProfile.last_name}
                  </h2>
                  <p className="text-slate-400 text-sm mt-2">
                    {washerProfile.email} • {washerProfile.phone}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Documents to Verify */}
          <div className="space-y-4">
            {documents.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400">No documents uploaded yet</p>
              </div>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`rounded-lg border p-6 ${
                    doc.verified
                      ? "bg-green-600/10 border-green-500/30"
                      : "bg-slate-800/50 border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white capitalize">
                        {doc.document_type.replace(/_/g, " ")}
                      </h3>
                      <p className="text-sm text-slate-400 mt-1">
                        Uploaded:{" "}
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                      {doc.verified && (
                        <p className="text-sm text-green-400 mt-1">
                          ✓ Verified on{" "}
                          {new Date(doc.verified_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div
                      className={`text-3xl ${
                        doc.verified ? "text-green-400" : "text-yellow-400"
                      }`}
                    >
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
                      <div className="bg-slate-700/50 border border-slate-600 rounded p-4 text-center hover:bg-slate-700 transition">
                        <p className="text-slate-400">📄 PDF Document</p>
                        <p className="text-sm text-blue-400 mt-2">Click to view</p>
                      </div>
                    ) : (
                      <img
                        src={doc.document_url}
                        alt={doc.document_type}
                        className="max-h-48 rounded-lg border border-slate-700"
                      />
                    )}
                  </a>

                  {!doc.verified && (
                    <>
                      {/* Notes Section */}
                      <div className="mb-4">
                        <label className="block text-sm text-slate-300 mb-2">
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
                          className="w-full p-3 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
                          rows="3"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleVerifyDocument(doc.id, true)}
                          disabled={verifying[doc.id]}
                          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition"
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
                          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition"
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
                    <div className="mt-4 p-3 bg-slate-700/50 border border-slate-600 rounded text-sm text-slate-300">
                      <p className="font-semibold mb-1">Admin Notes:</p>
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
  );
};

export default AdminDocumentVerification;
