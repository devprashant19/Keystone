// web/verification/contrast.mjs
// Calculates WCAG contrast ratios for Jaal / Keystone design tokens across BOTH light and dark themes

const lightColors = {
  name: 'LIGHT THEME (DEFAULT ON)',
  bgVoid: '#f5f2eb',
  bgPanel: '#fffdf9',
  bgRaised: '#ffffff',
  bgSunken: '#f0ece3',
  bgHeader: '#ffffff',

  lineHair: '#000000',
  lineFirm: '#000000',
  lineFocus: '#0284c7',

  inkHi: '#000000',
  inkMid: '#3f3f46',
  inkLo: '#52525b',

  accent: '#0284c7',
  branch: '#7c3aed',
  ok: '#15803d',
  warn: '#a16207',
  fail: '#b91c1c',
  synthetic: '#475569',

  accentWash: '#e0f2fe',
  branchWash: '#ede9fe',
  okWash: '#dcfce7',
  warnWash: '#fef9c3',
  failWash: '#fee2e2'
};

const darkColors = {
  name: 'DARK THEME',
  bgVoid: '#070B12',
  bgPanel: '#0B1119',
  bgRaised: '#111A25',
  bgSunken: '#060A10',
  bgHeader: '#17222F',

  lineHair: '#1E2A38',
  lineFirm: '#2A3A4C',
  lineFocus: '#49B4FF',

  inkHi: '#E9EEF6',
  inkMid: '#9FB0C4',
  inkLo: '#6B7F96',

  accent: '#49B4FF',
  branch: '#B57CFF',
  ok: '#35C08A',
  warn: '#E0A33E',
  fail: '#F2564B',
  synthetic: '#7D8EA3',

  // Washes with alphas blended on bgPanel (#0B1119)
  accentWash: { r: 73, g: 180, b: 255, a: 0.14 },
  branchWash: { r: 181, g: 124, b: 255, a: 0.12 },
  okWash: { r: 53, g: 192, b: 138, a: 0.13 },
  warnWash: { r: 224, g: 163, b: 62, a: 0.13 },
  failWash: { r: 242, g: 86, b: 75, a: 0.13 }
};

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16)
  };
}

function blend(fg, bgHex) {
  if (typeof fg === 'string') {
    return hexToRgb(fg);
  }
  const bg = hexToRgb(bgHex);
  return {
    r: Math.round(fg.a * fg.r + (1 - fg.a) * bg.r),
    g: Math.round(fg.a * fg.g + (1 - fg.a) * bg.g),
    b: Math.round(fg.a * fg.b + (1 - fg.a) * bg.b)
  };
}

