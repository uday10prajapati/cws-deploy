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

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/bookings", bookingRoutes);
app.use("/pass", passRoutes);
app.use("/cars", myCarsRoutes);
app.use("/transactions", transactions);
app.use("/payment", paymentRoutes);
app.use("/alt-payment", alternativePaymentRoutes);
app.use("/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("Backend is running...");
});

app.listen(process.env.PORT, () =>
  console.log(`✅ Server started on port ${process.env.PORT}`)
);
