// web/verification/contrast.mjs
// Calculates WCAG contrast ratios for Jaal Pre-Mortem design tokens

const colors = {
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

function blend(fgRgba, bgHex) {
  const bg = hexToRgb(bgHex);
  return {
    r: Math.round(fgRgba.a * fgRgba.r + (1 - fgRgba.a) * bg.r),
    g: Math.round(fgRgba.a * fgRgba.g + (1 - fgRgba.a) * bg.g),
    b: Math.round(fgRgba.a * fgRgba.b + (1 - fgRgba.a) * bg.b)
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

console.log('=== JAAL PRE-MORTEM DESIGN TOKEN CONTRAST MATRIX ===\n');
let allPass = true;
const results = [];

// 1. Inks on surfaces
console.log('--- 1. Ink on Surfaces ---');
for (const ink of inks) {
  for (const s of surfaces) {
    const ratio = contrastRatio(hexToRgb(ink.hex), hexToRgb(s.hex));
    const pass = ratio >= ink.target;
    if (!pass) allPass = false;
    results.push({ pair: `${ink.name} on ${s.name}`, ratio: ratio.toFixed(2), target: `${ink.target}:1`, status: pass ? 'PASS' : 'FAIL', note: ink.type });
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
  results.push({ pair: `--accent on ${at.sName}`, ratio: ratio.toFixed(2), target: `${at.target}:1`, status: pass ? 'PASS' : 'FAIL', note: 'UI control / active' });
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
  results.push({ pair: `${sc.name} on --bg-panel`, ratio: ratioPanel.toFixed(2), target: '3.0:1', status: passPanel ? 'PASS' : 'FAIL', note: 'status badge / boundary' });
  console.log(`  ${sc.name.padEnd(10)} on --bg-panel    : ${ratioPanel.toFixed(2)}:1 [Target >= 3.0:1] -> ${passPanel ? 'PASS' : 'FAIL'}`);

  // on own wash
  const blendedWash = blend(sc.wash, colors.bgPanel);
  const ratioWash = contrastRatio(hexToRgb(sc.hex), blendedWash);
  const passWash = ratioWash >= 3.0;
  if (!passWash) allPass = false;
  results.push({ pair: `${sc.name} on ${sc.washName}`, ratio: ratioWash.toFixed(2), target: '3.0:1', status: passWash ? 'PASS' : 'FAIL', note: 'status badge text on wash' });
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
  results.push({ pair: `--line-focus on ${fs.name}`, ratio: ratio.toFixed(2), target: '3.0:1', status: pass ? 'PASS' : 'FAIL', note: 'UI focus boundary' });
  console.log(`  --line-focus on ${fs.name.padEnd(12)} : ${ratio.toFixed(2)}:1 [Target >= 3.0:1] -> ${pass ? 'PASS' : 'FAIL'}`);
}

console.log('\n======================================================');
console.log(`Overall Result: ${allPass ? 'ALL CHECKS PASSED' : 'FAILURES DETECTED'}`);
process.exit(allPass ? 0 : 1);
