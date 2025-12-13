import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { FiDownload, FiRefreshCw, FiEye, FiX, FiCheck } from "react-icons/fi";

export default function QRCodeManager() {
  const [user, setUser] = useState(null);
  const [cars, setCars] = useState([]);
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedQR, setSelectedQR] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadUserAndCars();
  }, []);

  const loadUserAndCars = async () => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return;

      setUser(auth.user);

      // Fetch customer's cars
      const { data: customerCars } = await supabase
        .from("cars")
        .select("*")
        .eq("customer_id", auth.user.id);

      setCars(customerCars || []);

      // Fetch QR codes
      loadQRCodes(auth.user.id);
    } catch (err) {
      console.error("Error loading data:", err);
    }
  };

  const loadQRCodes = async (customerId) => {
    try {
      const response = await fetch(`http://localhost:5000/qrcode/list/${customerId}`);
      const result = await response.json();

      if (result.success) {
        setQrCodes(result.qrCodes);
      }
    } catch (err) {
      console.error("Error loading QR codes:", err);
    }
  };

  const generateQRCode = async (carId) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/qrcode/generate/${carId}`);
      const result = await response.json();

      if (result.success) {
        setSelectedQR(result.qrCode);
        loadQRCodes(user.id);
        alert("QR code generated successfully!");
      } else {
        alert("Error: " + result.error);
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = (qrImage, carId) => {
    const link = document.createElement("a");
    link.href = qrImage;
    link.download = `qr-code-${carId}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">QR Code Management</h1>
          <p className="text-slate-400">Generate and manage QR codes for your car washes</p>
        </div>

        {/* Cars List */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6">Your Cars</h2>

          {cars.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No cars found. Add a car first.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cars.map((car) => {
                const qrCode = qrCodes.find((qr) => qr.car_id === car.id);

                return (
                  <div
                    key={car.id}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-blue-600 transition-colors"
                  >
                    {/* Car Info */}
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-white">
                        {car.brand} {car.model}
                      </h3>
                      <p className="text-blue-400 font-mono text-sm font-bold">
                        {car.number_plate}
                      </p>
                    </div>

                    {/* QR Code Preview */}
                    {qrCode && (
                      <div className="mb-4 p-4 bg-white rounded-lg">
                        <img
                          src={qrCode.qr_code_image}
                          alt={`QR Code for ${car.number_plate}`}
                          className="w-full h-auto"
                        />
                      </div>
                    )}

                    {/* QR Code Info */}
                    {qrCode && (
                      <div className="mb-4 text-sm text-slate-300 space-y-1">
                        <p>
                          <span className="text-slate-400">Customer:</span>{" "}
                          {qrCode.customer_name}
                        </p>
                        <p>
                          <span className="text-slate-400">Email:</span> {qrCode.customer_email}
                        </p>
                        <p>
                          <span className="text-slate-400">Mobile:</span> {qrCode.customer_mobile}
                        </p>
                        <p className="text-slate-400">
                          Generated: {new Date(qrCode.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => generateQRCode(car.id)}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 rounded-lg text-white text-sm font-medium transition"
                      >
                        <FiRefreshCw size={16} />
                        {qrCode ? "Regenerate" : "Generate"}
                      </button>

                      {qrCode && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedQR({
                                ...qrCode,
                                qrCodeImage: qrCode.qr_code_image,
                              });
                              setShowPreview(true);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm font-medium transition"
                          >
                            <FiEye size={16} />
                            Preview
                          </button>

                          <button
                            onClick={() => downloadQRCode(qrCode.qr_code_image, car.number_plate)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm font-medium transition"
                          >
                            <FiDownload size={16} />
                            Download
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* QR Code Preview Modal */}
        {showPreview && selectedQR && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-md w-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">QR Code Preview</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition"
                >
                  <FiX className="text-white" size={24} />
                </button>
              </div>

              <div className="bg-white p-6 rounded-lg mb-6">
                <img
                  src={selectedQR.qrCodeImage}
                  alt="QR Code Preview"
                  className="w-full h-auto"
                />
              </div>

              <div className="space-y-3 mb-6 text-sm text-slate-300">
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wide">Customer Name</p>
                  <p className="font-semibold text-white">{selectedQR.customer_name}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wide">Email</p>
                  <p className="font-mono text-sm">{selectedQR.customer_email}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wide">Mobile</p>
                  <p className="font-mono text-sm">{selectedQR.customer_mobile}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wide">Address</p>
                  <p className="font-mono text-sm">{selectedQR.customer_address}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    downloadQRCode(
                      selectedQR.qrCodeImage,
                      selectedQR.qrData?.numberPlate || "qr-code"
                    );
                    setShowPreview(false);
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium transition flex items-center justify-center gap-2"
                >
                  <FiDownload size={18} />
                  Download
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
