# Release Process & Store Submissions

This document outlines the complete process for cutting releases, configuring GitHub secrets, and publishing extensions to web stores via GitHub Actions.

---

## 1. Required GitHub Secrets

The release workflow ([`.github/workflows/release.yml`](../../.github/workflows/release.yml)) performs two main tasks:

1. Creates a **GitHub Release** and attaches packaged `.zip` artifacts (`chrome`, `firefox`, `edge`).
2. Submits extension packages to **Chrome Web Store**, **Firefox Add-ons (AMO)**, and **Microsoft Edge Add-ons** using `wxt submit`.

### A. GitHub Release Only (No Store Submission)

- **No repository secrets are required.**
- GitHub Actions uses the built-in `GITHUB_TOKEN` (`GH_TOKEN: ${{ github.token }}`).
- **Required Repository Setting**:
  - In **Settings > Actions > General > Workflow permissions**, select **"Read and write permissions"** and click **Save**.
- If store secrets are omitted, the workflow automatically skips store uploads without failing the build.

### B. Automated Web Store Submissions

To enable automated store submissions, add the following secrets under **Settings > Secrets and variables > Actions > Repository secrets** (click **New repository secret**):

| Store                | Secret Name                           | Description / Source                                                          |
| :------------------- | :------------------------------------ | :---------------------------------------------------------------------------- |
| **Chrome Web Store** | `CHROME_EXTENSION_ID`                 | Extension ID from the Chrome Web Store Developer Dashboard.                   |
|                      | `CHROME_PUBLISHER_ID`                 | Publisher ID from the Developer Dashboard URL (`/devconsole/<publisher-id>`). |
|                      | `CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL` | Service Account email address (`client_email` from Google Cloud JSON key).    |
|                      | `CHROME_SERVICE_ACCOUNT_PRIVATE_KEY`  | Service Account private key (`private_key` from Google Cloud JSON key).       |
| **Firefox AMO**      | `FIREFOX_EXTENSION_ID`                | Extension UUID/ID registered on Firefox Add-on Developer Hub.                 |
|                      | `FIREFOX_JWT_ISSUER`                  | JWT Issuer (API Key) from AMO API Credentials.                                |
|                      | `FIREFOX_JWT_SECRET`                  | JWT Secret from AMO API Credentials.                                          |
| **Edge Add-ons**     | `EDGE_PRODUCT_ID`                     | Product ID from Microsoft Partner Center dashboard.                           |
|                      | `EDGE_CLIENT_ID`                      | Azure AD / Partner Center Client ID.                                          |
|                      | `EDGE_API_KEY`                        | Partner Center API Key / Client Secret.                                       |

> [!TIP]
> You can generate all of these store credentials locally by running:
>
> ```bash
> pnpm wxt submit init
> ```
>
> This creates a local `.env.submit` file (ignored by Git) containing all values ready to be copied into GitHub Repository Secrets.

#### Chrome Web Store API v2 Note (Service Account)

The Chrome Web Store submission uses API v2 via a Google Cloud Service Account instead of legacy OAuth user credentials:

1. Enable the **Chrome Web Store API** on your project in Google Cloud Console.
2. In **IAM & Admin > Service Accounts**, create a service account and download a **JSON** key.
3. In the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole), go to **Settings** (or **Paramètres**) > **Service accounts** and add your service account's email address.
4. Service accounts do not expire and require no OAuth consent screen approval or brand verification.

---

## 2. Step-by-Step Release Workflow

### Step 1: Bump Version in `package.json`

Update the `"version"` field in [`package.json`](../../package.json) to the target version (e.g., `1.11.0`):

```json
"version": "1.11.0",
```

### Step 2: Update `CHANGELOG.md`

The release workflow uses an inline Python script to extract release notes matching the target version:
`pattern = rf'## \[?{re.escape(version)}\]?[^\n]*\n(.*?)(?=\n## |\Z)'`

1. Open [`CHANGELOG.md`](../../CHANGELOG.md).
2. Replace `## [Unreleased]` with the version and release date (ISO `YYYY-MM-DD`):
   ```markdown
   ## [1.11.0] - 2026-09-20
   ```
3. Add a fresh, empty `## [Unreleased]` section above it for subsequent work:
   ```markdown
   ## [Unreleased]

   ## [1.11.0] - 2026-09-20
   ```

### Step 3: Local Verification

Run the verification suite locally before committing:

```bash
pnpm test
pnpm lint
pnpm compile
pnpm format:check
```

### Step 4: Commit and Push to `main`

Commit the version bump and updated changelog:

```bash
git add package.json CHANGELOG.md
git commit -m "chore(release): bump version to 1.11.0"
git push origin main
```

### Step 5: (Optional) Test via Dry-Run

Verify the build and packaging pipeline without publishing:

1. Go to the **Actions** tab on GitHub.
2. Select **Release & Submit for Review**.
3. Click **Run workflow**, ensure `dryRun` is set to `true`, and trigger the workflow.
4. Review the generated release notes and verify that all zip archives compile cleanly.

### Step 6: Tag and Trigger the Release

Create and push the version tag to initiate the production release:

```bash
git tag v1.11.0
git push origin v1.11.0
```

### Step 7: Pipeline Execution

Pushing the `v*` tag triggers [`.github/workflows/release.yml`](../../.github/workflows/release.yml):

1. **Validation**: Executes linting, tests, and multi-browser type checks via `validate.yml`.
2. **Packaging**: Builds and archives packages (`.output/*-chrome.zip`, `.output/*-firefox.zip`, `.output/*-edge.zip`).
3. **Release Notes**: Automatically extracts section `## [1.11.0]` from `CHANGELOG.md` and appends a comparative commit diff link.
4. **GitHub Release**: Publishes release `v1.11.0` with the zip packages attached.
5. **Store Submissions**: Submits the packages to Chrome, Firefox, and Edge if credentials exist in GitHub Secrets.
