// server.js
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import bookingRoutes from "./routes/bookingsRoutes.js";
import dotenv from "dotenv";
import passRoutes from "./routes/passRoutes.js";
import myCarsRoutes from "./routes/myCarsRoutes.js";
import transactions from "./routes/transactionsRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// auth routes
app.use("/auth", authRoutes);
app.use("/bookings", bookingRoutes);
app.use("/pass", passRoutes);
app.use("/cars", myCarsRoutes);
app.use("/transactions", transactions);

app.get("/", (req, res) => {
  res.send("Backend is running...");
});

app.listen(process.env.PORT, () =>
  console.log(`✅ Server started on port ${process.env.PORT}`)
);
