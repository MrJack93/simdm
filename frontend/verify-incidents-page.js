import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Navigate to the app
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    console.log('✓ Page loaded');

    // Check if we're on login page
    const loginBtn = await page.$('text=Conectare');
    if (loginBtn) {
      console.log('✓ On login page, logging in...');

      // Fill in credentials
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Wait for navigation
      await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 5000 }).catch(() => {});
      console.log('✓ Logged in');
    }

    // Navigate to Incidentspage
    const incidentLink = await page.$('text=Incidente');
    if (incidentLink) {
      await incidentLink.click();
      await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 5000 });
      console.log('✓ Navigated to Incidents page');
    }

    // Wait for table to load
    await page.waitForSelector('table', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1000);

    // Check light mode - take screenshot
    console.log('\n📸 Light Mode Screenshot:');
    await page.screenshot({ path: '/tmp/incidents-light.png', fullPage: true });
    console.log('✓ Saved incidents-light.png');

    // Get dash placeholders in light mode
    const lightDashes = await page.$$eval('span[style*="color: var(--color-text-secondary)"]', els => {
      return els.map(el => ({
        text: el.textContent,
        color: el.style.color,
        computedColor: window.getComputedStyle(el).color
      }));
    }).catch(e => {
      console.log('Could not query dashes:', e.message);
      return [];
    });

    if (lightDashes.length > 0) {
      console.log('✓ Found dashes in light mode:');
      lightDashes.forEach((d, i) => {
        console.log(`  ${i + 1}. Text: "${d.text}", Computed Color: ${d.computedColor}`);
      });
    } else {
      console.log('⚠️  No dashes found with expected selector in light mode');
    }

    // Switch to dark mode
    console.log('\n🌙 Switching to dark mode...');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(500); // Wait for transition

    // Take screenshot in dark mode
    console.log('📸 Dark Mode Screenshot:');
    await page.screenshot({ path: '/tmp/incidents-dark.png', fullPage: true });
    console.log('✓ Saved incidents-dark.png');

    // Get dash placeholders in dark mode
    const darkDashes = await page.$$eval('span[style*="color: var(--color-text-secondary)"]', els => {
      return els.map(el => ({
        text: el.textContent,
        color: el.style.color,
        computedColor: window.getComputedStyle(el).color
      }));
    }).catch(e => {
      console.log('Could not query dashes:', e.message);
      return [];
    });

    if (darkDashes.length > 0) {
      console.log('✓ Found dashes in dark mode:');
      darkDashes.forEach((d, i) => {
        console.log(`  ${i + 1}. Text: "${d.text}", Computed Color: ${d.computedColor}`);
      });
    } else {
      console.log('⚠️  No dashes found with expected selector in dark mode');
    }

    // Verify visibility by checking computed styles
    console.log('\n🔍 Visibility Analysis:');
    const visibility = await page.evaluate(() => {
      const dashes = Array.from(document.querySelectorAll('span')).filter(el => el.textContent === '—');
      return dashes.map(dash => {
        const style = window.getComputedStyle(dash);
        const rect = dash.getBoundingClientRect();
        return {
          text: dash.textContent,
          computedColor: style.color,
          opacity: style.opacity,
          visibility: style.visibility,
          display: style.display,
          width: rect.width,
          height: rect.height,
          isVisible: rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
        };
      });
    });

    if (visibility.length > 0) {
      console.log(`✓ Found ${visibility.length} dash placeholders`);
      visibility.forEach((v, i) => {
        const visible = v.isVisible ? '✓ VISIBLE' : '❌ HIDDEN';
        console.log(`  ${i + 1}. ${visible} - Color: ${v.computedColor}, Opacity: ${v.opacity}`);
      });
    } else {
      console.log('⚠️  No dash placeholders found in page');
    }

    console.log('\n✅ Verification complete');

  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
