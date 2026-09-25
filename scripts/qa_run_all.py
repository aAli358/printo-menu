"""Run full E-Menu QA suite and print summary."""
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PYTHON = os.environ.get(
    'PYTHON',
    r'C:\Users\a\.codegeex\mamba\envs\codegeex-agent\python.exe',
)
NODE = os.environ.get('NODE', 'node')


def run(label, cmd, cwd=ROOT):
    print(f'\n{"=" * 60}\n  {label}\n{"=" * 60}\n')
    shell = os.name == 'nt' and cmd[0] in ('npm', 'node')
    r = subprocess.run(cmd, cwd=cwd, env={**os.environ, 'PYTHONIOENCODING': 'utf-8'}, shell=shell)
    ok = r.returncode == 0
    print(f'\n>>> {label}: {"PASS" if ok else "FAIL"}\n')
    return ok


def main():
    checks = [
        ('Django unit tests', [PYTHON, 'manage.py', 'test', 'menu.tests', '--verbosity=1']),
        ('API smoke tests', [PYTHON, 'scripts/qa_api_smoke.py']),
        ('Theme API tests', [PYTHON, 'scripts/qa_themes.py']),
        ('Frontend HTTP QA', [PYTHON, 'scripts/qa_frontend.py']),
        ('Browser theme QA', [NODE, 'scripts/qa_browser_themes.mjs']),
        ('Frontend build', ['npm', 'run', 'build'], os.path.join(ROOT, 'frontend')),
    ]

    results = []
    for item in checks:
        label, cmd = item[0], item[1]
        cwd = item[2] if len(item) > 2 else ROOT
        results.append((label, run(label, cmd, cwd)))

    print('\n' + '=' * 60)
    print('  COMPREHENSIVE QA SUMMARY')
    print('=' * 60 + '\n')
    passed = sum(1 for _, ok in results if ok)
    for label, ok in results:
        print(f'  {"PASS" if ok else "FAIL"}  {label}')
    print(f'\n  Total: {passed}/{len(results)} suites passed\n')
    sys.exit(0 if passed == len(results) else 1)


if __name__ == '__main__':
    main()
