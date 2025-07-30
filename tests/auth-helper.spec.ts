import { test, expect } from '@playwright/test';

// This test helps set up authentication for other tests
test('setup google auth', async ({ page }) => {
  // Go to your app
  await page.goto('http://localhost:3000');
  
  // Look for login/settings button
  const loginButton = page.locator('button:has-text("Sign in"), button:has-text("Login"), a:has-text("Sign in"), a:has-text("Login")').first();
  
  if (await loginButton.isVisible()) {
    await loginButton.click();
    
    // Wait for Google OAuth to load
    await page.waitForURL('**/accounts.google.com/**');
    
    // Fill in Google credentials (you'll need to do this manually)
    console.log('Please complete Google sign-in manually in the browser window');
    console.log('After signing in, close the browser to save the auth state');
    
    // Wait for user to complete sign-in (30 seconds)
    await page.waitForTimeout(30000);
    
    // Verify we're back on the app
    await expect(page).toHaveURL(/localhost:3000/);
  } else {
    console.log('No login button found - user might already be authenticated');
  }
});

// Test that uses the auth state
test('test with auth', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Check if we're authenticated by looking for user-specific elements
  const userElement = page.locator('[data-user], .user-info, .profile').first();
  
  if (await userElement.isVisible()) {
    console.log('User appears to be authenticated');
    // Continue with your test...
  } else {
    console.log('User not authenticated - run the auth setup test first');
  }
}); 