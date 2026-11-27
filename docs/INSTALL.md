# Installation and judge walkthrough

Status: not installable yet. The app ID and clean-site Jira install are pending Forge registration. Do not treat the placeholder judge flow below as a completed installation.

## Local verification

Use Node.js 22 and npm 10 (the versions used by CI). From the repository root, run npm ci, npm --prefix static/hello-world ci, npm run lint, npm run typecheck, npm test, and npm run build.

## Forge registration and validation

A developer with an Atlassian account and Jira Cloud test site must register the app. Authenticate with the Forge CLI, run forge register, then set the generated app ID in manifest.yml as instructed by Forge. Never invent or copy another installation's app ID. In CI, Forge CLI analytics is disabled and lint runs in non-interactive mode. Forge lint requires the registered app ID; until registration is completed, that check reports a missing-app-ID blocker.

After registration, run npm run forge:lint, deploy to a development environment, install on a clean Jira Cloud test site, and record the exact tested installation link and scope consent here before calling this app installable.

1. Open the judge installation link: [PENDING].
2. Choose a Jira Cloud test site and grant the documented Forge scopes: [PENDING manifest review].
3. Open Shiftwise in Jira: [PENDING actual module location].
4. Load synthetic demonstration data: [PENDING supported UI flow].
5. Set engine-maintenance minimum to three, assign four qualified workers, approve one absence, then attempt a second overlapping leave.
6. Observe deficit and overtime offer. Accept as a qualified previous-shift worker only when configured rest policy allows; manager confirms assignment and reevaluates leave.
7. Verify Jira coverage issue and audit trail: [PENDING integration].

Do not ask judges to enter personal employee data or developer tokens. Verify installation on a separate clean site, not only the development site.
