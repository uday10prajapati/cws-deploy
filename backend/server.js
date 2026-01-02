// server.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import bookingRoutes from "./routes/bookingsRoutes.js";
import passRoutes from "./routes/passRoutes.js";
import myCarsRoutes from "./routes/myCarsRoutes.js";
import transactions from "./routes/transactionsRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import alternativePaymentRoutes from "./routes/alternativePaymentRoutes.js";
import myJobs from "./routes/myJobs.js";
import carLocationRoutes from "./routes/carLocation.js";
import ratingsRoutes from "./routes/ratingsRoutes.js";
import earningsRoutes from "./routes/earningsRoutes.js";
import notificationsRoutes from "./routes/notificationsRoutes.js";
import adminStatsRoutes from "./routes/adminStatsRoutes.js";
import accountStatusRoutes from "./routes/accountStatusRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import carWashRoutes from "./routes/carWash.js";
import qrcodeRoutes from "./routes/qrcodeRoutes.js";
import passExpirationRoutes from "./routes/passExpirationRoutes.js";
import loyaltyPointsRoutes from "./routes/loyaltyPointsRoutes.js";
import customerLoyaltyRoutes from "./routes/customerLoyaltyRoutes.js";
import washerDocumentsRoutes from "./routes/washerDocumentsRoutes.js";
import salesDocumentsRoutes from "./routes/salesDocumentsRoutes.js";
import washerLocationRoutes from "./routes/washerLocationRoutes.js";
import carAssignmentsRoutes from "./routes/carAssignmentsRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import carsRoutes from "./routes/carsRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/bookings", bookingRoutes);
app.use("/pass", passRoutes);
app.use("/cars", myCarsRoutes);
app.use("/api/car-locations", carLocationRoutes);
app.use("/transactions", transactions);
app.use("/payment", paymentRoutes);
app.use("/alt-payment", alternativePaymentRoutes);
app.use("/admin", adminRoutes);
app.use("/admin-stats", adminStatsRoutes);
app.use("/account-status", accountStatusRoutes);
app.use("/employee", myJobs);
app.use("/ratings", ratingsRoutes);
app.use("/earnings", earningsRoutes);
app.use("/notifications", notificationsRoutes);
app.use("/profile", profileRoutes);
app.use("/car-wash", carWashRoutes);
app.use("/qrcode", qrcodeRoutes);
app.use("/pass-expiration", passExpirationRoutes);
app.use("/loyalty", loyaltyPointsRoutes);
app.use("/customer-loyalty", customerLoyaltyRoutes);
app.use("/documents", washerDocumentsRoutes);
app.use("/documents", salesDocumentsRoutes);
app.use("/washers", washerLocationRoutes);
app.use("/admin", carAssignmentsRoutes);
app.use("/customer", customerRoutes);
app.use("/cars", carsRoutes);

app.get("/", (req, res) => {
  res.send("Backend is running...");
});

app.listen(process.env.PORT, () =>
  console.log(`✅ Server started on port ${process.env.PORT}`)
);
