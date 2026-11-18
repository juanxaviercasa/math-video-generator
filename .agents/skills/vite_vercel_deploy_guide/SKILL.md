---
name: vite-vercel-deploy-guide
description: >-
  Deployment copilot for Vite and Vercel. Analyzes .env and .gitignore to prevent secrets leakage, guides environment variable setup in Vercel, and auto-fixes Hobby tier deployment blocks using empty commits.
---

# Vite & Vercel Production Deployment Guide

## Overview
This skill ensures a zero-trust approach when deploying Vite + React applications to Vercel. It prevents accidentally pushing `.env.local` to public or private repos, correctly manages Vercel environment variables, and bypasses Vercel Hobby tier collaboration blocks.

## Dependencies
None.

## Quick Start
When the user wants to deploy a Vite app to Vercel, run the pre-deploy check:
\`\`\`bash
node .agents/skills/vite_vercel_deploy_guide/scripts/pre_deploy_check.js --output .deploy_report.json
\`\`\`

## Utility Scripts
### `pre_deploy_check.js`
Scans local configuration to prevent secret leaks.
- `--env-file`: The environment file (default: `.env.local`)
- `--gitignore`: The gitignore file (default: `.gitignore`)
- `--output`: Output JSON report path (default: `.deploy_report.json`)

Example:
\`\`\`bash
node .agents/skills/vite_vercel_deploy_guide/scripts/pre_deploy_check.js --output .deploy_report.json
\`\`\`

## Workflow
1. **Pre-flight Check:** Run `pre_deploy_check.js`. Read the JSON output using `cat .deploy_report.json` (or your platform's file reader).
2. **Auto-Correction:** If the report fails because `.env.local` is not in `.gitignore`, **you must automatically append it** using a file write tool before doing any `git push`. DO NOT ask the user to do it; you must do it.
3. **Vercel Env Vars Setup:** Advise the user to copy their `.env.local` values to Vercel's "Environment Variables" section. If any keys start with `VITE_`, explicitly instruct the user to change the type from "Secreto" to "Configuración" in Vercel to dismiss warnings.
4. **Push:** Commit and push the code to GitHub (`main` branch).
5. **Auto-Unblocker (Empty Commit):** If the user mentions Vercel blocked the deployment ("Obstruido", "Hobby plan", etc.) due to a team collaboration error on a private repo, you must:
   a) Ask them to make the repo Public in GitHub if they want permanent auto-deploys.
   b) Automatically execute `git commit --allow-empty -m "chore: force redeploy"` and `git push` to trigger an immediate, unblocked deployment.

## Rate Limiting
Not applicable (local execution only).

## Common Mistakes
- Pushing `.env.local` to GitHub. The script catches this and you must fix it.
- Not knowing that `VITE_CLERK_SECRET_KEY` shouldn't be exposed. The script warns about `VITE_` + `SECRET`.
- Getting stuck on Vercel's "Equipo/Hobby" block. The empty commit solves it.
