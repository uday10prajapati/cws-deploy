import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import { initializeStorageBucket } from "../utils/storageHelpers";
import NavbarNew from "../components/NavbarNew";
import {
  FiUpload,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiCopy,
  FiAlertCircle,
  FiHome,
  FiUser 
} from "react-icons/fi";

const WasherDocumentUpload = () => {
  const navigate = useNavigate();

  /* 🔥 USE ROLE-BASED REDIRECT HOOK */
  useRoleBasedRedirect("employee");

  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [profileCode, setProfileCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState({});
  const [copied, setCopied] = useState(false);

  const documentTypes = [
    {
      id: "aadhar",
      label: "Aadhar Card",
      required: true,
      description: "Valid Aadhar Card (Mandatory)",
    },
    {
      id: "pancard",
      label: "PAN Card",
      required: false,
      description: "PAN Card or Voter ID (At least one required)",
    },
    {
      id: "votercard",
      label: "Voter Card",
      required: false,
      description: "Voter Card or PAN Card (At least one required)",
    },
    {
      id: "bankpassbook",
      label: "Bank Passbook",
      required: true,
      description: "Bank Passbook or Statement (Mandatory)",
    },
    {
      id: "profile_pic",
      label: "Profile Picture",
      required: true,
      description: "Clear Profile Picture (Mandatory)",
    },
  ];

  const employeeMenu = [
    { name: "Dashboard", icon: <FiHome />, link: "/carwash" },
    { name: "My Jobs", icon: <span>💼</span>, link: "/washer/jobs" },
    { name: "Loyalty Points", icon: <span>⭐</span>, link: "/washer/loyalty-points" },
    { name: "Documents", icon: <span>📄</span>, link: "/washer/documents" },
    { name: "Profile", icon: <FiUser />, link: "/profile" },
  ];

  const handleLogout = async () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    await supabase.auth.signOut();
    navigate("/login");
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return;

      setUser(auth.user);

      // Fetch documents
      const docsRes = await fetch(
        `http://localhost:5000/documents/documents/${auth.user.id}`
      );
      const docsData = await docsRes.json();
      if (docsData.success) {
        setDocuments(docsData.documents);
      }

      // Fetch profile code
      const codeRes = await fetch(
        `http://localhost:5000/documents/profile-code/${auth.user.id}`
      );
      const codeData = await codeRes.json();
      if (codeData.success) {
        setProfileCode(codeData.profileCode);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (documentType, file) => {
    if (!file || !user) return;

    try {
      setUploading((prev) => ({ ...prev, [documentType]: true }));

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("file", file);
      formData.append("washer_id", user.id);
      formData.append("document_type", documentType);

      // Upload file via backend (uses service role to bypass RLS)
      const response = await fetch("http://localhost:5000/documents/upload-file", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }

      if (result.success) {
        setDocuments((prev) => {
          const existing = prev.find((d) => d.document_type === documentType);
          if (existing) {
            return prev.map((d) =>
              d.document_type === documentType ? result.document : d
            );
          }
          return [...prev, result.document];
        });
        alert(`✅ ${documentType} uploaded successfully!`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert(`Error uploading ${documentType}: ${error.message}`);
    } finally {
      setUploading((prev) => ({ ...prev, [documentType]: false }));
    }
  };

  const getDocumentStatus = (docType) => {
    return documents.find((d) => d.document_type === docType);
  };

  const copyProfileCode = () => {
    if (profileCode) {
      navigator.clipboard.writeText(profileCode.profile_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getCompletionStatus = () => {
    const aadhar = documents.find(
      (d) => d.document_type === "aadhar" && d.verified
    );
    const identity = documents.find(
      (d) =>
        (d.document_type === "pancard" || d.document_type === "votercard") &&
        d.verified
    );
    const bank = documents.find(
      (d) => d.document_type === "bankpassbook" && d.verified
    );
    const profilePic = documents.find(
      (d) => d.document_type === "profile_pic"
    );

    const completed = aadhar && (identity || bank) && profilePic;

    return {
      aadhar: !!aadhar,
      identity: !!identity,
      bank: !!bank,
      profilePic: !!profilePic,
      allComplete: completed,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-slate-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  const status = getCompletionStatus();

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <NavbarNew />

      {/* Main Content */}
      <div className="pt-20 pb-12">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            📄 Document Verification
          </h1>
          <p className="text-slate-600">
            Complete your profile by uploading required documents
          </p>
        </div>

        {/* Profile Code Card */}
        {profileCode && (
          <div className="bg-linear-to-r from-blue-50 to-cyan-50 border border-blue-300 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm mb-2">Your Profile Code</p>
                <p className="text-3xl font-bold text-blue-700 font-mono">
                  {profileCode.profile_code}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Use this code to track your verification status
                </p>
              </div>
              <button
                onClick={copyProfileCode}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition"
              >
                <FiCopy size={18} />
                {copied ? "Copied!" : "Copy Code"}
              </button>
            </div>
          </div>
        )}

        {/* Completion Status */}
        <div className="bg-slate-50 border border-slate-300 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FiAlertCircle className="text-yellow-500" /> Verification Status
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div
                className={`text-4xl mb-2 ${
                  status.aadhar ? "text-green-600" : "text-slate-400"
                }`}
              >
                {status.aadhar ? "✅" : "⏳"}
              </div>
              <p className="text-sm text-slate-700">Aadhar</p>
            </div>
            <div className="text-center">
              <div
                className={`text-4xl mb-2 ${
                  status.identity ? "text-green-600" : "text-slate-400"
                }`}
              >
                {status.identity ? "✅" : "⏳"}
              </div>
              <p className="text-sm text-slate-700">Identity</p>
            </div>
            <div className="text-center">
              <div
                className={`text-4xl mb-2 ${
                  status.bank ? "text-green-600" : "text-slate-400"
                }`}
              >
                {status.bank ? "✅" : "⏳"}
              </div>
              <p className="text-sm text-slate-700">Bank</p>
            </div>
            <div className="text-center">
              <div
                className={`text-4xl mb-2 ${
                  status.profilePic ? "text-green-600" : "text-slate-400"
                }`}
              >
                {status.profilePic ? "✅" : "⏳"}
              </div>
              <p className="text-sm text-slate-700">Photo</p>
            </div>
          </div>

          {status.allComplete && (
            <div className="mt-6 p-4 bg-green-50 border border-green-300 rounded-lg">
              <p className="text-green-700 font-semibold">
                ✨ All documents verified! Your profile is complete.
              </p>
            </div>
          )}
        </div>

        {/* Document Upload Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documentTypes.map((docType) => {
            const doc = getDocumentStatus(docType.id);
            const isUploading = uploading[docType.id];

            return (
              <div
                key={docType.id}
                className={`rounded-lg border p-6 transition ${
                  doc?.verified
                    ? "bg-green-50 border-green-300"
                    : doc
                    ? "bg-yellow-50 border-yellow-300"
                    : "bg-slate-50 border-slate-300"
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {docType.label}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      {docType.description}
                    </p>
                  </div>
                  <div className="text-2xl">
                    {doc?.verified ? (
                      <FiCheck className="text-green-600" />
                    ) : doc ? (
                      <div className="text-yellow-500">⏳</div>
                    ) : docType.required ? (
                      <FiX className="text-red-500" />
                    ) : (
                      <div className="text-slate-400">◯</div>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="mb-4">
                  {doc?.verified && (
                    <div className="text-xs text-green-700 bg-green-100 px-3 py-1 rounded inline-block">
                      ✓ Verified
                    </div>
                  )}
                  {doc && !doc.verified && (
                    <div className="text-xs text-yellow-700 bg-yellow-100 px-3 py-1 rounded inline-block">
                      ⏳ Pending Review
                    </div>
                  )}
                  {doc?.notes && (
                    <p className="text-xs text-slate-600 mt-2">
                      Admin Notes: {doc.notes}
                    </p>
                  )}
                </div>

                {/* Upload Section */}
                {!doc || !doc.verified ? (
                  <div>
                    <label className="block cursor-pointer">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) =>
                          handleFileUpload(docType.id, e.target.files?.[0])
                        }
                        disabled={isUploading}
                        className="hidden"
                      />
                      <div
                        className={`border-2 border-dashed rounded-lg p-4 text-center transition ${
                          isUploading
                            ? "border-slate-300 bg-slate-100"
                            : "border-slate-400 hover:border-blue-500 hover:bg-blue-50"
                        }`}
                      >
                        {isUploading ? (
                          <div className="text-slate-600">
                            <div className="animate-spin text-2xl mb-2">⌛</div>
                            <p className="text-sm">Uploading...</p>
                          </div>
                        ) : (
                          <div className="text-slate-600">
                            <FiUpload size={24} className="mx-auto mb-2" />
                            <p className="text-sm">Click to upload</p>
                            <p className="text-xs text-slate-500 mt-1">
                              or drag and drop
                            </p>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-green-700 mb-3">
                      ✓ Document uploaded
                    </p>
                    <a
                      href={doc.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      View Document
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-slate-50 border border-slate-300 rounded-lg p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-3">📋 Requirements</h3>
          <ul className="space-y-2 text-slate-700 text-sm">
            <li>✓ Aadhar Card - Mandatory (must be verified)</li>
            <li>✓ PAN Card OR Voter Card - At least one required (must be verified)</li>
            <li>✓ Bank Passbook/Statement - Mandatory (must be verified)</li>
            <li>✓ Clear Profile Picture - Mandatory</li>
            <li>✓ Once all documents are verified, your profile will be activated</li>
          </ul>
        </div>
        </div>
      </div>
    </div>
  );
};

export default WasherDocumentUpload;
