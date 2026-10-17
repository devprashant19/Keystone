// web/verification/contrast.mjs
// Calculates WCAG contrast ratios for Jaal / Keystone design tokens across BOTH light and dark themes

const lightColors = {
  name: 'LIGHT THEME (PUKAAR PALETTE · DEFAULT ON)',
  bgVoid: '#f2f8fc',
  bgPanel: '#ffffff',
  bgRaised: '#ffffff',
  bgSunken: '#e3f0f8',
  bgHeader: '#ffffff',

  lineHair: '#d6e6f1',
  lineFirm: '#b9d3e5',
  lineFocus: '#1d7fc4',

  inkHi: '#0b1f33',
  inkMid: '#284560',
  inkLo: '#557089',

  accent: '#11679e',
  branch: '#6b21a8',
  ok: '#0f6443',
  warn: '#6b5000',
  fail: '#9c0d2f',
  synthetic: '#557089',

  accentWash: '#e2f1fb',
  branchWash: '#f3e8ff',
  okWash: '#def5ea',
  warnWash: '#fff4c7',
  failWash: '#ffdfe6'
};

const darkColors = {
  name: 'DARK THEME (PUKAAR NIGHT)',
  bgVoid: '#06111f',
  bgPanel: '#0c2136',
  bgRaised: '#102a42',
  bgSunken: '#081828',
  bgHeader: '#15334f',

  lineHair: '#1a3854',
  lineFirm: '#24496b',
  lineFocus: '#8ad0ff',

  inkHi: '#eaf4fb',
  inkMid: '#c3dbee',
  inkLo: '#8fb0cb',

  accent: '#4fb3ff',
  branch: '#c084fc',
  ok: '#5fd6a4',
  warn: '#f6d95c',
  fail: '#ff8098',
  synthetic: '#8fb0cb',

  // Washes with alphas blended on bgPanel (#0c2136)
  accentWash: { r: 79, g: 179, b: 255, a: 0.14 },
  branchWash: { r: 192, g: 132, b: 252, a: 0.14 },
  okWash: { r: 60, g: 198, b: 143, a: 0.14 },
  warnWash: { r: 242, g: 204, b: 53, a: 0.14 },
  failWash: { r: 255, g: 77, b: 109, a: 0.16 }
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
  console.log(`=== KEYSTONE PRE-MORTEM DESIGN TOKEN CONTRAST MATRIX (${colors.name}) ===\n`);

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
