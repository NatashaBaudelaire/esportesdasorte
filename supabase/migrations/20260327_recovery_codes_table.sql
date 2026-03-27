-- Create recovery_codes table for SMS-based recovery
CREATE TABLE IF NOT EXISTS recovery_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create index for fast lookup by phone and code
CREATE INDEX idx_recovery_codes_phone_code ON recovery_codes(phone, code) WHERE used = FALSE;

-- Create index for cleanup of expired codes
CREATE INDEX idx_recovery_codes_expires_at ON recovery_codes(expires_at);

-- Enable RLS
ALTER TABLE recovery_codes ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert recovery codes (controlled by edge function)
CREATE POLICY "recovery_codes_insert_anon" ON recovery_codes
  FOR INSERT 
  WITH CHECK (true);

-- Allow users to view their own recovery codes
CREATE POLICY "recovery_codes_select_own" ON recovery_codes
  FOR SELECT
  USING (false); -- Only accessible via edge function

-- Create a function to clean up expired recovery codes
CREATE OR REPLACE FUNCTION cleanup_expired_recovery_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM recovery_codes 
  WHERE expires_at < now() OR (used = TRUE AND used_at < now() - INTERVAL '1 day');
END;
$$ LANGUAGE plpgsql;
