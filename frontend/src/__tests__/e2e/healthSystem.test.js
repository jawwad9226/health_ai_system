import { test, expect } from '@playwright/test';

test.describe('Health AI System E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('complete user journey', async ({ page }) => {
    // Step 1: Login
    await test.step('User Login', async () => {
      await page.click('text=Login');
      await page.fill('[name=email]', 'test@example.com');
      await page.fill('[name=password]', 'password123');
      await page.click('button:has-text("Sign In")');
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    // Step 2: View Dashboard
    await test.step('Dashboard Overview', async () => {
      // Check health metrics widget
      await expect(page.locator('[data-testid=health-metrics-widget]')).toBeVisible();
      
      // Check risk assessment widget
      await expect(page.locator('[data-testid=risk-assessment-widget]')).toBeVisible();
      
      // Check appointment list
      await expect(page.locator('[data-testid=appointment-list]')).toBeVisible();
    });

    // Step 3: Schedule Appointment
    await test.step('Appointment Scheduling', async () => {
      await page.click('text=Schedule Appointment');
      await page.click('[data-testid=date-picker]');
      await page.click('text=15'); // Select 15th of current month
      await page.click('text=Confirm');
      await expect(page.locator('text=Appointment scheduled')).toBeVisible();
    });

    // Step 4: Check Health Metrics
    await test.step('Health Metrics Interaction', async () => {
      await page.click('[data-testid=health-metrics-widget]');
      await expect(page.locator('text=Detailed Metrics')).toBeVisible();
      
      // Test metric filters
      await page.selectOption('select[name=metric-period]', 'last-month');
      await expect(page.locator('.metric-chart')).toBeVisible();
    });

    // Step 5: Risk Assessment
    await test.step('Risk Assessment Review', async () => {
      await page.click('[data-testid=risk-assessment-widget]');
      await expect(page.locator('text=Risk Factors')).toBeVisible();
      
      // Check risk details
      await page.click('text=View Details');
      await expect(page.locator('text=Risk Analysis')).toBeVisible();
    });

    // Step 6: Update Profile
    await test.step('Profile Management', async () => {
      await page.click('text=Profile');
      await page.fill('[name=phone]', '123-456-7890');
      await page.click('text=Save Changes');
      await expect(page.locator('text=Profile updated')).toBeVisible();
    });

    // Step 7: Check Notifications
    await test.step('Notification Handling', async () => {
      await page.click('[data-testid=notifications-bell]');
      await expect(page.locator('.notification-list')).toBeVisible();
      
      // Mark notification as read
      await page.click('.notification-item >> text=Mark as read');
      await expect(page.locator('.unread-count')).toHaveText('0');
    });

    // Step 8: Generate Health Report
    await test.step('Report Generation', async () => {
      await page.click('text=Reports');
      await page.click('text=Generate Report');
      await page.click('text=Last 30 Days');
      await page.click('text=Download');
      
      // Check if download started
      const download = await Promise.all([
        page.waitForEvent('download'),
        page.click('text=Confirm Download')
      ]);
      expect(download[0].suggestedFilename()).toContain('health-report');
    });

    // Step 9: Logout
    await test.step('User Logout', async () => {
      await page.click('text=Logout');
      await expect(page.locator('text=Login')).toBeVisible();
    });
  });

  test('error handling scenarios', async ({ page }) => {
    // Test offline behavior
    await test.step('Offline Handling', async () => {
      await page.context().setOffline(true);
      await page.reload();
      await expect(page.locator('text=No internet connection')).toBeVisible();
    });

    // Test invalid login
    await test.step('Invalid Login', async () => {
      await page.click('text=Login');
      await page.fill('[name=email]', 'invalid@example.com');
      await page.fill('[name=password]', 'wrongpassword');
      await page.click('button:has-text("Sign In")');
      await expect(page.locator('text=Invalid credentials')).toBeVisible();
    });

    // Test session expiry
    await test.step('Session Expiry', async () => {
      // Login first
      await page.click('text=Login');
      await page.fill('[name=email]', 'test@example.com');
      await page.fill('[name=password]', 'password123');
      await page.click('button:has-text("Sign In")');

      // Simulate token expiry
      await page.evaluate(() => {
        localStorage.setItem('token', 'expired_token');
      });

      // Try to access protected route
      await page.click('text=Profile');
      await expect(page.locator('text=Session expired')).toBeVisible();
    });
  });

  test('accessibility compliance', async ({ page }) => {
    await test.step('Accessibility Checks', async () => {
      // Run accessibility scan on main pages
      const pagesToCheck = ['/', '/login', '/dashboard', '/profile'];
      
      for (const path of pagesToCheck) {
        await page.goto(`http://localhost:3000${path}`);
        const violations = await page.evaluate(async () => {
          // @ts-ignore
          const { axe } = await import('axe-core');
          const results = await axe.run(document);
          return results.violations;
        });
        
        expect(violations).toHaveLength(0);
      }
    });
  });

  test('performance metrics', async ({ page }) => {
    await test.step('Performance Monitoring', async () => {
      const metrics = await page.evaluate(() => ({
        memory: performance.memory,
        timing: performance.timing,
        navigation: performance.getEntriesByType('navigation')[0],
      }));

      // Check load time
      expect(metrics.navigation.domContentLoadedEventEnd - metrics.navigation.startTime).toBeLessThan(3000);

      // Check memory usage
      if (metrics.memory) {
        const usagePercent = (metrics.memory.usedJSHeapSize / metrics.memory.totalJSHeapSize) * 100;
        expect(usagePercent).toBeLessThan(90);
      }
    });
  });
});
