import { axe, toHaveNoViolations } from 'jest-axe';
import {
  focusFirstElement,
  focusLastElement,
  trapFocus,
  manageFocus,
  checkA11y
} from '../../utils/accessibility';

expect.extend(toHaveNoViolations);

describe('Accessibility Utils', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('Focus Management', () => {
    beforeEach(() => {
      container.innerHTML = `
        <div>
          <button id="first">First</button>
          <input type="text" id="middle" />
          <button id="last">Last</button>
        </div>
      `;
    });

    it('focuses first focusable element', () => {
      const firstButton = container.querySelector('#first');
      focusFirstElement(container);
      expect(document.activeElement).toBe(firstButton);
    });

    it('focuses last focusable element', () => {
      const lastButton = container.querySelector('#last');
      focusLastElement(container);
      expect(document.activeElement).toBe(lastButton);
    });

    it('traps focus within container', () => {
      const firstButton = container.querySelector('#first');
      const lastButton = container.querySelector('#last');
      
      trapFocus(container);
      
      // Focus should move to first element when tabbing from last
      lastButton.focus();
      lastButton.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
      expect(document.activeElement).toBe(firstButton);
      
      // Focus should move to last element when shift-tabbing from first
      firstButton.focus();
      firstButton.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true }));
      expect(document.activeElement).toBe(lastButton);
    });
  });

  describe('Focus History', () => {
    it('manages focus history correctly', () => {
      const focusManager = manageFocus();
      const button = document.createElement('button');
      container.appendChild(button);
      
      // Set focus
      button.focus();
      focusManager.save();
      
      // Change focus
      document.body.focus();
      expect(document.activeElement).toBe(document.body);
      
      // Restore focus
      focusManager.restore();
      expect(document.activeElement).toBe(button);
    });
  });

  describe('Accessibility Checks', () => {
    it('identifies accessibility violations', async () => {
      // Create an element with known accessibility issues
      container.innerHTML = `
        <img src="test.jpg" />
        <button></button>
      `;

      const results = await checkA11y(container);
      expect(results.violations.length).toBeGreaterThan(0);
    });

    it('passes for accessible content', async () => {
      // Create an accessible element
      container.innerHTML = `
        <img src="test.jpg" alt="Test image" />
        <button aria-label="Test button">Click me</button>
      `;

      const results = await checkA11y(container);
      expect(results.violations.length).toBe(0);
    });
  });

  describe('ARIA Attributes', () => {
    it('validates aria-label usage', async () => {
      container.innerHTML = `
        <button aria-label="Close dialog">×</button>
      `;

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('validates aria-expanded usage', async () => {
      container.innerHTML = `
        <button aria-expanded="false" aria-controls="menu">
          Menu
        </button>
        <div id="menu" hidden>
          <a href="#">Item 1</a>
          <a href="#">Item 2</a>
        </div>
      `;

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