function srgbToLin(val) {
  const v = val / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function relativeLuminance(rgb) {
  const r = srgbToLin(rgb.r);
  const g = srgbToLin(rgb.g);
  const b = srgbToLin(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(rgb1, rgb2) {
  const l1 = relativeLuminance(rgb1);
  const l2 = relativeLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

let allPass = true;

function evaluateTheme(colors) {
  console.log(`=== JAAL PRE-MORTEM DESIGN TOKEN CONTRAST MATRIX (${colors.name}) ===\n`);

  const surfaces = [
    { name: '--bg-void', hex: colors.bgVoid },
    { name: '--bg-panel', hex: colors.bgPanel },
    { name: '--bg-raised', hex: colors.bgRaised },
    { name: '--bg-header', hex: colors.bgHeader }
  ];

  const inks = [
    { name: '--ink-hi', hex: colors.inkHi, target: 4.5, type: 'body (AA)' },
    { name: '--ink-mid', hex: colors.inkMid, target: 4.5, type: 'body (AA)' },
    { name: '--ink-lo', hex: colors.inkLo, target: 3.0, type: 'secondary/caption (3:1)' }
  ];

  // 1. Inks on surfaces
  console.log('--- 1. Ink on Surfaces ---');
  for (const ink of inks) {
    for (const s of surfaces) {
      const ratio = contrastRatio(hexToRgb(ink.hex), hexToRgb(s.hex));
      const pass = ratio >= ink.target;
      if (!pass) allPass = false;
      console.log(`  ${ink.name.padEnd(10)} on ${s.name.padEnd(12)} : ${ratio.toFixed(2)}:1 [Target >= ${ink.target}:1] -> ${pass ? 'PASS' : 'FAIL'}`);
    }
  }

  // 2. Accent on panel and raised
  console.log('\n--- 2. Accent on Surfaces ---');
  const accentTargets = [
    { sName: '--bg-panel', sHex: colors.bgPanel, target: 3.0 },
    { sName: '--bg-raised', sHex: colors.bgRaised, target: 3.0 }
  ];
  for (const at of accentTargets) {
    const ratio = contrastRatio(hexToRgb(colors.accent), hexToRgb(at.sHex));
    const pass = ratio >= at.target;
    if (!pass) allPass = false;
    console.log(`  --accent   on ${at.sName.padEnd(12)} : ${ratio.toFixed(2)}:1 [Target >= ${at.target}:1] -> ${pass ? 'PASS' : 'FAIL'}`);
  }

  // 3. Status colours on --bg-panel and on their own wash
  console.log('\n--- 3. Status Colours on --bg-panel and on their Washes ---');
  const statusColors = [
    { name: '--ok', hex: colors.ok, wash: colors.okWash, washName: '--ok-wash' },
    { name: '--warn', hex: colors.warn, wash: colors.warnWash, washName: '--warn-wash' },
    { name: '--fail', hex: colors.fail, wash: colors.failWash, washName: '--fail-wash' },
    { name: '--branch', hex: colors.branch, wash: colors.branchWash, washName: '--branch-wash' }
  ];

  for (const sc of statusColors) {
    // on --bg-panel
    const ratioPanel = contrastRatio(hexToRgb(sc.hex), hexToRgb(colors.bgPanel));
    const passPanel = ratioPanel >= 3.0;
    if (!passPanel) allPass = false;
    console.log(`  ${sc.name.padEnd(10)} on --bg-panel    : ${ratioPanel.toFixed(2)}:1 [Target >= 3.0:1] -> ${passPanel ? 'PASS' : 'FAIL'}`);

    // on own wash
    const blendedWash = blend(sc.wash, colors.bgPanel);
    const ratioWash = contrastRatio(hexToRgb(sc.hex), blendedWash);
    const passWash = ratioWash >= 3.0;
    if (!passWash) allPass = false;
    console.log(`  ${sc.name.padEnd(10)} on ${sc.washName.padEnd(12)} : ${ratioWash.toFixed(2)}:1 [Target >= 3.0:1] -> ${passWash ? 'PASS' : 'FAIL'}`);
  }

  // 4. Focus ring against --bg-void and --bg-panel (needs >= 3:1)
  console.log('\n--- 4. Focus Ring Contrast ---');
  const focusSurfaces = [
    { name: '--bg-void', hex: colors.bgVoid },
    { name: '--bg-panel', hex: colors.bgPanel }
  ];
  for (const fs of focusSurfaces) {
    const ratio = contrastRatio(hexToRgb(colors.lineFocus), hexToRgb(fs.hex));
    const pass = ratio >= 3.0;
    if (!pass) allPass = false;
    console.log(`  --line-focus on ${fs.name.padEnd(12)} : ${ratio.toFixed(2)}:1 [Target >= 3.0:1] -> ${pass ? 'PASS' : 'FAIL'}`);
  }
  console.log('\n');
}

// Evaluate both themes
evaluateTheme(lightColors);
evaluateTheme(darkColors);

console.log('======================================================');
console.log(`Overall Result: ${allPass ? 'ALL CHECKS PASSED' : 'FAILURES DETECTED'}`);
process.exit(allPass ? 0 : 1);
