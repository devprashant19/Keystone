# phase7_ui — superseded by browser-driven UI verification

The previous `test_ui_spec.py` asserted UI properties by grepping `.tsx` and `.css`
source text for literal strings (e.g. `'--bg: #0A0E14' in tokens_code`). That approach
verified nothing about rendered behaviour, covered only 7 of the 22 UI/AX check IDs it
claimed, and broke the moment the design tokens legitimately changed.

UI and accessibility verification now runs in Chromium under `web/verification/`
(Playwright + axe-core), with asserted DOM state changes and committed screenshots.
Results are recorded in `web/UI_PHASE_STATUS.md` and `web/UI_VERIFICATION_REPORT.md`.
