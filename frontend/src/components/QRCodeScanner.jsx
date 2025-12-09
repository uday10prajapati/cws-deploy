import { useState, useRef, useEffect } from "react";
import { FiX, FiUpload } from "react-icons/fi";

export default function QRCodeScanner({ isOpen, onClose, onScanComplete }) {
  const [scannedData, setScannedData] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      // Read file as data URL
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imageData = event.target?.result;
        
        // Use jsQR library to decode QR code
        // For now, we'll use a simple approach with canvas
        const img = new Image();
        img.onload = async () => {
          // We'll use an online API or library to decode
          // For demo, we're using a workaround with html5-qrcode or similar
          decodeQRCode(imageData);
        };
        img.src = imageData;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Failed to process image: " + err.message);
    }
  };

  const decodeQRCode = async (imageData) => {
    try {
      // Using an external API to decode QR code
      // You can also integrate jsQR or other libraries
      const response = await fetch("https://api.qrserver.com/api/read-qr-code/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileurl: imageData })
      }).catch(() => null);

      if (response?.ok) {
        const result = await response.json();
        if (result.data) {
          const data = JSON.parse(result.data);
          setScannedData(data);
          if (onScanComplete) onScanComplete(data);
        }
      } else {
        // Fallback: ask user to paste data manually
        setError("Could not decode QR code. Please try again or use the manual input option.");
      }
    } catch (err) {
      setError("Error decoding QR code: " + err.message);
    }
  };

  const handleManualInput = () => {
    const input = prompt("Paste the QR code data here:");
    if (input) {
      try {
        const data = JSON.parse(input);
        setScannedData(data);
        if (onScanComplete) onScanComplete(data);
      } catch (err) {
        setError("Invalid QR code data format");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">📱 Scan Customer QR Code</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            <FiX size={24} />
          </button>
        </div>

        {scannedData ? (
          // Display scanned data
          <div className="space-y-4">
            {/* Car Details */}
            <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-300 mb-2">🚗 Car Details</p>
              <div className="text-sm text-slate-300 space-y-1">
                <p><span className="font-medium">Brand:</span> {scannedData.carBrand} {scannedData.carModel}</p>
                <p><span className="font-medium">Number Plate:</span> <span className="font-mono font-bold text-blue-400">{scannedData.carNumberPlate}</span></p>
                {scannedData.carColor !== "N/A" && <p><span className="font-medium">Color:</span> {scannedData.carColor}</p>}
              </div>
            </div>

            {/* Customer Details */}
            <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-4">
              <p className="text-sm font-semibold text-green-300 mb-2">👤 Customer Details</p>
              <div className="text-sm text-slate-300 space-y-1">
                <p><span className="font-medium">Name:</span> {scannedData.customerName}</p>
                <p><span className="font-medium">Email:</span> {scannedData.customerEmail}</p>
                <p><span className="font-medium">Phone:</span> {scannedData.customerPhone}</p>
              </div>
            </div>

            {/* Monthly Pass Details (if available) */}
            {scannedData.hasPass && (
              <div className="bg-amber-600/10 border border-amber-500/30 rounded-lg p-4">
                <p className="text-sm font-semibold text-amber-300 mb-2">✨ Monthly Pass Details</p>
                <div className="text-sm text-slate-300 space-y-1">
                  <p><span className="font-medium">Total Washes:</span> {scannedData.passTotalWashes}</p>
                  <p><span className="font-medium">Remaining Washes:</span> {scannedData.passRemainingWashes}</p>
                  <p><span className="font-medium">Expires:</span> {new Date(scannedData.passExpiryDate).toLocaleDateString()}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setScannedData(null)}
                className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition"
              >
                Scan Another
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          // Scan options
          <div className="space-y-4">
            {error && (
              <div className="bg-red-600/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Upload Option */}
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition"
              onClick={() => fileInputRef.current?.click()}
            >
              <FiUpload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-300 font-medium mb-1">Upload QR Code Image</p>
              <p className="text-slate-500 text-sm">Click to select an image file</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Manual Input */}
            <button
              onClick={handleManualInput}
              className="w-full px-4 py-3 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition"
            >
              📋 Manual Input (Paste QR Data)
            </button>

            {/* Info */}
            <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-xs text-blue-300">
                💡 <span className="font-medium">How to use:</span> Ask the customer to show you their QR code or scan it from their phone.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
