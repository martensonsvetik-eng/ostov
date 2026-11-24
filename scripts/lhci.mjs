/**
 * Lighthouse CI runner: points LHCI at Playwright's Chromium (no separate Chrome install
 * needed) and runs the mobile config, then the desktop one. Thresholds live in
 * lighthouserc.json (mobile) and lighthouserc.desktop.json.
 * Usage: `npm run build && npm run lhci` (or `npm run lhci -- lighthouserc.json`).
 *
 * Browser: $CHROME_PATH if set, else Playwright's Chromium. If that binary cannot be
 * started (seen on some Windows setups: spawn UNKNOWN), Playwright's chrome-headless-shell
 * from the same install is used instead.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { chromium } from '@playwright/test';

const starts = (exe) => !spawnSync(exe, ['--version'], { stdio: 'ignore' }).error;

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const full = chromium.executablePath();
  if (starts(full)) return full;
  // …/ms-playwright/chromium-NNNN/chrome-<os>/chrome(.exe) → …/ms-playwright/chromium_headless_shell-NNNN/…
  const root = dirname(dirname(dirname(full)));
  for (const dir of readdirSync(root).filter((d) => d.startsWith('chromium_headless_shell-')).sort().reverse()) {
    for (const sub of readdirSync(join(root, dir))) {
      for (const name of ['chrome-headless-shell.exe', 'chrome-headless-shell']) {
        const exe = join(root, dir, sub, name);
        if (existsSync(exe) && starts(exe)) return exe;
      }
    }
  }
  throw new Error(`No startable Chromium found (tried ${full} and chrome-headless-shell in ${root})`);
}

const env = { ...process.env, CHROME_PATH: findChrome() };
console.log(`Chrome: ${env.CHROME_PATH}`);
const configs = process.argv.slice(2).length ? process.argv.slice(2) : ['lighthouserc.json', 'lighthouserc.desktop.json'];

let failed = false;
for (const config of configs) {
  console.log(`\n▶ lhci autorun --config=${config}`);
  const r = spawnSync('npx', ['lhci', 'autorun', `--config=${config}`], { stdio: 'inherit', env, shell: true });
  if (r.status !== 0) failed = true;
}
process.exit(failed ? 1 : 0);
