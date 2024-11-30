import { axe } from 'axe-core';

export const runAccessibilityCheck = async (container = document) => {
  try {
    const results = await axe.run(container, {
      rules: {
        'color-contrast': { enabled: true },
        'html-has-lang': { enabled: true },
        'valid-lang': { enabled: true },
        'region': { enabled: true },
        'landmark-one-main': { enabled: true },
        'page-has-heading-one': { enabled: true },
        'button-name': { enabled: true },
        'link-name': { enabled: true },
        'image-alt': { enabled: true },
        'input-button-name': { enabled: true },
        'label': { enabled: true },
        'list': { enabled: true },
        'listitem': { enabled: true },
        'aria-allowed-attr': { enabled: true },
        'aria-hidden-body': { enabled: true },
        'aria-hidden-focus': { enabled: true },
        'aria-input-field-name': { enabled: true },
        'aria-required-attr': { enabled: true },
        'aria-required-children': { enabled: true },
        'aria-required-parent': { enabled: true },
        'aria-roles': { enabled: true },
        'aria-valid-attr-value': { enabled: true },
        'aria-valid-attr': { enabled: true },
      },
    });

    return {
      violations: results.violations,
      passes: results.passes,
      incomplete: results.incomplete,
      inapplicable: results.inapplicable,
    };
  } catch (error) {
    console.error('Accessibility check failed:', error);
    throw error;
  }
};

export const generateA11yReport = (results) => {
  const report = {
    summary: {
      violations: results.violations.length,
      passes: results.passes.length,
      incomplete: results.incomplete.length,
      inapplicable: results.inapplicable.length,
    },
    violations: results.violations.map(violation => ({
      id: violation.id,
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      nodes: violation.nodes.map(node => ({
        html: node.html,
        impact: node.impact,
        target: node.target,
        failureSummary: node.failureSummary,
      })),
    })),
  };

  return report;
};

export const checkComponentA11y = async (component) => {
  const results = await runAccessibilityCheck(component);
  return generateA11yReport(results);
};

// Accessibility testing utilities for components
export const a11yTestUtils = {
  // Check if element is keyboard navigable
  isKeyboardNavigable: (element) => {
    const tabIndex = element.getAttribute('tabindex');
    const role = element.getAttribute('role');
    const isNativelyFocusable = [
      'a', 'button', 'input', 'select', 'textarea',
    ].includes(element.tagName.toLowerCase());

    return isNativelyFocusable || tabIndex !== null || role !== null;
  },

  // Check if element has sufficient color contrast
  hasValidContrast: async (element) => {
    const results = await axe.run(element, {
      rules: ['color-contrast'],
    });
    return results.violations.length === 0;
  },

  // Check if element has valid ARIA attributes
  hasValidAriaAttributes: async (element) => {
    const results = await axe.run(element, {
      rules: [
        'aria-allowed-attr',
        'aria-required-attr',
        'aria-valid-attr',
        'aria-valid-attr-value',
      ],
    });
    return results.violations.length === 0;
  },

  // Check if form elements are properly labeled
  hasValidFormLabels: async (form) => {
    const results = await axe.run(form, {
      rules: ['label', 'aria-input-field-name'],
    });
    return results.violations.length === 0;
  },
};

// Focus management utilities
export const focusUtils = {
  // Trap focus within a container
  trapFocus: (container) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    container.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            lastFocusable.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            firstFocusable.focus();
            e.preventDefault();
          }
        }
      }
    });
  },

  // Restore focus to previous element
  createFocusManager: () => {
    let previousFocus = null;

    return {
      save: () => {
        previousFocus = document.activeElement;
      },
      restore: () => {
        if (previousFocus && previousFocus.focus) {
          previousFocus.focus();
        }
      },
    };
  },
};
