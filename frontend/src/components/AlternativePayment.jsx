import React, { useState, useEffect } from "react";
import { FiCreditCard, FiSmartphone, FiTrendingUp, FiCheck, FiAlertCircle } from "react-icons/fi";
import { supabase } from "../supabaseClient";

export default function AlternativePayment() {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [amount, setAmount] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [transactionId, setTransactionId] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [verificationData, setVerificationData] = useState({});
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState(null);

  // Fetch payment methods on load
  useEffect(() => {
    fetchPaymentMethods();
    loadUserData();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch("http://localhost:5000/alt-payment/methods");
      const data = await response.json();
      if (data.success) {
        setPaymentMethods(Object.entries(data.payment_methods).map(([key, value]) => ({ ...value, id: key })));
      }
    } catch (err) {
      console.error("Error fetching payment methods:", err);
    }
  };

  const loadUserData = async () => {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.user) {
      const user = data.session.user;
      setCustomerEmail(user.email || "");
      setCustomerName(user.user_metadata?.full_name || "");
    }
  };

  const handleInitiatePayment = async () => {
    if (!amount || !selectedMethod || !customerPhone) {
      setError("Please fill all required fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:5000/alt-payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          customer_id: "user-123", // Replace with actual user ID
          customer_email: customerEmail,
          customer_name: customerName,
          customer_phone: customerPhone,
          type: "booking_payment",
          payment_method: selectedMethod,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPaymentInitiated(true);
        setTransactionId(data.transaction_id);
        setPaymentDetails(data.paymentDetails);
      } else {
        setError(data.error || "Failed to initiate payment");
      }
    } catch (err) {
      setError("Error initiating payment: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!transactionId) {
      setError("Transaction ID missing");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let verifyEndpoint = "";
      let verifyBody = {};

      switch (selectedMethod) {
        case "upi":
          verifyEndpoint = "/alt-payment/verify-upi";
          verifyBody = {
            transaction_id: transactionId,
            upi_ref_id: verificationData.upi_ref_id,
            payment_timestamp: new Date().toISOString(),
          };
          break;

        case "bank_transfer":
          verifyEndpoint = "/alt-payment/verify-bank-transfer";
          verifyBody = {
            transaction_id: transactionId,
            reference_number: verificationData.reference_number,
            transfer_date: verificationData.transfer_date,
          };
          break;

        case "net_banking":
          verifyEndpoint = "/alt-payment/verify-net-banking";
          verifyBody = {
            transaction_id: transactionId,
            bank_name: verificationData.bank_name,
            confirmation_number: verificationData.confirmation_number,
            payment_timestamp: new Date().toISOString(),
          };
          break;

        case "card":
          verifyEndpoint = "/alt-payment/verify-card";
          verifyBody = {
            transaction_id: transactionId,
            card_last4: verificationData.card_last4,
            card_network: verificationData.card_network,
            authorization_code: verificationData.authorization_code,
          };
          break;

        default:
          setError("Invalid payment method");
          return;
      }

      const response = await fetch(`http://localhost:5000${verifyEndpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(verifyBody),
      });

      const data = await response.json();

      if (data.success) {
        setVerified(true);
        setError(null);
      } else {
        setError(data.error || "Verification failed");
      }
    } catch (err) {
      setError("Error verifying payment: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderPaymentForm = () => {
    switch (selectedMethod) {
      case "upi":
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900">📱 UPI Payment</p>
              <p className="text-xs text-blue-700 mt-2">UPI ID: {paymentDetails?.upi_id}</p>
              <p className="text-xs text-blue-700 mt-1">Amount: ₹{amount}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                UPI Reference Number (UTR) *
              </label>
              <input
                type="text"
                placeholder="Enter UTR from your UPI transaction"
                value={verificationData.upi_ref_id || ""}
                onChange={(e) =>
                  setVerificationData({ ...verificationData, upi_ref_id: e.target.value })
                }
                className="w-full bg-slate-100 border border-slate-300 rounded-lg px-4 py-2 text-slate-800"
              />
            </div>
          </div>
        );

      case "bank_transfer":
        return (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
              <p className="font-medium text-amber-900">🏦 Bank Transfer Details</p>
              <div className="mt-3 space-y-2 text-amber-800">
                <p>Account Holder: {paymentDetails?.account_holder}</p>
                <p>Account: {paymentDetails?.account_number}</p>
                <p>IFSC: {paymentDetails?.ifsc_code}</p>
                <p className="font-semibold mt-3">Amount: ₹{amount}</p>
                <p className="text-xs">Reference: {paymentDetails?.reference_number}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Reference Number (Cheque/Receipt) *
              </label>
              <input
                type="text"
                placeholder="Enter reference number from your bank"
                value={verificationData.reference_number || ""}
                onChange={(e) =>
                  setVerificationData({ ...verificationData, reference_number: e.target.value })
                }
                className="w-full bg-slate-100 border border-slate-300 rounded-lg px-4 py-2 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Transfer Date *
              </label>
              <input
                type="date"
                value={verificationData.transfer_date || ""}
                onChange={(e) =>
                  setVerificationData({ ...verificationData, transfer_date: e.target.value })
                }
                className="w-full bg-slate-100 border border-slate-300 rounded-lg px-4 py-2 text-slate-800"
              />
            </div>
          </div>
        );

      case "net_banking":
        return (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-medium text-green-900">💻 Net Banking</p>
              <p className="text-xs text-green-700 mt-2">
                Select your bank and complete the payment online
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Bank Name *
              </label>
              <select
                value={verificationData.bank_name || ""}
                onChange={(e) =>
                  setVerificationData({ ...verificationData, bank_name: e.target.value })
                }
                className="w-full bg-slate-100 border border-slate-300 rounded-lg px-4 py-2 text-slate-800"
              >
                <option value="">Select a bank</option>
                {paymentDetails?.supported_banks?.map((bank) => (
                  <option key={bank.code} value={bank.name}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Confirmation Number *
              </label>
              <input
                type="text"
                placeholder="Enter confirmation from your bank"
                value={verificationData.confirmation_number || ""}
                onChange={(e) =>
                  setVerificationData({ ...verificationData, confirmation_number: e.target.value })
                }
                className="w-full bg-slate-100 border border-slate-300 rounded-lg px-4 py-2 text-slate-800"
              />
            </div>
          </div>
        );

      case "card":
        return (
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm font-medium text-purple-900">💳 Card Payment</p>
              <p className="text-xs text-purple-700 mt-2">Processing fee: 2% + ₹5</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Card Last 4 Digits *
              </label>
              <input
                type="text"
                placeholder="e.g., 1234"
                maxLength="4"
                value={verificationData.card_last4 || ""}
                onChange={(e) =>
                  setVerificationData({ ...verificationData, card_last4: e.target.value })
                }
                className="w-full bg-slate-100 border border-slate-300 rounded-lg px-4 py-2 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Card Network *
              </label>
              <select
                value={verificationData.card_network || ""}
                onChange={(e) =>
                  setVerificationData({ ...verificationData, card_network: e.target.value })
                }
                className="w-full bg-slate-100 border border-slate-300 rounded-lg px-4 py-2 text-slate-800"
              >
                <option value="">Select network</option>
                <option value="Visa">Visa</option>
                <option value="Mastercard">Mastercard</option>
                <option value="Amex">American Express</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Authorization Code *
              </label>
              <input
                type="text"
                placeholder="From your bank SMS/email"
                value={verificationData.authorization_code || ""}
                onChange={(e) =>
                  setVerificationData({ ...verificationData, authorization_code: e.target.value })
                }
                className="w-full bg-slate-100 border border-slate-300 rounded-lg px-4 py-2 text-slate-800"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (verified) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-green-600/20 border border-green-500/50 rounded-lg p-8 text-center">
            <FiCheck className="text-6xl text-green-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">Payment Successful! ✅</h2>
            <p className="text-green-300 mb-4">
              Your payment of ₹{amount} has been verified and processed.
            </p>
            <p className="text-sm text-slate-400">
              Transaction ID: {transactionId}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-8 rounded-lg transition"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">💳 Payment Methods</h1>

        {error && (
          <div className="bg-red-600/20 border border-red-500/50 rounded-lg p-4 text-red-300 mb-6 flex items-center gap-2">
            <FiAlertCircle /> {error}
          </div>
        )}

        {!paymentInitiated ? (
          <>
            {/* Payment Method Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`p-6 rounded-lg border-2 transition text-left ${
                    selectedMethod === method.id
                      ? "bg-blue-600/20 border-blue-500/50"
                      : "bg-slate-900/80 border-slate-700/50 hover:border-blue-500/30"
                  }`}
                >
                  <div className="text-3xl mb-2">{method.icon}</div>
                  <h3 className="font-bold text-white">{method.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{method.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {method.pros.map((pro, i) => (
                      <span key={i} className="text-xs bg-green-600/30 text-green-300 px-2 py-1 rounded">
                        {pro}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Fee: {method.fees}</p>
                </button>
              ))}
            </div>

            {/* Payment Details Form */}
            {selectedMethod && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-6 mb-6">
                <h2 className="text-lg font-bold text-white mb-4">Payment Details</h2>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">
                      Amount (₹) *
                    </label>
                    <input
                      type="number"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="Your name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      placeholder="10-digit mobile number"
                      maxLength="10"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="Your email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                      disabled
                    />
                  </div>
                </div>

                <button
                  onClick={handleInitiatePayment}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white font-semibold py-3 rounded-lg transition"
                >
                  {loading ? "Processing..." : "Initiate Payment"}
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Payment Verification */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-bold text-white mb-4">Verify Payment</h2>
              <p className="text-slate-400 mb-6">
                Transaction ID: <span className="text-blue-400 font-mono">{transactionId}</span>
              </p>

              {renderPaymentForm()}

              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleVerifyPayment}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 text-white font-semibold py-2 rounded-lg transition"
                >
                  {loading ? "Verifying..." : "Verify Payment"}
                </button>
                <button
                  onClick={() => {
                    setPaymentInitiated(false);
                    setSelectedMethod(null);
                    setVerificationData({});
                  }}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 rounded-lg transition"
                >
                  Back
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
