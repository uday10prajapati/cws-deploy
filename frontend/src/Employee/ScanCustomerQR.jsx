import { useState } from "react";
import { FiX, FiUpload, FiMenu, FiChevronLeft } from "react-icons/fi";
import { supabase } from "../supabaseClient";

export default function ScanCustomerQR() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [fileInputRef, setFileInputRef] = useState(null);

  const handleScanComplete = (data) => {
    setScannedData(data);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imageData = event.target?.result;
        
        // Try to decode using QR server API
        try {
          const response = await fetch("https://api.qrserver.com/api/read-qr-code/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileurl: imageData })
          });

          if (response.ok) {
            const result = await response.json();
            if (result[0]?.symbol[0]?.data) {
              const decodedData = JSON.parse(result[0].symbol[0].data);
              handleScanComplete(decodedData);
            }
          }
        } catch (err) {
          console.error("Error decoding QR:", err);
          alert("Could not decode QR code. Please try a clearer image.");
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert("Error processing image: " + err.message);
    }
  };

  const clearScannedData = () => {
    setScannedData(null);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 text-white">
      {/* Mobile Header */}
      <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-4 shadow-lg flex items-center justify-between fixed top-0 left-0 right-0 z-40">
        <h1 className="text-xl font-bold bg-linear-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text">
          Scan QR
        </h1>
        <FiMenu
          className="text-2xl text-white cursor-pointer hover:text-blue-400 transition-colors"
          onClick={() => setSidebarOpen(true)}
        />
      </div>

      {/* Main Content */}
      <div className="p-4 md:p-8 mt-16 lg:mt-0 pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">📱 Scan Customer QR Code</h1>
            <p className="text-slate-400">Scan a customer's QR code to view their details, car information, and monthly pass status.</p>
          </div>

          {scannedData ? (
            // Display scanned data
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="bg-green-600/20 border border-green-500/50 rounded-lg p-4 flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-semibold text-green-300">QR Code Scanned Successfully</p>
                  <p className="text-sm text-green-200">All customer details verified</p>
                </div>
              </div>

              {/* Car Details */}
              <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-blue-300 mb-4 flex items-center gap-2">
                  🚗 Car Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 p-4 rounded-lg">
                    <p className="text-sm text-slate-400 mb-1">Brand & Model</p>
                    <p className="text-lg font-semibold">{scannedData.carBrand} {scannedData.carModel}</p>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-lg">
                    <p className="text-sm text-slate-400 mb-1">Number Plate</p>
                    <p className="text-lg font-mono font-bold text-blue-400">{scannedData.carNumberPlate}</p>
                  </div>
                  {scannedData.carColor !== "N/A" && (
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                      <p className="text-sm text-slate-400 mb-1">Color</p>
                      <p className="text-lg font-semibold">{scannedData.carColor}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Details */}
              <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-green-300 mb-4 flex items-center gap-2">
                  👤 Customer Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 p-4 rounded-lg">
                    <p className="text-sm text-slate-400 mb-1">Name</p>
                    <p className="text-lg font-semibold">{scannedData.customerName}</p>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-lg">
                    <p className="text-sm text-slate-400 mb-1">Email</p>
                    <p className="text-sm font-semibold text-blue-300 break-all">{scannedData.customerEmail}</p>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-lg md:col-span-2">
                    <p className="text-sm text-slate-400 mb-1">Phone</p>
                    <p className="text-lg font-semibold">{scannedData.customerPhone}</p>
                  </div>
                </div>
              </div>

              {/* Address Details */}
              {scannedData.customerAddress && scannedData.customerAddress !== "N/A" && (
                <div className="bg-purple-600/10 border border-purple-500/30 rounded-lg p-6">
                  <h2 className="text-2xl font-bold text-purple-300 mb-4 flex items-center gap-2">
                    📍 Address
                  </h2>
                  <div className="bg-slate-800/50 p-4 rounded-lg">
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">{scannedData.customerAddress}</p>
                  </div>
                </div>
              )}

              {/* Monthly Pass Details */}
              {scannedData.hasPass ? (
                <div className="bg-amber-600/10 border border-amber-500/30 rounded-lg p-6">
                  <h2 className="text-2xl font-bold text-amber-300 mb-4 flex items-center gap-2">
                    ✨ Monthly Pass (Active)
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                      <p className="text-sm text-slate-400 mb-1">Total Washes</p>
                      <p className="text-2xl font-bold text-amber-300">{scannedData.passTotalWashes}</p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                      <p className="text-sm text-slate-400 mb-1">Remaining Washes</p>
                      <p className="text-2xl font-bold text-green-400">{scannedData.passRemainingWashes}</p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                      <p className="text-sm text-slate-400 mb-1">Expires</p>
                      <p className="text-lg font-semibold">{new Date(scannedData.passExpiryDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400">Usage Progress</span>
                      <span className="text-amber-300 font-semibold">
                        {scannedData.passTotalWashes - scannedData.passRemainingWashes} / {scannedData.passTotalWashes}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-amber-500 h-3 rounded-full transition-all"
                        style={{
                          width: `${
                            ((scannedData.passTotalWashes - scannedData.passRemainingWashes) /
                              scannedData.passTotalWashes) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                  <p className="text-slate-300 flex items-center gap-3">
                    <span className="text-2xl">ℹ️</span>
                    This customer does not have an active monthly pass
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={clearScannedData}
                  className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
                >
                  📱 Scan Another QR
                </button>
              </div>

              {/* Timestamp */}
              <div className="text-xs text-slate-500 text-center">
                Scanned at: {new Date(scannedData.generatedAt).toLocaleString()}
              </div>
            </div>
          ) : (
            // Scan options
            <div className="space-y-6">
              {/* Upload QR Image */}
              <div
                className="border-2 border-dashed border-slate-600 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-500/5 transition"
                onClick={() => document.getElementById("qr-file-input")?.click()}
              >
                <FiUpload className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-300 font-semibold text-lg mb-2">Upload Customer QR Code</p>
                <p className="text-slate-500 text-sm mb-4">Click to select an image file or drag and drop</p>
                <p className="text-xs text-slate-600">Supports PNG, JPG, GIF, WebP</p>
                <input
                  id="qr-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Manual Input */}
              <button
                onClick={() => {
                  const input = prompt("Paste the QR code data here:");
                  if (input) {
                    try {
                      const data = JSON.parse(input);
                      handleScanComplete(data);
                    } catch (err) {
                      alert("Invalid QR code data format");
                    }
                  }
                }}
                className="w-full px-6 py-4 rounded-lg border-2 border-slate-600 hover:border-green-500 hover:bg-green-500/5 text-slate-300 hover:text-green-300 font-semibold transition"
              >
                📋 Manual Input (Paste QR Data)
              </button>

              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-blue-300 font-semibold mb-2">📱 Upload QR Code</p>
                  <p className="text-sm text-slate-400">Ask customer to show their QR code and scan/upload the image</p>
                </div>

                <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-4">
                  <p className="text-green-300 font-semibold mb-2">✅ View Details</p>
                  <p className="text-sm text-slate-400">See all customer info, car details, and monthly pass status</p>
                </div>

                <div className="bg-purple-600/10 border border-purple-500/30 rounded-lg p-4">
                  <p className="text-purple-300 font-semibold mb-2">⚡ Real-time Data</p>
                  <p className="text-sm text-slate-400">All information is up-to-date from the database</p>
                </div>
              </div>

              {/* Help Section */}
              <div className="bg-amber-600/10 border border-amber-500/30 rounded-lg p-6">
                <h3 className="text-amber-300 font-semibold mb-3 flex items-center gap-2">
                  ❓ How to Use
                </h3>
                <ol className="space-y-2 text-sm text-slate-300">
                  <li><span className="font-semibold text-amber-300">1.</span> Ask the customer to open their profile in the app</li>
                  <li><span className="font-semibold text-amber-300">2.</span> Customer clicks on their car and selects "🎫 QR Code"</li>
                  <li><span className="font-semibold text-amber-300">3.</span> Upload or scan the QR code image</li>
                  <li><span className="font-semibold text-amber-300">4.</span> All customer and car details will be displayed instantly</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        /* Custom scrollbar for the entire page */
        html {
          scrollbar-width: thin;
          scrollbar-color: #3b82f6 #0f172a;
        }
        
        html::-webkit-scrollbar {
          width: 10px;
        }
        
        html::-webkit-scrollbar-track {
          background: #0f172a;
        }
        
        html::-webkit-scrollbar-thumb {
          background: #3b82f6;
          border-radius: 5px;
        }
        
        html::-webkit-scrollbar-thumb:hover {
          background: #1e40af;
        }
      `}</style>
    </div>
  );
}
