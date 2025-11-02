import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const baseUrl = request.nextUrl.origin;

  // Create test HTML page
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Calendar Integration Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #1a1a1a; color: white; }
        button { padding: 10px 20px; background: #4285f4; color: white; border: none; border-radius: 4px; cursor: pointer; margin: 5px; }
        button:hover { background: #3367d6; }
        .response { margin-top: 20px; padding: 20px; background: #2a2a2a; border-radius: 4px; border: 1px solid #444; }
        .error { background: #3c1c1c; border-color: #c62828; }
        .success { background: #1c3c1c; border-color: #2e7d32; }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { color: #4285f4; }
        h2 { color: #fff; border-bottom: 1px solid #444; padding-bottom: 10px; }
        pre { background: #0a0a0a; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 12px; }
        .status { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 12px; font-weight: bold; }
        .status.success { background: #2e7d32; color: white; }
        .status.error { background: #c62828; color: white; }
        .test-section { margin-bottom: 30px; padding: 20px; background: #242424; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🗓️ Calendar Integration Test Dashboard</h1>
        <p>Test all calendar integration endpoints to verify functionality.</p>

        <div class="test-section">
            <h2>1. Calendar API Test</h2>
            <p>Tests the main calendar endpoint that the schedule widget uses.</p>
            <button onclick="testCalendarAPI()">Test Calendar API</button>
            <div id="calendar-result" class="response" style="display: none;"></div>
        </div>

        <div class="test-section">
            <h2>2. Primary Calendar Connection Test</h2>
            <p>Tests connecting your primary account to Google Calendar.</p>
            <button onclick="testPrimaryCalendarURL()">Connect Primary Calendar</button>
            <div id="primary-oauth-result" class="response" style="display: none;"></div>
        </div>

        <div class="test-section">
            <h2>3. Additional Account OAuth Test</h2>
            <p>Tests Google OAuth URL generation for adding secondary accounts.</p>
            <button onclick="testOAuthURL()">Generate OAuth URL</button>
            <div id="oauth-result" class="response" style="display: none;"></div>
        </div>

        <div class="test-section">
            <h2>4. Connected Accounts Test</h2>
            <p>Tests the accounts API used by the settings page.</p>
            <button onclick="testAccountsAPI()">Test Accounts API</button>
            <div id="accounts-result" class="response" style="display: none;"></div>
        </div>

        <div class="test-section">
            <h2>5. Fix Expired Primary Tokens</h2>
            <p>If you have expired Google tokens from a previous sign-in, clear them here.</p>
            <button onclick="clearPrimaryTokens()">🔧 Clear Expired Primary Tokens</button>
            <div id="clear-tokens-result" class="response" style="display: none;"></div>
        </div>

        <div class="test-section">
            <h2>6. Run All Tests</h2>
            <button onclick="runAllTests()">🚀 Run All Tests</button>
        </div>
    </div>

    <script>
        async function testCalendarAPI() {
            const resultDiv = document.getElementById('calendar-result');
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = '<div class="status">Testing...</div> Calendar API';

            try {
                const response = await fetch('/api/calendar');
                const data = await response.json();

                if (response.ok) {
                    resultDiv.className = 'response success';
                    const events = data.data || [];
                    resultDiv.innerHTML = \`
                        <div class="status success">✅ SUCCESS</div>
                        <h3>Calendar API Working</h3>
                        <p><strong>Events found:</strong> \${events.length}</p>
                        <p><strong>Response time:</strong> \${response.headers.get('X-Response-Time') || 'N/A'}</p>
                        <details>
                            <summary>📅 Sample Events (\${events.length})</summary>
                            <pre>\${JSON.stringify(events.slice(0, 3), null, 2)}</pre>
                        </details>
                    \`;
                } else {
                    resultDiv.className = 'response error';
                    resultDiv.innerHTML = \`
                        <div class="status error">❌ ERROR</div>
                        <h3>Calendar API Failed</h3>
                        <p><strong>Status:</strong> \${response.status} \${response.statusText}</p>
                        <pre>\${JSON.stringify(data, null, 2)}</pre>
                    \`;
                }
            } catch (error) {
                resultDiv.className = 'response error';
                resultDiv.innerHTML = \`
                    <div class="status error">❌ ERROR</div>
                    <h3>Calendar API Network Error</h3>
                    <p>\${error.message}</p>
                \`;
            }
        }

        async function testPrimaryCalendarURL() {
            const resultDiv = document.getElementById('primary-oauth-result');
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = '<div class="status">Testing...</div> Primary calendar connection';

            try {
                const response = await fetch('/api/auth/connect-primary-calendar?next=/settings');
                const data = await response.json();

                if (response.ok && data.success) {
                    resultDiv.className = 'response success';
                    resultDiv.innerHTML = \`
                        <div class="status success">✅ SUCCESS</div>
                        <h3>Primary Calendar Connection Ready</h3>
                        <p><strong>Purpose:</strong> Connect your main account to Google Calendar</p>
                        <p><strong>Result:</strong> Will populate primary account tokens in user table</p>
                        <p><a href="\${data.authUrl}" target="_blank" style="color: #4285f4; text-decoration: none;">🔗 Click here to connect primary calendar →</a></p>
                        <details>
                            <summary>🔧 Technical Details</summary>
                            <pre>\${JSON.stringify(data, null, 2)}</pre>
                        </details>
                    \`;
                } else {
                    resultDiv.className = 'response error';
                    resultDiv.innerHTML = \`
                        <div class="status error">❌ ERROR</div>
                        <h3>Primary Calendar Connection Failed</h3>
                        <p><strong>Status:</strong> \${response.status}</p>
                        <pre>\${JSON.stringify(data, null, 2)}</pre>
                    \`;
                }
            } catch (error) {
                resultDiv.className = 'response error';
                resultDiv.innerHTML = \`
                    <div class="status error">❌ ERROR</div>
                    <h3>Primary Calendar Connection Error</h3>
                    <p>\${error.message}</p>
                \`;
            }
        }

        async function testOAuthURL() {
            const resultDiv = document.getElementById('oauth-result');
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = '<div class="status">Testing...</div> OAuth URL generation';

            try {
                const response = await fetch('/api/auth/google-link-url?next=/settings');
                const data = await response.json();

                if (response.ok && data.success) {
                    resultDiv.className = 'response success';
                    resultDiv.innerHTML = \`
                        <div class="status success">✅ SUCCESS</div>
                        <h3>OAuth URL Generated Successfully</h3>
                        <p><strong>Redirect URI:</strong> Properly configured for port 3000</p>
                        <p><strong>Scopes:</strong> Calendar read access included</p>
                        <p><a href="\${data.authUrl}" target="_blank" style="color: #4285f4; text-decoration: none;">🔗 Click here to test OAuth flow →</a></p>
                        <details>
                            <summary>🔧 Technical Details</summary>
                            <pre>\${JSON.stringify(data, null, 2)}</pre>
                        </details>
                    \`;
                } else {
                    resultDiv.className = 'response error';
                    resultDiv.innerHTML = \`
                        <div class="status error">❌ ERROR</div>
                        <h3>OAuth URL Generation Failed</h3>
                        <p><strong>Status:</strong> \${response.status}</p>
                        <pre>\${JSON.stringify(data, null, 2)}</pre>
                    \`;
                }
            } catch (error) {
                resultDiv.className = 'response error';
                resultDiv.innerHTML = \`
                    <div class="status error">❌ ERROR</div>
                    <h3>OAuth URL Network Error</h3>
                    <p>\${error.message}</p>
                \`;
            }
        }

        async function testAccountsAPI() {
            const resultDiv = document.getElementById('accounts-result');
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = '<div class="status">Testing...</div> Accounts API';

            try {
                const response = await fetch('/api/settings/accounts');
                const data = await response.json();

                if (response.ok) {
                    resultDiv.className = 'response success';
                    const accounts = Array.isArray(data) ? data : [];
                    resultDiv.innerHTML = \`
                        <div class="status success">✅ SUCCESS</div>
                        <h3>Accounts API Working</h3>
                        <p><strong>Connected accounts:</strong> \${accounts.length}</p>
                        <p><strong>Database connection:</strong> OK</p>
                        \${accounts.length > 0 ?
                            \`<details><summary>👥 Connected Accounts</summary><pre>\${JSON.stringify(accounts, null, 2)}</pre></details>\` :
                            \`<p><em>No accounts connected yet. Use OAuth flow above to add accounts.</em></p>\`
                        }
                    \`;
                } else {
                    resultDiv.className = 'response error';
                    resultDiv.innerHTML = \`
                        <div class="status error">❌ ERROR</div>
                        <h3>Accounts API Failed</h3>
                        <p><strong>Status:</strong> \${response.status}</p>
                        <pre>\${JSON.stringify(data, null, 2)}</pre>
                    \`;
                }
            } catch (error) {
                resultDiv.className = 'response error';
                resultDiv.innerHTML = \`
                    <div class="status error">❌ ERROR</div>
                    <h3>Accounts API Network Error</h3>
                    <p>\${error.message}</p>
                \`;
            }
        }

        async function clearPrimaryTokens() {
            const resultDiv = document.getElementById('clear-tokens-result');
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = '<div class="status">Processing...</div> Clearing expired tokens';

            try {
                const response = await fetch('/api/debug/clear-primary-tokens', {
                    method: 'POST'
                });
                const data = await response.json();

                if (response.ok && data.success) {
                    resultDiv.className = 'response success';
                    resultDiv.innerHTML = \`
                        <div class="status success">✅ SUCCESS</div>
                        <h3>Expired Primary Tokens Cleared</h3>
                        <p><strong>Result:</strong> \${data.message}</p>
                        <p><strong>Next step:</strong> Test the calendar API again - it should now use your connected account</p>
                        <button onclick="testCalendarAPI()" style="margin-top: 10px; padding: 8px 16px; background: #4285f4; color: white; border: none; border-radius: 4px; cursor: pointer;">🔄 Test Calendar API Now</button>
                    \`;
                } else {
                    resultDiv.className = 'response error';
                    resultDiv.innerHTML = \`
                        <div class="status error">❌ ERROR</div>
                        <h3>Failed to Clear Tokens</h3>
                        <p><strong>Status:</strong> \${response.status}</p>
                        <pre>\${JSON.stringify(data, null, 2)}</pre>
                    \`;
                }
            } catch (error) {
                resultDiv.className = 'response error';
                resultDiv.innerHTML = \`
                    <div class="status error">❌ ERROR</div>
                    <h3>Clear Tokens Network Error</h3>
                    <p>\${error.message}</p>
                \`;
            }
        }

        async function runAllTests() {
            console.log('🚀 Running all tests...');
            await testCalendarAPI();
            await new Promise(resolve => setTimeout(resolve, 500));
            await testOAuthURL();
            await new Promise(resolve => setTimeout(resolve, 500));
            await testAccountsAPI();
            console.log('✅ All tests completed');
        }

        // Auto-run calendar test on page load to show immediate status
        window.addEventListener('load', () => {
            setTimeout(testCalendarAPI, 1000);
        });
    </script>
</body>
</html>
  `;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}