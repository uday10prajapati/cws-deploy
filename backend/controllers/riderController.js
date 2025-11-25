const supabase = require("../config/supabaseClient");

exports.updateLocation = async (req, res) => {
  const { user_id } = req.user;
  const { lat, lng } = req.body;

  const { data, error } = await supabase
    .from("rider_location")
    .upsert({ rider_id: user_id, lat, lng, updated_at: new Date() });

  res.json({ message: "Location updated" });
};

exports.getAssignedJobs = async (req, res) => {
  const { user_id } = req.user;

  const { data } = await supabase
    .from("bookings")
    .select("*")
    .eq("rider_id", user_id);

  res.json({ jobs: data });
};
