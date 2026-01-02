import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import { initializeStorageBucket } from "../utils/storageHelpers";
import {
  FiUpload,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiCopy,
  FiAlertCircle,
  FiMenu,
  FiChevronLeft,
  FiLogOut,
  FiHome,
  FiClipboard,
  FiAward,
  FiUser,
} from "react-icons/fi";

const SalesDocumentUpload = () => {
  useRoleBasedRedirect("sales");
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [profileCode, setProfileCode] = useState("");
  const [uploading, setUploading] = useState({});
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
   useRoleBasedRedirect(["sales"]);
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        navigate("/login");
        return;
      }

      setUser(authUser);

      // Load documents
      const docsRes = await fetch(
        `http://localhost:5000/documents/sales/${authUser.id}`
      );
      const docsData = await docsRes.json();
      if (docsData.success) {
        setDocuments(docsData.documents || []);
      }

      // Load profile code
      const codeRes = await fetch(
        `http://localhost:5000/documents/sales/profile-code/${authUser.id}`
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
      formData.append("sales_id", user.id);
      formData.append("document_type", documentType);

      // Upload file via backend
      const response = await fetch("http://localhost:5000/documents/sales/upload-file", {
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(profileCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getDocumentStatus = (documentType) => {
    const doc = documents.find((d) => d.document_type === documentType);
    if (!doc) return "required";
    if (doc.verified) return "verified";
    return "pending";
  };

  const salesMenu = [
    { name: "Dashboard", icon: <FiHome />, link: "/sales-dashboard" },
    { name: "Documents", icon: <span>📄</span>, link: "/sales/documents" },
    { name: "Profile", icon: <FiUser />, link: "/profile" },
  ];

  const requiredDocuments = [
    { type: "aadhar", label: "Aadhar Card", emoji: "🪪", required: true },
    {
      type: "identity",
      label: "PAN / Voter Card",
      emoji: "📋",
      required: true,
    },
    {
      type: "bank_passbook",
      label: "Bank Passbook",
      emoji: "🏦",
      required: true,
    },
    { type: "selfie", label: "Selfie Photo", emoji: "📸", required: true },
    {
      type: "educational_certificate",
      label: "Educational Certificate",
      emoji: "🎓",
      required: true,
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 text-white flex">
      {/* ▓▓▓ SIDEBAR ▓▓▓ */}
      <div
        className={`fixed lg:relative top-0 left-0 h-screen bg-slate-900 border-r border-slate-800 transition-all duration-300 z-50 ${
          collapsed ? "w-20" : "w-64"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          {!collapsed && (
            <h2 className="text-xl font-bold text-blue-400">CarWash+</h2>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="lg:flex hidden p-2 hover:bg-slate-800 rounded-lg transition"
          >
            <FiChevronLeft
              className={`transition-transform ${collapsed ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {/* Menu */}
        <nav className="p-4 space-y-2">
          {salesMenu.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                navigate(item.link);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                window.location.pathname === item.link
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {!collapsed && <span>{item.name}</span>}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={() => {
              localStorage.removeItem("userDetails");
              localStorage.removeItem("userId");
              localStorage.removeItem("userRole");
              supabase.auth.signOut();
              navigate("/login");
            }}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition"
          >
            <FiLogOut className="text-xl" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* ▓▓▓ MOBILE TOP BAR ▓▓▓ */}
      <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-4 shadow-lg flex items-center justify-between fixed top-0 left-0 right-0 z-40">
        <h1 className="text-xl font-bold bg-linear-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text">
          Documents
        </h1>
        <FiMenu
          className="text-2xl text-white cursor-pointer hover:text-blue-400"
          onClick={() => setSidebarOpen(true)}
        />
      </div>

      {/* ▓▓▓ BACKDROP ▓▓▓ */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ▓▓▓ MAIN CONTENT ▓▓▓ */}
      <div className="flex-1 flex flex-col overflow-auto lg:mt-0 mt-16">
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              📄 Document Verification
            </h1>
            <p className="text-slate-400">
              Upload required documents to complete your verification process.
              All documents must be clear and valid.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
            </div>
          ) : (
            <>
              {/* Profile Code Section */}
              <div className="mb-8 p-6 bg-linear-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span>🆔</span> Your Profile Code
                </h2>
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-mono font-bold text-blue-400 bg-slate-800/50 px-4 py-2 rounded-lg">
                    {profileCode || "Generating..."}
                  </div>
                  {profileCode && (
                    <button
                      onClick={copyToClipboard}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                        copied
                          ? "bg-green-600 text-white"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      <FiCopy /> {copied ? "Copied!" : "Copy"}
                    </button>
                  )}
                </div>
                <p className="text-sm text-slate-400 mt-2">
                  Use this code to track your verification status
                </p>
              </div>

              {/* Verification Status */}
              <div className="mb-8 p-6 bg-slate-800/50 border border-slate-700 rounded-lg">
                <h2 className="text-xl font-bold mb-4">✅ Verification Status</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {requiredDocuments.map((doc) => {
                    const status = getDocumentStatus(doc.type);
                    const statusColor =
                      status === "verified"
                        ? "text-green-400"
                        : status === "pending"
                        ? "text-yellow-400"
                        : "text-slate-400";
                    const statusIcon =
                      status === "verified"
                        ? "✓"
                        : status === "pending"
                        ? "⏳"
                        : "◯";

                    return (
                      <div key={doc.type} className="text-center">
                        <div className={`text-4xl mb-2 ${statusColor}`}>
                          {statusIcon}
                        </div>
                        <p className="text-sm text-slate-300">{doc.label}</p>
                        <p className={`text-xs ${statusColor}`}>
                          {status === "verified"
                            ? "Verified"
                            : status === "pending"
                            ? "Pending"
                            : "Required"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Document Upload Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {requiredDocuments.map((doc) => {
                  const uploadedDoc = documents.find(
                    (d) => d.document_type === doc.type
                  );
                  const isUploading = uploading[doc.type];

                  return (
                    <div
                      key={doc.type}
                      className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-blue-500/50 transition"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold flex items-center gap-2 mb-1">
                            <span className="text-2xl">{doc.emoji}</span>
                            {doc.label}
                          </h3>
                          <p className="text-sm text-slate-400">
                            {doc.required ? "Required" : "Optional"}
                          </p>
                        </div>
                        {uploadedDoc?.verified ? (
                          <div className="text-green-400 text-2xl">
                            <FiCheck />
                          </div>
                        ) : uploadedDoc ? (
                          <div className="text-yellow-400 text-2xl flex items-center gap-1">
                            ⏳
                          </div>
                        ) : (
                          <div className="text-slate-400 text-2xl">
                            <FiAlertCircle />
                          </div>
                        )}
                      </div>

                      {uploadedDoc ? (
                        <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
                          <p className="text-sm text-slate-300 mb-2">
                            <strong>Uploaded:</strong>{" "}
                            {new Date(uploadedDoc.uploaded_at).toLocaleDateString()}
                          </p>
                          {uploadedDoc.verified && (
                            <div className="flex items-center gap-2 text-green-400 text-sm">
                              <FiCheck /> Verified
                            </div>
                          )}
                          {!uploadedDoc.verified && uploadedDoc.notes && (
                            <div className="flex items-start gap-2 text-yellow-400 text-sm mt-2">
                              <FiAlertCircle className="mt-0.5 shrink-0" />
                              <span>{uploadedDoc.notes}</span>
                            </div>
                          )}
                        </div>
                      ) : null}

                      <label className="block">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) =>
                            e.target.files &&
                            handleFileUpload(doc.type, e.target.files[0])
                          }
                          disabled={isUploading}
                          className="hidden"
                        />
                        <div
                          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
                            isUploading
                              ? "border-slate-600 bg-slate-700/30 cursor-not-allowed"
                              : "border-slate-600 hover:border-blue-400 hover:bg-slate-700/20"
                          }`}
                        >
                          {isUploading ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                              <span className="ml-2 text-sm">Uploading...</span>
                            </div>
                          ) : (
                            <>
                              <FiUpload className="text-2xl mx-auto mb-2 text-slate-400" />
                              <p className="text-sm text-slate-300">
                                Click or drag to upload
                              </p>
                              <p className="text-xs text-slate-500">
                                Image or PDF (Max 50MB)
                              </p>
                            </>
                          )}
                        </div>
                      </label>
                    </div>
                  );
                })}
              </div>

              {/* Information Section */}
              <div className="mt-12 p-6 bg-blue-600/10 border border-blue-500/30 rounded-lg">
                <h3 className="text-xl font-bold text-blue-400 mb-4">
                  📋 Document Requirements
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300 text-sm">
                  <div>
                    <p className="font-semibold text-blue-400 mb-2">
                      ✅ Aadhar Card:
                    </p>
                    <p>Clear photo of both sides of your Aadhar card</p>
                  </div>
                  <div>
                    <p className="font-semibold text-blue-400 mb-2">
                      ✅ PAN / Voter Card:
                    </p>
                    <p>Valid PAN card OR Voter ID (one of them is required)</p>
                  </div>
                  <div>
                    <p className="font-semibold text-blue-400 mb-2">
                      ✅ Bank Passbook:
                    </p>
                    <p>First page with account holder name and account number</p>
                  </div>
                  <div>
                    <p className="font-semibold text-blue-400 mb-2">
                      ✅ Selfie Photo:
                    </p>
                    <p>Clear, well-lit photo of your face (recent, within 3 months)</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="font-semibold text-blue-400 mb-2">
                      ✅ Educational Certificate:
                    </p>
                    <p>
                      High school, diploma, or degree certificate (scanned/photo)
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesDocumentUpload;
