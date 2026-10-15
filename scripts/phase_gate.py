"""
scripts/phase_gate.py - Auto-advance phase gate runner
Implements Section 3.1 protocol:
1. Runs pytest on the phase test suite
2. Appends result block to PHASE_STATUS.md
3. Returns exit code 0 if all tests pass
"""

import argparse
import subprocess
import sys
import time
from pathlib import Path

WORKSPACE_ROOT = Path("E:/GraphHacks/Jaal_PreMortem")
STATUS_FILE = WORKSPACE_ROOT / "PHASE_STATUS.md"

PHASE_NAMES = {
    1: "Phase 1 - Smoke Battery (Runtime Proof)",
    2: "Phase 2 - World in the Graph (Data Loader & Provenance)",
    3: "Phase 3 - Branch and Cascade (Scenario Isolation)",
    4: "Phase 4 - The Shared Evaluator (Access & Alert Metrics)",
    5: "Phase 5 - Conditional N-1 and Policies (Pre-Mortem Planner)",
    6: "Phase 6 - API and Four Typed Tools",
    7: "Phase 7 - UI Command Deck & Evidence",
    8: "Phase 8 - Benchmark Sweep & Ablations",
    9: "Phase 9 - Ship (Documentation, Verification & Packaging)"
}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--phase", type=int, required=True, help="Phase number 1-9")
    args = parser.parse_args()

    phase_num = args.phase
    phase_name = PHASE_NAMES.get(phase_num, f"Phase {phase_num}")
    test_dir = WORKSPACE_ROOT / "tests" / f"phase{phase_num}_*"
    
    # Resolve directory matching pattern
    matching_dirs = list(WORKSPACE_ROOT.glob(f"tests/phase{phase_num}_*"))
    if not matching_dirs:
        print(f"Error: No test directory found matching tests/phase{phase_num}_*")
        sys.exit(1)
    
    target_test_dir = matching_dirs[0]
    cmd = [sys.executable, "-m", "pytest", str(target_test_dir), "-q"]
    print(f"Running phase gate for {phase_name}: {' '.join(cmd)}")
    
    t0 = time.perf_counter()
    res = subprocess.run(cmd, capture_output=True, text=True)
    elapsed = time.perf_counter() - t0
    
    passed = (res.returncode == 0)
    output_lines = res.stdout.strip() if res.stdout else res.stderr.strip()
    
    status_str = "PASS" if passed else "FAILED"
    timestamp = time.strftime('%Y-%m-%dT%H:%M IST')
    
    block = f"""
## PHASE {phase_num} — {phase_name}
STATUS: {status_str}
AT: {timestamp}
RAN: pytest {target_test_dir.relative_to(WORKSPACE_ROOT)} -q
OUTPUT: {output_lines.splitlines()[-1] if output_lines else 'No output'}
ELAPSED: {elapsed:.2f}s
RECOVERY APPLIED: —
NEXT: {"PHASE " + str(phase_num + 1) if passed else "RETRY_OR_RECOVERY"}
"""
    
    # Append to PHASE_STATUS.md
    with open(STATUS_FILE, "a", encoding="utf-8") as f:
        f.write(block + "\n")
    
    print(f"Appended status block to {STATUS_FILE}")
    print(output_lines)
    
    if not passed:
        sys.exit(1)
    else:
        print(f"*** Phase {phase_num} Gate PASSED ***")

if __name__ == "__main__":
    main()
