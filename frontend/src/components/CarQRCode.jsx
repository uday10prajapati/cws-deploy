import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { FiDownload, FiX } from "react-icons/fi";

export default function CarQRCode({ carData, userData, passData, userAddress, isOpen, onClose }) {
  const qrRef = useRef();
  const [qrValue, setQrValue] = useState(null);

  useEffect(() => {
    if (carData && userData) {
      // Prepare data to encode in QR code
      const qrData = {
        // User Details
        customerName: userData.name || userData.email?.split("@")[0],
        customerEmail: userData.email,
        customerPhone: userData.phone || "N/A",
        customerAddress: userAddress ? `${userAddress.address_line1}, ${userAddress.address_line2 || ''}, ${userAddress.city}, ${userAddress.state} ${userAddress.postal_code}`.replace(/,\s,/g, ',').trim() : "N/A",
        
        // Car Details
        carBrand: carData.brand,
        carModel: carData.model,
        carNumberPlate: carData.number_plate,
        carColor: carData.color || "N/A",
        
        // Monthly Pass Details (if available)
        hasPass: !!passData,
        passTotalWashes: passData?.total_washes || 0,
        passRemainingWashes: passData?.remaining_washes || 0,
        passExpiryDate: passData?.valid_till || "N/A",
        
        // Timestamp
        generatedAt: new Date().toISOString(),
      };

      // Convert to JSON string for QR code
      setQrValue(JSON.stringify(qrData));
    }
  }, [carData, userData, passData, userAddress]);

  const downloadQR = () => {
    if (qrRef.current) {
      // Get the SVG element
      const svg = qrRef.current.querySelector("svg");
      if (svg) {
        // Convert SVG to canvas and download as PNG
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const svgString = new XMLSerializer().serializeToString(svg);
        const img = new Image();
        
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          
          const url = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.download = `${carData.brand}-${carData.number_plate}-QR.png`;
          link.href = url;
          link.click();
        };
        
        img.src = "data:image/svg+xml;base64," + btoa(svgString);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-lg">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 shrink-0">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-900">
            🎫 Car QR Code
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 transition"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#3b82f6 #f1f5f9'
        }}>
          {/* QR Code Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 flex justify-center">
            {qrValue ? (
              <div ref={qrRef} className="flex justify-center">
                <QRCodeSVG
                  value={qrValue}
                  size={280}
                  level="H"
                  includeMargin={true}
                />
              </div>
            ) : (
              <p className="text-slate-600">Generating QR Code...</p>
            )}
          </div>

          {/* QR Code Details */}
          <div className="space-y-4">
            {/* Car Details */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900 mb-3">🚗 Car Details</p>
              <div className="text-sm text-slate-700 space-y-2">
                <p><span className="font-medium">Brand:</span> {carData.brand} {carData.model}</p>
                <p><span className="font-medium">Number Plate:</span> <span className="font-mono font-bold text-blue-600">{carData.number_plate}</span></p>
                {carData.color && <p><span className="font-medium">Color:</span> {carData.color}</p>}
                
                {/* Monthly Pass Status */}
                <div className="pt-2 border-t border-blue-200 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Pass Status:</span>
                    {passData ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                        <span className="text-lg">✓</span> ACTIVE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-200">
                        <span className="text-lg">✕</span> INACTIVE
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-emerald-900 mb-3">👤 Customer Details</p>
              <div className="text-sm text-slate-700 space-y-2">
                <p><span className="font-medium">Name:</span> {userData.name || userData.email?.split("@")[0]}</p>
                <p><span className="font-medium">Email:</span> {userData.email}</p>
                <p><span className="font-medium">Phone:</span> {userData.phone || "N/A"}</p>
              </div>
            </div>

            {/* Address Details */}
            {userAddress && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-purple-900 mb-3">📍 Address</p>
                <div className="text-sm text-slate-700 space-y-1">
                  <p>{userAddress.address_line1}</p>
                  {userAddress.address_line2 && <p>{userAddress.address_line2}</p>}
                  <p>{userAddress.city}, {userAddress.state} {userAddress.postal_code}</p>
                </div>
              </div>
            )}

            {/* Monthly Pass Details (if available) */}
            {passData ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-amber-900 mb-3">✨ Monthly Pass (Active)</p>
                <div className="text-sm text-slate-700 space-y-2">
                  <p><span className="font-medium">Total Washes:</span> <span className="text-amber-700 font-bold">{passData.total_washes}</span></p>
                  <p><span className="font-medium">Remaining Washes:</span> <span className="text-emerald-700 font-bold">{passData.remaining_washes}</span></p>
                  <p><span className="font-medium">Expires:</span> {new Date(passData.valid_till).toLocaleDateString()}</p>
                  
                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Usage</span>
                      <span className="text-amber-700">{passData.total_washes - passData.remaining_washes}/{passData.total_washes}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-amber-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${
                            ((passData.total_washes - passData.remaining_washes) /
                              passData.total_washes) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-slate-600 text-sm flex items-center gap-2">
                  <span>ℹ️</span>
                  No active monthly pass for this car
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Buttons - Fixed */}
        <div className="border-t border-slate-200 p-6 flex gap-3 justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
          >
            Close
          </button>
          <button
            onClick={downloadQR}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 transition"
          >
            <FiDownload size={18} />
            Download QR Code
          </button>
        </div>

        {/* Info Message */}
        <div className="bg-blue-50 border-t border-slate-200 px-6 py-3 text-xs text-slate-600 shrink-0">
          💡 <span className="font-medium">How to use:</span> Washers can scan this QR code to see all your details.
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        div::-webkit-scrollbar {
          width: 8px;
        }
        div::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        div::-webkit-scrollbar-thumb {
          background: #3b82f6;
          border-radius: 4px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: #1e40af;
        }
      `}</style>
    </div>
  );
}
