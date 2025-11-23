-- Clear primary calendar tokens for tskyring@gmail.com
-- This will force the automatic OAuth flow on next page load

UPDATE "user"
SET
  google_calendar_connected = false,
  access_token = NULL,
  refresh_token = NULL,
  token_expiry = NULL
WHERE email = 'tskyring@gmail.com';

-- Verify the update
SELECT
  email,
  google_calendar_connected,
  access_token IS NOT NULL as has_access_token,
  refresh_token IS NOT NULL as has_refresh_token
FROM "user"
WHERE email = 'tskyring@gmail.com';
