# Arrow Again Vercel launch handoff

Date: 2026-06-21

## Production target

- Vercel project: `arrow-again`
- Production domain: `https://arrow-again.top`
- Build command: `npm run build`
- Output directory: `dist`
- Public review URLs:
  - `https://arrow-again.top/app-home.html`
  - `https://arrow-again.top/privacy.html`
  - `https://arrow-again.top/terms.html`
  - `https://arrow-again.top/data-deletion.html`
  - `https://arrow-again.top/support.html`
  - `https://arrow-again.top/app-ads.txt`

## Local checks completed

```bash
npm run typecheck
npm run verify:levels
npm run verify:balance
npm run verify:platform
npm run verify:android:release
npm run e2e
npm run google:aab
```

Results:

- TypeScript passed.
- 100 levels are sequential, in bounds, unique, and solvable.
- Level balance gate passed.
- Platform manifest structure passed.
- Android release readiness passed with no blocking placeholder Android values.
- Browser E2E passed for home, gameplay, rewarded hint, rewarded revive, 100-level access, hard modal, and desktop smoke flow.
- Local Vite preview returned `200` for `/`, `/app-home.html`, `/privacy.html`, `/terms.html`, `/data-deletion.html`, and `/support.html`.
- Local Vite preview returned the expected AdMob publisher line from `/app-ads.txt`.
- Android release bundle build passed.

The full multi-platform release gate still intentionally blocks on Meta Instant Games placeholders and top-level `releaseStatus: "draft"`.

Current local Android bundle:

```text
Path: android/app/build/outputs/bundle/release/app-release.aab
SHA-256: 0153cc4e23f76e687c0b9719bd0a30b1aa58957328208b333194a3258b88c0a2
Signing status: unsigned because ANDROID_RELEASE_* upload-key environment variables are not set on this machine.
```

## Vercel repository prep completed

- Added `vercel.json` with the Vite build contract.
- Added `.vercelignore` so Vercel source uploads skip native projects, release bundles, docs, and local screenshots.
- Added `.vercel` to `.gitignore`.

## Current account and network blockers

- This machine has no local Vercel CLI auth state under `~/.vercel`.
- `npx vercel whoami` and `npx vercel link --yes --project arrow-again` could not complete because Node HTTPS requests to `https://vercel.com/.well-known/openid-configuration` fail with `ECONNRESET` before TLS setup. `curl` to the same URL succeeds, so this looks like a local Node/Vercel CLI networking issue rather than a Vercel service outage.
- The GitHub repo currently has no Vercel token secrets or variables, so GitHub Actions cannot deploy to Vercel without account-side setup.
- Authoritative Aliyun DNS currently reports no apex `A` record and no `www` CNAME for `arrow-again.top`.

## Required Vercel and Aliyun actions

In Vercel:

1. Open or create the `arrow-again` project.
2. Ensure the project uses:
   - Framework preset: Vite
   - Install command: `npm ci`
   - Build command: `npm run build`
   - Output directory: `dist`
3. Add `arrow-again.top` to the project domains.
4. Optional: add `www.arrow-again.top` and redirect it to the apex domain.

In Aliyun DNS:

```text
Type   Host  Value
A      @     76.76.21.21
CNAME  www   cname.vercel-dns-0.com
```

Use a modest TTL during setup, such as 10 minutes.

## Verification commands

```bash
dig +short NS arrow-again.top
dig +short A arrow-again.top
dig +short CNAME www.arrow-again.top
curl -I http://arrow-again.top/
curl -I https://arrow-again.top/
curl -I https://arrow-again.top/app-home.html
curl -I https://arrow-again.top/privacy.html
curl -I https://arrow-again.top/terms.html
curl -I https://arrow-again.top/data-deletion.html
curl -I https://arrow-again.top/support.html
curl -I https://arrow-again.top/app-ads.txt
```

Good DNS state:

- `A arrow-again.top` returns `76.76.21.21`.
- `CNAME www.arrow-again.top` returns `cname.vercel-dns-0.com`.
- HTTPS policy and support pages return `200` or a Vercel redirect followed by `200`.
- `https://arrow-again.top/app-ads.txt` returns the AdMob publisher line.

## Google Play follow-up

After `app-ads.txt` is publicly reachable, complete AdMob app-ads.txt verification and then continue the Play Console closed-test submission checklist in `docs/release-data/google-play-submission.md`.
