const supabase = require("../config/supabaseClient");

exports.createBooking = async (req, res) => {
  const { user_id } = req.user;
  const { location, service_date } = req.body;

  const { data, error } = await supabase
    .from("bookings")
    .insert([{ user_id, location, service_date, status: "pending" }]);

  if (error) return res.status(400).json({ error });

  res.json({ message: "Booking created", booking: data });
};

exports.getMyBookings = async (req, res) => {
  const { user_id } = req.user;

  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("user_id", user_id);

  res.json({ bookings: data });
};
