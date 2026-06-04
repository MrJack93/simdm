#!/usr/bin/env node
/**
 * WCAG 2.1 Contrast Ratio Verifier
 * Validates all color variables meet WCAG AA/AAA standards
 */

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) throw new Error(`Invalid hex color: ${hex}`);
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ];
}

function getLuminance([r, g, b]) {
  const [rs, gs, bs] = [r, g, b].map(val => {
    val = val / 255;
    return val <= 0.03928
      ? val / 12.92
      : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(hex1, hex2) {
  const lum1 = getLuminance(hexToRgb(hex1));
  const lum2 = getLuminance(hexToRgb(hex2));
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return ((lighter + 0.05) / (darker + 0.05)).toFixed(2);
}

function checkCompliance(ratio, type = 'AA') {
  const thresholds = {
    AA: 4.5,
    AAA: 7.0,
  };
  return parseFloat(ratio) >= thresholds[type];
}

// WCAG compliance tests
const tests = [
  // Dark Mode
  {
    name: 'Dark mode: Text Primary on BG Primary',
    fg: '#f0f0f0',
    bg: '#0c0f10',
    expected: 'AAA',
  },
  {
    name: 'Dark mode: Text Secondary on BG Primary',
    fg: '#8a9199',
    bg: '#0c0f10',
    expected: 'AA',
  },
  {
    name: 'Dark mode: Text Tertiary on BG Primary',
    fg: '#7a8290',
    bg: '#0c0f10',
    expected: 'AA',
  },
  {
    name: 'Dark mode: Accent on BG Primary',
    fg: '#ff9b6a',
    bg: '#0c0f10',
    expected: 'AAA',
  },

  // Light Mode
  {
    name: 'Light mode: Text Primary on BG Primary',
    fg: '#111418',
    bg: '#f4f5f7',
    expected: 'AAA',
  },
  {
    name: 'Light mode: Text Secondary on BG Primary',
    fg: '#5c6370',
    bg: '#f4f5f7',
    expected: 'AA',
  },
  {
    name: 'Light mode: Text Tertiary on BG Primary',
    fg: '#626d7d',
    bg: '#f4f5f7',
    expected: 'AA',
  },
  {
    name: 'Light mode: Accent on BG Primary',
    fg: '#e8703a',
    bg: '#f4f5f7',
    expected: 'AA',
  },

  // Color semantics (Dark)
  {
    name: 'Dark mode: Success color contrast',
    fg: '#34d399',
    bg: '#0c0f10',
    expected: 'AAA',
  },
  {
    name: 'Dark mode: Error color contrast',
    fg: '#f87171',
    bg: '#0c0f10',
    expected: 'AA',
  },
  {
    name: 'Dark mode: Warning color contrast',
    fg: '#fbbf24',
    bg: '#0c0f10',
    expected: 'AAA',
  },
];

console.log(
  '🎨 WCAG 2.1 Color Contrast Verification\n' +
    '=' .repeat(60)
);

let passed = 0;
let failed = 0;

tests.forEach(test => {
  const ratio = getContrastRatio(test.fg, test.bg);
  const complies = checkCompliance(ratio, test.expected);
  const symbol = complies ? '✅' : '❌';
  const statusColor = complies ? '\x1b[32m' : '\x1b[31m';

  console.log(`${symbol} ${test.name}`);
  console.log(
    `   Ratio: ${statusColor}${ratio}:1\x1b[0m (Target: ${test.expected})`
  );

  if (complies) passed++;
  else failed++;
  console.log('');
});

console.log('='.repeat(60));
console.log(
  `\n📊 Results: ${passed}/${tests.length} passed\n`
);

if (failed > 0) {
  console.log(`❌ ${failed} test(s) failed - WCAG compliance issue!`);
  process.exit(1);
} else {
  console.log('✅ All contrast tests passed - WCAG 2.1 AA compliant');
  process.exit(0);
}
