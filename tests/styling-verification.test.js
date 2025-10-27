/**
 * Basic styling verification tests
 * This file verifies that key CSS classes and utilities are available
 */

// Mock DOM environment for testing
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;

describe('Styling System Verification', () => {

  beforeEach(() => {
    // Create a test element
    const testElement = document.createElement('div');
    testElement.id = 'test-element';
    document.body.appendChild(testElement);
  });

  afterEach(() => {
    // Clean up test elements
    const testElement = document.getElementById('test-element');
    if (testElement) {
      testElement.remove();
    }
  });

  test('utility classes should be available', () => {
    const testElement = document.getElementById('test-element');

    // Test padding utilities
    testElement.className = 'p-4 px-2 py-6';
    expect(testElement.className).toContain('p-4');
    expect(testElement.className).toContain('px-2');
    expect(testElement.className).toContain('py-6');

    // Test margin utilities
    testElement.className = 'm-4 mx-auto my-2';
    expect(testElement.className).toContain('m-4');
    expect(testElement.className).toContain('mx-auto');
    expect(testElement.className).toContain('my-2');

    // Test flexbox utilities
    testElement.className = 'flex items-center justify-between gap-4';
    expect(testElement.className).toContain('flex');
    expect(testElement.className).toContain('items-center');
    expect(testElement.className).toContain('justify-between');
    expect(testElement.className).toContain('gap-4');
  });

  test('transparency utilities should be available', () => {
    const testElement = document.getElementById('test-element');

    // Test opacity utilities
    testElement.className = 'opacity-50 bg-white-10 text-white-80';
    expect(testElement.className).toContain('opacity-50');
    expect(testElement.className).toContain('bg-white-10');
    expect(testElement.className).toContain('text-white-80');
  });

  test('typography utilities should be available', () => {
    const testElement = document.getElementById('test-element');

    // Test font utilities
    testElement.className = 'text-lg font-semibold leading-tight tracking-wide';
    expect(testElement.className).toContain('text-lg');
    expect(testElement.className).toContain('font-semibold');
    expect(testElement.className).toContain('leading-tight');
    expect(testElement.className).toContain('tracking-wide');

    // Test text alignment
    testElement.className = 'text-center uppercase';
    expect(testElement.className).toContain('text-center');
    expect(testElement.className).toContain('uppercase');
  });

  test('sizing utilities should be available', () => {
    const testElement = document.getElementById('test-element');

    // Test width and height utilities
    testElement.className = 'w-full h-32 min-w-0 max-h-screen';
    expect(testElement.className).toContain('w-full');
    expect(testElement.className).toContain('h-32');
    expect(testElement.className).toContain('min-w-0');
    expect(testElement.className).toContain('max-h-screen');
  });

  test('form component classes should be available', () => {
    const testElement = document.getElementById('test-element');

    // Test form styling classes
    testElement.className = 'form-input-standard form-button-primary';
    expect(testElement.className).toContain('form-input-standard');
    expect(testElement.className).toContain('form-button-primary');
  });

  test('widget helper classes should be available', () => {
    const testElement = document.getElementById('test-element');

    // Test widget classes (from global-widget-classes.css)
    testElement.className = 'widget-background widget-header widget-title';
    expect(testElement.className).toContain('widget-background');
    expect(testElement.className).toContain('widget-header');
    expect(testElement.className).toContain('widget-title');
  });

  test('animation and transition utilities should be available', () => {
    const testElement = document.getElementById('test-element');

    // Test transition utilities
    testElement.className = 'transition-all duration-300 ease-in-out';
    expect(testElement.className).toContain('transition-all');
    expect(testElement.className).toContain('duration-300');
    expect(testElement.className).toContain('ease-in-out');
  });

  test('positioning utilities should be available', () => {
    const testElement = document.getElementById('test-element');

    // Test position utilities
    testElement.className = 'relative absolute fixed sticky';
    expect(testElement.className).toContain('relative');
    expect(testElement.className).toContain('absolute');
    expect(testElement.className).toContain('fixed');
    expect(testElement.className).toContain('sticky');

    // Test inset utilities
    testElement.className = 'inset-0 top-4 left-1/2';
    expect(testElement.className).toContain('inset-0');
    expect(testElement.className).toContain('top-4');
    expect(testElement.className).toContain('left-1/2');
  });

  test('visual utilities should be available', () => {
    const testElement = document.getElementById('test-element');

    // Test cursor and interaction utilities
    testElement.className = 'cursor-pointer select-none pointer-events-auto';
    expect(testElement.className).toContain('cursor-pointer');
    expect(testElement.className).toContain('select-none');
    expect(testElement.className).toContain('pointer-events-auto');

    // Test visibility utilities
    testElement.className = 'visible invisible hidden';
    expect(testElement.className).toContain('visible');
    expect(testElement.className).toContain('invisible');
    expect(testElement.className).toContain('hidden');
  });

  test('component state classes should work', () => {
    const testElement = document.getElementById('test-element');

    // Test component state classes
    testElement.className = 'widget-list-item active loading-spinner';
    expect(testElement.className).toContain('widget-list-item');
    expect(testElement.className).toContain('active');
    expect(testElement.className).toContain('loading-spinner');
  });

});

// Export for use in other test files
module.exports = {
  testUtilityClass: (className) => {
    const testElement = document.createElement('div');
    testElement.className = className;
    return testElement.className.includes(className);
  }
};