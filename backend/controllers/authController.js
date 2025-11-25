const supabase = require("../config/supabaseClient");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.signupCustomer = async (req, res) => {
  const { name, phone, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from("users")
    .insert([{ name, phone, password: hashed, role: "customer" }]);

  if (error) return res.status(400).json({ error });

  res.json({ message: "Signup successful", user: data });
};

exports.login = async (req, res) => {
  const { phone, password } = req.body;

  let { data: users } = await supabase
    .from("users")
    .select("*")
    .eq("phone", phone)
    .single();

  if (!users) return res.status(401).json({ error: "User not found" });

  const match = await bcrypt.compare(password, users.password);
  if (!match) return res.status(401).json({ error: "Invalid password" });

  const token = jwt.sign(
    { id: users.id, role: users.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token, user: users });
};
