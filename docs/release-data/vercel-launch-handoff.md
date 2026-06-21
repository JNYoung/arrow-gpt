# Arrow Again Vercel launch handoff

Date: 2026-06-21

## Production target

- Vercel project: `arrow-again`
- Vercel scope: `bittap-tech`
- Production domain: `https://arrow-again.top`
- Current Vercel production URL: `https://arrow-again-5hgxhry22-bittap-tech.vercel.app`
- Stable Vercel alias: `https://arrow-again.vercel.app`
- Connected Git repository: `github.com/JNYoung/arrow-gpt`
- Production branch: `main`
- Deployment ID: `dpl_GPpsRWiRrbAgr96EPzZTtYLU9vas`
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
SHA-256: 025ada338d618700bd17ea9e8e3cf37a7a868fc58dd009e072756f16c0c6d861
Signing status: signed with the local Android upload key from android/release-signing.env.
```

## Vercel repository prep completed

- Added `vercel.json` with the Vite build contract.
- Added `.vercelignore` so Vercel source uploads skip native projects, release bundles, docs, and local screenshots.
- Added `.vercel` to `.gitignore`.

## Vercel deployment completed

- Vercel CLI works on this machine when Node is launched with `--use-env-proxy` and the proxy environment variables use `http://127.0.0.1:7890` instead of `socks5h://127.0.0.1:7890`.
- `bittap-tech/arrow-again` was created and linked from a clean `origin/main` worktree.
- Production deploy succeeded and aliased `https://arrow-again.vercel.app`.
- Latest production deploy also has `https://arrow-again.top` and `https://www.arrow-again.top` aliases assigned in Vercel, pending DNS propagation.
- `arrow-again.top` and `www.arrow-again.top` were added to the Vercel project.
- Vercel project-domain API returns `verified: true` for both custom domains.
- Vercel domain config API still returns `misconfigured: true` because Aliyun DNS has not been pointed at Vercel yet.
- The Vercel GitHub App now has selected-repository access to `JNYoung/arrow-gpt`, and `vercel git connect https://github.com/JNYoung/arrow-gpt --scope bittap-tech --yes` returned `Connected`.
- Vercel project API confirms `arrow-again` is linked to GitHub repository `JNYoung/arrow-gpt` with production branch `main`.
- Chrome automation could open the Aliyun domain console, but DOM/screenshot/control reads timed out repeatedly on that page. DNS still needs account-side console action or Aliyun OpenAPI credentials.

## Required Aliyun DNS action

Vercel currently reports these preferred records:

```text
Type   Host  Value
A      @     216.198.79.1
A      @     64.29.17.1
CNAME  www   6992862d34f9e821.vercel-dns-017.com
```

Vercel also lists these fallback values:

```text
Type   Host  Value
A      @     76.76.21.21
CNAME  www   cname.vercel-dns-0.com
```

Use a modest TTL during setup, such as 10 minutes. After DNS propagation, Vercel should move the domain config from `misconfigured: true` to `misconfigured: false`.

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

- `A arrow-again.top` returns Vercel IPs.
- `CNAME www.arrow-again.top` returns the Vercel DNS hostname, or `A www.arrow-again.top` returns Vercel IPs if configured with A records instead.
- HTTPS policy and support pages return `200` or a Vercel redirect followed by `200`.
- `https://arrow-again.top/app-ads.txt` returns the AdMob publisher line.

## Google Play follow-up

After `app-ads.txt` is publicly reachable, complete AdMob app-ads.txt verification and then continue the Play Console closed-test submission checklist in `docs/release-data/google-play-submission.md`.
