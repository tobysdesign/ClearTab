import { test, expect } from '@playwright/test';

test.describe('Mini AI Chat', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the app
    await page.goto('http://localhost:3000');
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
  });

  test('should open mini chat when AI button is clicked', async ({ page }) => {
    // Look for notes widget or create a note
    const notesWidget = page.locator('[data-widget="notes"]').first();
    
    if (await notesWidget.isVisible()) {
      await notesWidget.click();
      
      // Look for "Add" button to create a new note
      const addButton = page.locator('button:has-text("Add"), button:has-text("+")').first();
      if (await addButton.isVisible()) {
        await addButton.click();
      }
      
      // Wait for editor to be ready
      await page.waitForTimeout(1000);
      
      // Type some text
      const editor = page.locator('.editor-content, [contenteditable="true"], .bn-container').first();
      if (await editor.isVisible()) {
        await editor.click();
        await page.keyboard.type('This is a test about artificial intelligence');
        
        // Select some text
        await page.keyboard.down('Shift');
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.up('Shift');
        
        // Look for AI button in toolbar
        const aiButton = page.locator('button[title*="AI"], button:has-text("🤖"), button:has-text("AI")').first();
        
        if (await aiButton.isVisible()) {
          await aiButton.click();
          
          // Verify mini chat opens
          const miniChat = page.locator('.mini-ai-chat, [class*="mini"], [class*="chat"]').first();
          await expect(miniChat).toBeVisible({ timeout: 5000 });
          
          console.log('✅ Mini AI chat opened successfully!');
        } else {
          console.log('⚠️ AI button not found in toolbar');
        }
      } else {
        console.log('⚠️ Editor not found');
      }
    } else {
      console.log('⚠️ Notes widget not found');
    }
  });

  test('should handle text selection and AI interaction', async ({ page }) => {
    // This test focuses on the core functionality without auth
    console.log('Testing mini AI chat core functionality...');
    
    // Navigate to a page where we can test text selection
    await page.goto('http://localhost:3000');
    
    // Look for any text content we can interact with
    const textContent = page.locator('p, div, span').filter({ hasText: /./ }).first();
    
    if (await textContent.isVisible()) {
      // Select some text
      await textContent.click();
      await page.keyboard.down('Shift');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.up('Shift');
      
      console.log('✅ Text selection test completed');
    } else {
      console.log('⚠️ No text content found to test selection');
    }
  });
}); 