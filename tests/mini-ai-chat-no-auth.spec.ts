import { test, expect } from '@playwright/test';

test.describe('Mini AI Chat - No Auth Required', () => {
  test('should test text selection and AI button functionality', async ({ page }) => {
    // Go to the app
    await page.goto('http://localhost:3000');
    console.log('✅ App loaded');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for any text content we can interact with
    const textElements = page.locator('p, div, span, h1, h2, h3').filter({ hasText: /./ });
    const textCount = await textElements.count();
    console.log(`Found ${textCount} text elements`);
    
    if (textCount > 0) {
      // Click on first text element
      const firstText = textElements.first();
      await firstText.click();
      console.log('✅ Clicked on text element');
      
      // Try to select some text
      await page.keyboard.down('Shift');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.up('Shift');
      console.log('✅ Selected text');
      
      // Look for any AI-related buttons
      const aiButtons = page.locator('button:has-text("AI"), button:has-text("🤖"), button[title*="AI"]');
      const aiButtonCount = await aiButtons.count();
      console.log(`Found ${aiButtonCount} AI buttons`);
      
      if (aiButtonCount > 0) {
        await aiButtons.first().click();
        console.log('✅ Clicked AI button');
        
        // Look for mini chat
        const miniChat = page.locator('.mini-ai-chat, [class*="mini"], [class*="chat"]');
        if (await miniChat.isVisible()) {
          console.log('✅ Mini chat opened successfully!');
        } else {
          console.log('⚠️ Mini chat not found');
        }
      } else {
        console.log('⚠️ No AI buttons found');
      }
    } else {
      console.log('⚠️ No text elements found to test');
    }
  });

  test('should test editor functionality if available', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Look for editor elements
    const editors = page.locator('[contenteditable="true"], .editor, .bn-container, textarea');
    const editorCount = await editors.count();
    console.log(`Found ${editorCount} editor elements`);
    
    if (editorCount > 0) {
      const editor = editors.first();
      await editor.click();
      console.log('✅ Clicked on editor');
      
      // Type some text
      await page.keyboard.type('This is a test about AI');
      console.log('✅ Typed text in editor');
      
      // Try to select text
      await page.keyboard.down('Shift');
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.up('Shift');
      console.log('✅ Selected text in editor');
      
      // Look for formatting toolbar
      const toolbar = page.locator('.toolbar, .formatting-toolbar, [class*="toolbar"]');
      if (await toolbar.isVisible()) {
        console.log('✅ Formatting toolbar found');
        
        // Look for AI button in toolbar
        const aiButton = toolbar.locator('button:has-text("AI"), button:has-text("🤖"), button[title*="AI"]');
        if (await aiButton.isVisible()) {
          await aiButton.click();
          console.log('✅ Clicked AI button in toolbar');
        } else {
          console.log('⚠️ AI button not found in toolbar');
        }
      } else {
        console.log('⚠️ Formatting toolbar not found');
      }
    } else {
      console.log('⚠️ No editor elements found');
    }
  });
}); 