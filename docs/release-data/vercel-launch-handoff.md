# Arrow Again Vercel launch handoff

Date: 2026-07-22

## Production target

- Vercel project: `arrow-again`
- Vercel scope: `bittap-tech`
- Production domain: `https://arrow-again.top`
- Last inspected Vercel production URL: `https://arrow-again-b8j44nh44-bittap-tech.vercel.app`
- Stable Vercel alias: `https://arrow-again.vercel.app`
- Connected Git repository: `github.com/JNYoung/arrow-gpt`
- Production branch: `main`
- Last inspected deployment ID: `dpl_5HNKu9iKRiRow2spBMnJiHDJqNiC`
- Deployment status: `READY`
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
- Vercel production returned `200` for `/`, `/app-home.html`, `/privacy.html`, `/terms.html`, `/data-deletion.html`, `/support.html`, and `/app-ads.txt` at `https://arrow-again.vercel.app`.
- Android release bundle build passed.
- In-app Settings now exposes Privacy Policy, Terms, Data Deletion, and Support links for Play review paths.

The full multi-platform release gate still intentionally blocks on Meta Instant Games placeholders and top-level `releaseStatus: "draft"`.

Current local Android bundle:

```text
Path: android/app/build/outputs/bundle/release/app-release.aab
SHA-256: 76fd94a7a1b02453e76e76d3ce5ff9275967697e94cf63750bc2e450695f5c5c
Signing status: signed with the local Android upload key from android/release-signing.env.
Google Play production: 1.0.4 (6), target API 36, completed.
```

## Vercel repository prep completed

- Added `vercel.json` with the Vite build contract.
- Added `.vercelignore` so Vercel source uploads skip native projects, release bundles, docs, and local screenshots.
- Added `.vercel` to `.gitignore`.

## Vercel deployment completed

- Vercel CLI works on this machine when Node is launched with `--use-env-proxy` and the proxy environment variables use `http://127.0.0.1:7890` instead of `socks5h://127.0.0.1:7890`.
- `bittap-tech/arrow-again` was created and linked from a clean `origin/main` worktree.
- Production deploy succeeded and aliased `https://arrow-again.vercel.app`.
- Latest production deploy has `https://arrow-again.top` and `https://www.arrow-again.top` aliases assigned in Vercel.
- `arrow-again.top` and `www.arrow-again.top` were added to the Vercel project.
- Vercel project-domain API returns `verified: true` for both custom domains.
- On 2026-07-14, Vercel domain config returned `configuredBy: A`, `misconfigured: false`, and accepted the `http-01` certificate challenge.
- The Vercel GitHub App now has selected-repository access to `JNYoung/arrow-gpt`, and `vercel git connect https://github.com/JNYoung/arrow-gpt --scope bittap-tech --yes` returned `Connected`.
- Vercel project API confirms `arrow-again` is linked to GitHub repository `JNYoung/arrow-gpt` with production branch `main`.
- Aliyun OpenAPI credentials on this machine were used to configure and verify the required DNS records.

## Aliyun DNS completed

The following records were created on 2026-07-14 with TTL 600 seconds:

```text
Type   Host  Value
A      @     76.76.21.21
A      www   76.76.21.21
```

Verification state immediately after the change:

- Aliyun authoritative DNS returned `76.76.21.21` for both names.
- Public DNS returned `76.76.21.21` for both names.
- `http://arrow-again.top/` returned HTTP 200.
- Vercel no longer reports a domain configuration warning.
- A Vercel certificate for `arrow-again.top` and `www.arrow-again.top` was issued successfully and is configured for automatic renewal.
- HTTPS returned 200 for `/`, `/app-home.html`, `/privacy.html`, `/terms.html`, `/support.html`, `/data-deletion.html`, and `/app-ads.txt`.
- `app-ads.txt` returned `google.com, pub-2481288993515154, DIRECT, f08c47fec0942fa0`.

## Verification commands

```bash
dig +short NS arrow-again.top
dig +short A arrow-again.top
dig +short A www.arrow-again.top
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

- `A arrow-again.top` returns Vercel IPs.
- `CNAME www.arrow-again.top` returns the Vercel DNS hostname, or `A www.arrow-again.top` returns Vercel IPs if configured with A records instead.
- HTTPS policy and support pages return `200` or a Vercel redirect followed by `200`.
- `https://arrow-again.top/app-ads.txt` returns the AdMob publisher line.

## Google Play follow-up

Complete AdMob app-ads.txt verification in the AdMob console and submit the Play Console production-access application in `docs/release-data/google-play-submission.md`.
