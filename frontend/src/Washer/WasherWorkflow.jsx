import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  X,
  CheckCircle,
  AlertCircle,
  Image,
  Upload,
  Plus,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import NavbarNew from "../components/NavbarNew";

const WasherWorkflow = () => {
  const navigate = useNavigate();
  useRoleBasedRedirect("employee");

  const [currentStep, setCurrentStep] = useState("scan"); // scan, details, washing, complete
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [videoStream, setVideoStream] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [passStatus, setPassStatus] = useState(null);
  const [uploadedImages, setUploadedImages] = useState({
    before: [null, null, null, null],
    after: [null, null, null, null],
  });
  const [washingNotes, setWashingNotes] = useState("");
  const [carDetails, setCarDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const videoRef = useRef(null);
  const employeeId = localStorage.getItem("userId");

  // Open Camera
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setVideoStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Unable to access camera. Please check permissions.");
    }
  };

  // Close Camera
  const closeCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
      setVideoStream(null);
    }
    setShowQRScanner(false);
  };

  // Handle QR Scan (mock for now - in production use jsqr or html5-qrcode)
  const handleScanQR = async () => {
    setLoading(true);
    try {
      // For now, we'll use a mock QR value. In production, integrate a QR scanning library
      const qrValue = "CUST_123_CAR_ABC1234"; // Mock QR code
      
      // Parse QR code (format: CUST_ID_CAR_NUMBER)
      const [, customerId, , carNumber] = qrValue.split("_");

      // Fetch customer details and pass status
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", customerId)
        .single();

      // Fetch monthly pass status
      const { data: passData } = await supabase
        .from("monthly_pass")
        .select("*")
        .eq("customer_id", customerId)
        .eq("status", "active")
        .single();

      // Check loyalty points
      const { data: loyaltyData } = await supabase
        .from("customer_loyalty_points")
        .select("*")
        .eq("customer_id", customerId)
        .single();

      setCustomerData({
        id: customerId,
        name: profileData?.name || "Unknown",
        email: profileData?.email || "N/A",
        phone: profileData?.phone || "N/A",
        carNumber,
      });

      setPassStatus({
        isActive: !!passData,
        expiryDate: passData?.expiry_date || null,
        loyaltyPoints: loyaltyData?.total_points || 0,
        carsWashed: loyaltyData?.cars_washed || 0,
      });

      setCarDetails({ carNumber });
      closeCamera();
      setCurrentStep("details");
    } catch (err) {
      console.error("Error scanning QR:", err);
      alert("Error scanning QR. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Image Upload
  const handleImageUpload = (e, type, index) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImages((prev) => {
          const newImages = { ...prev };
          newImages[type][index] = event.target?.result;
          return newImages;
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove uploaded image
  const removeImage = (type, index) => {
    setUploadedImages((prev) => {
      const newImages = { ...prev };
      newImages[type][index] = null;
      return newImages;
    });
  };

  // Submit wash completion
  const submitWashCompletion = async () => {
    if (!uploadedImages.before.some((img) => img) || !uploadedImages.after.some((img) => img)) {
      alert("Please upload at least one before and after image");
      return;
    }

    setLoading(true);
    try {
      // Store images to Supabase storage and get URLs (in production)
      // For now, we'll store base64 directly (not recommended for production)

      const { data: washData, error: washError } = await supabase
        .from("car_wash_tracking")
        .insert([
          {
            employee_id: employeeId,
            car_owner_name: customerData.name,
            car_number: carDetails.carNumber,
            status: "washed",
            wash_date: new Date().toISOString().split("T")[0],
            before_img_1: uploadedImages.before[0],
            before_img_2: uploadedImages.before[1],
            before_img_3: uploadedImages.before[2],
            before_img_4: uploadedImages.before[3],
            after_img_1: uploadedImages.after[0],
            after_img_2: uploadedImages.after[1],
            after_img_3: uploadedImages.after[2],
            after_img_4: uploadedImages.after[3],
          },
        ])
        .select()
        .single();

      if (washError) throw washError;

      // Update loyalty points
      const { data: loyaltyData } = await supabase
        .from("customer_loyalty_points")
        .select("*")
        .eq("customer_id", customerData.id)
        .single();

      if (loyaltyData) {
        await supabase
          .from("customer_loyalty_points")
          .update({
            total_points: (loyaltyData.total_points || 0) + 10,
            cars_washed: (loyaltyData.cars_washed || 0) + 1,
            last_wash_date: new Date().toISOString().split("T")[0],
            updated_at: new Date().toISOString(),
          })
          .eq("customer_id", customerData.id);
      }

      setSuccessMessage("Car wash completed successfully! Loyalty points awarded.");
      setCurrentStep("complete");

      // Reset after 3 seconds
      setTimeout(() => {
        resetWorkflow();
      }, 3000);
    } catch (err) {
      console.error("Error submitting wash:", err);
      alert("Error saving wash data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Reset workflow
  const resetWorkflow = () => {
    setCurrentStep("scan");
    setCustomerData(null);
    setPassStatus(null);
    setUploadedImages({ before: [null, null, null, null], after: [null, null, null, null] });
    setWashingNotes("");
    setCarDetails(null);
    setSuccessMessage("");
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <NavbarNew />

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Washer Workflow</h1>
          <p className="text-slate-500 text-sm mt-2">Complete car wash jobs with QR scanning and image uploads</p>
        </div>

        {/* Steps Indicator */}
        <div className="flex justify-between mb-8">
          {["scan", "details", "washing", "complete"].map((step, idx) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                  currentStep === step
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white scale-110"
                    : ["scan", "details", "washing"].includes(currentStep) &&
                      ["scan", "details", "washing"].indexOf(step) <= ["scan", "details", "washing"].indexOf(currentStep)
                    ? "bg-green-500 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {idx + 1}
              </div>
              {idx < 3 && (
                <div
                  className={`h-1 flex-1 mx-2 rounded transition-all ${
                    ["scan", "details", "washing"].indexOf(step) < ["scan", "details", "washing"].indexOf(currentStep)
                      ? "bg-green-500"
                      : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Labels */}
        <div className="flex justify-between mb-8 text-sm font-medium">
          <span className="text-slate-600">Scan QR</span>
          <span className="text-slate-600">Customer Details</span>
          <span className="text-slate-600">Add Images</span>
          <span className="text-slate-600">Complete</span>
        </div>

        {/* STEP 1: SCAN QR */}
        {currentStep === "scan" && (
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Scan Card */}
            <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-lg p-8 shadow-sm">
              <div className="text-center">
                <Camera size={64} className="mx-auto text-blue-600 mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Scan Customer QR</h2>
                <p className="text-slate-600 mb-6">Point your camera at the customer's QR code</p>
                <button
                  onClick={() => {
                    setShowQRScanner(true);
                    setTimeout(openCamera, 100);
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-3 rounded-lg transition-all shadow-md"
                >
                  <Camera size={20} className="inline mr-2" />
                  Open Camera
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-lg p-8 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-4">How to Scan</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Get Customer QR Code</p>
                    <p className="text-sm text-slate-600">Ask customer for their QR code</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Click Open Camera</p>
                    <p className="text-sm text-slate-600">Allow camera access when prompted</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Point & Scan</p>
                    <p className="text-sm text-slate-600">Focus camera on the QR code</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CUSTOMER DETAILS */}
        {currentStep === "details" && customerData && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Customer Info */}
            <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Customer Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-600">Name</p>
                  <p className="text-slate-900 font-semibold">{customerData.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Email</p>
                  <p className="text-slate-900 font-semibold">{customerData.email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Phone</p>
                  <p className="text-slate-900 font-semibold">{customerData.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Car Number</p>
                  <p className="text-slate-900 font-bold text-lg">{carDetails?.carNumber}</p>
                </div>
              </div>
            </div>

            {/* Pass Status */}
            <div className={`bg-gradient-to-br ${passStatus?.isActive ? "from-green-50 to-white border-2 border-green-200" : "from-red-50 to-white border-2 border-red-200"} rounded-lg p-6 shadow-sm`}>
              <h3 className="text-lg font-bold text-slate-900 mb-4">Pass Status</h3>
              <div className="flex items-center gap-3 mb-4">
                {passStatus?.isActive ? (
                  <>
                    <CheckCircle size={32} className="text-green-600" />
                    <div>
                      <p className="text-sm text-slate-600">Status</p>
                      <p className="text-lg font-bold text-green-600">Active</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle size={32} className="text-red-600" />
                    <div>
                      <p className="text-sm text-slate-600">Status</p>
                      <p className="text-lg font-bold text-red-600">Inactive</p>
                    </div>
                  </>
                )}
              </div>
              {passStatus?.expiryDate && (
                <div>
                  <p className="text-sm text-slate-600">Expires</p>
                  <p className="text-slate-900 font-semibold">{new Date(passStatus.expiryDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            {/* Loyalty Info */}
            <div className="bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Loyalty Points</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-600">Total Points</p>
                  <p className="text-3xl font-bold text-purple-600">{passStatus?.loyaltyPoints}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Cars Washed</p>
                  <p className="text-2xl font-bold text-slate-900">{passStatus?.carsWashed}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {passStatus?.isActive && currentStep === "details" && (
          <button
            onClick={() => setCurrentStep("washing")}
            className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold py-3 rounded-lg transition-all shadow-md mb-8"
          >
            Proceed to Upload Images
          </button>
        )}

        {!passStatus?.isActive && currentStep === "details" && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3">
              <AlertCircle size={24} className="text-red-600" />
              <div>
                <p className="font-bold text-red-900">Pass Inactive</p>
                <p className="text-red-800">This customer does not have an active pass. Please verify with the customer.</p>
              </div>
            </div>
            <button
              onClick={resetWorkflow}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-all"
            >
              Scan Another QR
            </button>
          </div>
        )}

        {/* STEP 3: UPLOAD IMAGES */}
        {currentStep === "washing" && customerData && (
          <div className="space-y-8 mb-8">
            {/* Before Images */}
            <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Before Wash Images (4 Photos)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[0, 1, 2, 3].map((idx) => (
                  <div key={`before-${idx}`} className="relative">
                    {uploadedImages.before[idx] ? (
                      <>
                        <img
                          src={uploadedImages.before[idx]}
                          alt={`Before ${idx + 1}`}
                          className="w-full h-40 object-cover rounded-lg border-2 border-blue-300"
                        />
                        <button
                          onClick={() => removeImage("before", idx)}
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full transition-all"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <label className="w-full h-40 border-2 border-dashed border-blue-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-blue-100 transition-colors">
                        <Image size={32} className="text-blue-400 mb-2" />
                        <span className="text-sm text-slate-600">Photo {idx + 1}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, "before", idx)}
                          className="hidden"
                          capture="environment"
                        />
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* After Images */}
            <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">After Wash Images (4 Photos)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[0, 1, 2, 3].map((idx) => (
                  <div key={`after-${idx}`} className="relative">
                    {uploadedImages.after[idx] ? (
                      <>
                        <img
                          src={uploadedImages.after[idx]}
                          alt={`After ${idx + 1}`}
                          className="w-full h-40 object-cover rounded-lg border-2 border-green-300"
                        />
                        <button
                          onClick={() => removeImage("after", idx)}
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full transition-all"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <label className="w-full h-40 border-2 border-dashed border-green-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-green-100 transition-colors">
                        <Image size={32} className="text-green-400 mb-2" />
                        <span className="text-sm text-slate-600">Photo {idx + 1}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, "after", idx)}
                          className="hidden"
                          capture="environment"
                        />
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-gradient-to-br from-yellow-50 to-white border-2 border-yellow-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Additional Notes</h3>
              <textarea
                value={washingNotes}
                onChange={(e) => setWashingNotes(e.target.value)}
                placeholder="Add any notes about the wash (optional)"
                className="w-full border-2 border-yellow-300 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-yellow-600 outline-none resize-none"
                rows="4"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep("details")}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold py-3 rounded-lg transition-all"
              >
                Back
              </button>
              <button
                onClick={submitWashCompletion}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-all shadow-md"
              >
                {loading ? "Saving..." : "Complete Wash"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: COMPLETE */}
        {currentStep === "complete" && (
          <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-200 rounded-lg p-12 shadow-sm text-center">
            <CheckCircle size={80} className="mx-auto text-green-600 mb-6" />
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Wash Completed!</h2>
            <p className="text-xl text-slate-600 mb-2">{successMessage}</p>
            <p className="text-slate-600 mb-6">Customer {customerData?.name} - Car {carDetails?.carNumber}</p>
            <p className="text-2xl font-bold text-purple-600 mb-8">+10 Loyalty Points Awarded</p>
            <button
              onClick={resetWorkflow}
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-3 px-8 rounded-lg transition-all shadow-md inline-block"
            >
              Scan Next Car
            </button>
          </div>
        )}
      </main>

      {/* QR SCANNER MODAL */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-blue-200">
              <h2 className="text-2xl font-bold text-slate-900">Scan QR Code</h2>
              <button
                onClick={closeCamera}
                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
              >
                <X size={24} className="text-red-600" />
              </button>
            </div>

            <div className="p-6">
              {videoStream ? (
                <div className="space-y-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-lg border-2 border-blue-300"
                    style={{ aspectRatio: "4/5" }}
                  />
                  <p className="text-center text-sm text-slate-600">
                    Point your camera at the QR code
                  </p>
                  <button
                    onClick={handleScanQR}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-all"
                  >
                    {loading ? "Processing..." : "Scan Now"}
                  </button>
                  <button
                    onClick={closeCamera}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition-colors"
                  >
                    Close Camera
                  </button>
                </div>
              ) : (
                <div className="space-y-4 text-center">
                  <div className="py-8">
                    <Camera size={48} className="mx-auto text-blue-600 mb-4" />
                    <p className="text-slate-600">Opening camera...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WasherWorkflow;
