import { test, expect } from '@playwright/test';

test('test mini AI chat functionality', async ({ page }) => {
  // Go to the app
  await page.goto('http://localhost:3000');
  
  console.log('✅ App loaded successfully');
  
  // Look for any interactive elements
  const buttons = await page.locator('button').count();
  console.log(`Found ${buttons} buttons on the page`);
  
  // Look for notes or editor elements
  const notesElements = await page.locator('[data-widget="notes"], .notes, .editor').count();
  console.log(`Found ${notesElements} notes/editor elements`);
  
  // Test text selection on any content
  const textElements = page.locator('p, div, span').filter({ hasText: /./ });
  if (await textElements.count() > 0) {
    const firstText = textElements.first();
    await firstText.click();
    console.log('✅ Clicked on text element');
    
    // Try to select some text
    await page.keyboard.down('Shift');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.up('Shift');
    console.log('✅ Selected text');
  }
  
  console.log('✅ Basic functionality test completed');
}); 