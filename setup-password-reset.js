import dotenv from "dotenv";
dotenv.config({ path: "./backend/.env" });

const { createClient } = await import("@supabase/supabase-js");

console.log("🔧 Setting up password reset OTP table...");

const schema = `
CREATE TABLE IF NOT EXISTS password_reset_otp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_password_reset_email ON password_reset_otp(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_created_at ON password_reset_otp(created_at);

ALTER TABLE password_reset_otp ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert OTP" ON password_reset_otp;
DROP POLICY IF EXISTS "Anyone can view OTP" ON password_reset_otp;
DROP POLICY IF EXISTS "Anyone can update OTP" ON password_reset_otp;

CREATE POLICY "Anyone can insert OTP" ON password_reset_otp
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view OTP" ON password_reset_otp
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update OTP" ON password_reset_otp
  FOR UPDATE
  USING (true);
`;

const setupDatabase = async () => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  try {
    // Execute the SQL schema
    const { error } = await supabase.rpc("execute_sql", {
      sql: schema,
    });

    if (error) {
      console.error("❌ Error executing SQL:", error);
      
      // Try alternative approach - use direct SQL execution
      console.log("📝 Trying alternative setup approach...");
      
      // Just try to insert a test record to see if table exists
      const { error: insertError } = await supabase
        .from("password_reset_otp")
        .insert([{
          email: "test@test.com",
          otp: "000000",
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
        }]);

      if (insertError && insertError.code === "42P01") {
        console.log("❌ Table doesn't exist. Please run this SQL in Supabase dashboard:");
        console.log(schema);
      } else if (insertError) {
        console.error("❌ Insert error:", insertError);
      } else {
        console.log("✅ Test insert successful - table exists!");
        // Delete the test record
        await supabase
          .from("password_reset_otp")
          .delete()
          .eq("email", "test@test.com");
      }
      return;
    }

    console.log("✅ Database setup completed successfully!");
  } catch (err) {
    console.error("❌ Setup error:", err);
  }
};

setupDatabase();
