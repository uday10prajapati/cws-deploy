import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { FiCamera, FiCheck, FiX, FiAlertCircle } from "react-icons/fi";

export default function WashSessionManager() {
  const [user, setUser] = useState(null);
  const [qrCodeInput, setQrCodeInput] = useState("");
  const [currentSession, setCurrentSession] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [beforeImages, setBeforeImages] = useState([]);
  const [afterImages, setAfterImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    getAuthUser();
  }, []);

  const getAuthUser = async () => {
    const { data: auth } = await supabase.auth.getUser();
    setUser(auth.user);
  };

  const handleQRCodeScan = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Parse QR code data - the QR code contains JSON directly
      let qrData;
      try {
        qrData = typeof qrCodeInput === "string" ? JSON.parse(qrCodeInput) : qrCodeInput;
      } catch (parseErr) {
        setError("Invalid QR code format. Please scan a valid QR code.");
        setLoading(false);
        setQrCodeInput("");
        return;
      }

      // Validate required fields
      if (!qrData.carId || !qrData.customerId) {
        setError("Invalid QR code. Missing car or customer information.");
        setLoading(false);
        setQrCodeInput("");
        return;
      }

      // Set customer details from QR data
      setCustomerDetails(qrData);

      // Start wash session with the car and customer from QR data
      const sessionResponse = await fetch(
        "http://localhost:5000/qrcode/start-wash-session",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            carId: qrData.carId,
            customerId: qrData.customerId,
            washerId: user.id,
          }),
        }
      );

      const sessionResult = await sessionResponse.json();

      if (sessionResult.success) {
        setCurrentSession(sessionResult.washSession || { id: qrData.carId });
        setSuccess(`Session started for ${qrData.customerName}`);
        setBeforeImages([]);
        setAfterImages([]);
      } else {
        setError("Failed to start wash session: " + (sessionResult.error || "Unknown error"));
        setLoading(false);
      }
    } catch (err) {
      setError("Error: " + err.message);
      setLoading(false);
    } finally {
      setQrCodeInput("");
    }
  };

  const handleImageCapture = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = {
        url: event.target.result,
        type: type, // 'before' or 'after'
        position: type === "before" ? beforeImages.length + 1 : afterImages.length + 1,
        timestamp: new Date(),
      };

      if (type === "before") {
        if (beforeImages.length < 4) {
          setBeforeImages([...beforeImages, imageData]);
        } else {
          setError("Maximum 4 before images allowed");
        }
      } else {
        if (afterImages.length < 4) {
          setAfterImages([...afterImages, imageData]);
        } else {
          setError("Maximum 4 after images allowed");
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (index, type) => {
    if (type === "before") {
      setBeforeImages(beforeImages.filter((_, i) => i !== index));
    } else {
      setAfterImages(afterImages.filter((_, i) => i !== index));
    }
  };

  const completeWash = async () => {
    if (beforeImages.length === 0 || afterImages.length === 0) {
      setError("Please upload at least one before and one after image");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Upload images
      const allImages = [
        ...beforeImages.map((img) => ({ ...img, type: "before" })),
        ...afterImages.map((img) => ({ ...img, type: "after" })),
      ];

      const uploadResponse = await fetch(
        "http://localhost:5000/qrcode/upload-wash-images",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            washSessionId: currentSession.id,
            images: allImages,
          }),
        }
      );

      const uploadResult = await uploadResponse.json();

      if (!uploadResult.success) {
        setError("Failed to upload images");
        setLoading(false);
        return;
      }

      // Complete wash session
      const completeResponse = await fetch(
        "http://localhost:5000/qrcode/complete-wash",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            washSessionId: currentSession.id,
          }),
        }
      );

      const completeResult = await completeResponse.json();

      if (completeResult.success) {
        setSuccess(`Wash completed! Customer earned 1 loyalty point`);
        setTimeout(() => {
          setCurrentSession(null);
          setCustomerDetails(null);
          setBeforeImages([]);
          setAfterImages([]);
        }, 2000);
      } else {
        setError("Failed to complete wash session");
      }
    } catch (err) {
      setError("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Wash Session Manager</h1>
          <p className="text-slate-400">Scan QR code to start a wash session</p>
        </div>

        {!currentSession ? (
          /* QR Code Scanner */
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-8">
            <h2 className="text-2xl font-semibold text-white mb-6">Scan QR Code</h2>

            {error && (
              <div className="mb-6 p-4 bg-red-600/20 border border-red-600 rounded-lg flex items-start gap-3">
                <FiAlertCircle className="text-red-400 mt-1 shrink-0" size={20} />
                <p className="text-red-300">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-600/20 border border-green-600 rounded-lg">
                <p className="text-green-300">{success}</p>
              </div>
            )}

            <form onSubmit={handleQRCodeScan} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  QR Code Data (JSON format or scanned data)
                </label>
                <textarea
                  value={qrCodeInput}
                  onChange={(e) => setQrCodeInput(e.target.value)}
                  placeholder={`Paste QR code data here or use QR scanner...`}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono text-sm"
                  rows="4"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !qrCodeInput.trim()}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 rounded-lg text-white font-semibold transition flex items-center justify-center gap-2"
              >
                {loading ? "Processing..." : "Start Wash Session"}
              </button>
            </form>

            <div className="mt-6 p-4 bg-blue-600/10 border border-blue-600/30 rounded-lg">
              <p className="text-blue-300 text-sm">
                💡 <strong>How to use:</strong> Scan the QR code with your mobile scanner or paste the QR data directly into the field above.
              </p>
            </div>
          </div>
        ) : (
          /* Wash Session Active */
          <div className="space-y-6">
            {/* Customer Details Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-semibold text-white">Customer Details</h2>
                {customerDetails?.isActive ? (
                  <div className="px-3 py-1 bg-green-600/20 border border-green-600 rounded-full">
                    <p className="text-green-300 text-xs font-semibold">✓ PASS ACTIVE</p>
                  </div>
                ) : (
                  <div className="px-3 py-1 bg-yellow-600/20 border border-yellow-600 rounded-full">
                    <p className="text-yellow-300 text-xs font-semibold">⚠ NO ACTIVE PASS</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Customer Name</p>
                  <p className="text-white font-semibold">{customerDetails?.customerName}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Mobile Number</p>
                  <p className="text-white font-mono">{customerDetails?.customerMobile}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-slate-400 text-sm mb-1">Email</p>
                  <p className="text-white font-mono text-sm">{customerDetails?.customerEmail}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Address</p>
                  <p className="text-white">{customerDetails?.customerAddress}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Village</p>
                  <p className="text-white">{customerDetails?.customerVillage || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Image Upload Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Before Images */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Before Wash</h3>
                <p className="text-slate-400 text-sm mb-4">{beforeImages.length}/4 images</p>

                {beforeImages.map((img, idx) => (
                  <div key={idx} className="mb-4 relative">
                    <img
                      src={img.url}
                      alt={`Before ${idx + 1}`}
                      className="w-full h-48 object-cover rounded-lg border border-slate-700"
                    />
                    <button
                      onClick={() => removeImage(idx, "before")}
                      className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
                    >
                      <FiX className="text-white" size={16} />
                    </button>
                  </div>
                ))}

                {beforeImages.length < 4 && (
                  <label className="block w-full px-4 py-3 border-2 border-dashed border-slate-700 rounded-lg text-center cursor-pointer hover:border-blue-500 transition">
                    <FiCamera className="mx-auto mb-2 text-slate-400" size={24} />
                    <p className="text-slate-300 text-sm">Upload before image</p>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handleImageCapture(e, "before")}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* After Images */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4">After Wash</h3>
                <p className="text-slate-400 text-sm mb-4">{afterImages.length}/4 images</p>

                {afterImages.map((img, idx) => (
                  <div key={idx} className="mb-4 relative">
                    <img
                      src={img.url}
                      alt={`After ${idx + 1}`}
                      className="w-full h-48 object-cover rounded-lg border border-slate-700"
                    />
                    <button
                      onClick={() => removeImage(idx, "after")}
                      className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
                    >
                      <FiX className="text-white" size={16} />
                    </button>
                  </div>
                ))}

                {afterImages.length < 4 && (
                  <label className="block w-full px-4 py-3 border-2 border-dashed border-slate-700 rounded-lg text-center cursor-pointer hover:border-blue-500 transition">
                    <FiCamera className="mx-auto mb-2 text-slate-400" size={24} />
                    <p className="text-slate-300 text-sm">Upload after image</p>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handleImageCapture(e, "after")}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-600/20 border border-red-600 rounded-lg flex items-start gap-3">
                <FiAlertCircle className="text-red-400 mt-1 shrink-0" size={20} />
                <p className="text-red-300">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setCurrentSession(null);
                  setCustomerDetails(null);
                  setBeforeImages([]);
                  setAfterImages([]);
                  setError("");
                }}
                className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-semibold transition flex items-center justify-center gap-2"
              >
                <FiX size={20} />
                Cancel Wash
              </button>

              <button
                onClick={completeWash}
                disabled={
                  loading ||
                  beforeImages.length === 0 ||
                  afterImages.length === 0
                }
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 rounded-lg text-white font-semibold transition flex items-center justify-center gap-2"
              >
                <FiCheck size={20} />
                {loading ? "Completing..." : "Mark as Washed"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
