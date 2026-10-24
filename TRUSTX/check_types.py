#!/usr/bin/env python
import subprocess
import sys

result = subprocess.run(
    [sys.executable, '-c', 'import os; os.chdir("C:/Users/tejas/OneDrive/Desktop/TRUSTX/ui"); exec("node_modules/.bin/tsc --noEmit")'],
    capture_output=True,
    text=True,
    timeout=120
)
print("STDOUT:", result.stdout)
print("STDERR:", result.stderr)
print("Return code:", result.returncode)