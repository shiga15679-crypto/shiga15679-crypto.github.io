# Common developer site template

This folder is a self-contained GitHub Pages user site. Upload the **contents of this folder** to a new public repository named exactly `shiga15679-crypto.github.io`. GitHub Pages will then publish the root `app-ads.txt` at the address AdMob needs.

This template is intentionally separate from the current `ura-click-support` project site. Publishing it does not remove the existing support URL:

`https://shiga15679-crypto.github.io/ura-click-support/ura-click/support/`

## Ura Click authorization record

The included root file [`app-ads.txt`](./app-ads.txt) contains exactly this Ura Click record:

```text
google.com, pub-3567457461509987, DIRECT, f08c47fec0942fa0
```

It is UTF-8 plain text without a BOM or HTML. Do not move it into `apps/` or another subdirectory: AdMob must be able to request `/app-ads.txt` from the developer-site domain root.

## Publish through the GitHub website

1. Sign in to GitHub and select **New repository**.
2. Set the repository name to `shiga15679-crypto.github.io` exactly, and choose **Public**.
3. Create the repository. Use **Add file** → **Upload files** and upload everything *inside* this `developer-site-template` folder. The repository root must directly contain `index.html`, `styles.css`, `app-ads.txt`, `apps/`, and `scripts/`.
4. Open **Settings** → **Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Choose branch **main**, folder **/(root)**, then select **Save**.
7. Wait for the Pages deployment to complete. Confirm both URLs in a browser:
   - <https://shiga15679-crypto.github.io/>
   - <https://shiga15679-crypto.github.io/app-ads.txt>
8. The second URL must show only the one Ura Click line above, not an HTML page or a 404 page.
9. In AdMob, open the Ura Click app and select **アップデートを確認** (often displayed in English as **Check for updates**). Then wait for AdMob's app and `app-ads.txt` verification to finish.

Before publishing, replace `your-email@example.com` in the Ura Click support and privacy pages with a monitored support address. Add the published App Store link where the pages indicate it is pending.

## Publish with Git

Run these commands from this folder after creating the empty GitHub repository. They do not alter the Ura Click app repository.

```powershell
cd developer-site-template
git init
git branch -M main
git add .
git commit -m "Publish developer site"
git remote add origin https://github.com/shiga15679-crypto/shiga15679-crypto.github.io.git
git push -u origin main
```

Then enable Pages with steps 4–6 above.

## Validate before and after publication

```powershell
node scripts/validate-app-ads.mjs
node scripts/validate-site-links.mjs
node scripts/validate-app-ads.mjs --url https://shiga15679-crypto.github.io/app-ads.txt
```

The first two commands are local checks and do not require network access. The last command intentionally fetches the public URL; run it after GitHub Pages is live. It reports a network failure clearly if the environment cannot make the request.

## Safe migration plan

For this AdMob incident, use the new site only for the root `app-ads.txt` and developer homepage. Keep the already registered App Store support URL unchanged. This is the safest and fastest path because the existing project-site URL remains reachable and no App Store metadata update is required for publishing the root authorization file.

In a future App Store update, you may change support and privacy links to:

- <https://shiga15679-crypto.github.io/apps/ura-click/support/>
- <https://shiga15679-crypto.github.io/apps/ura-click/privacy/>

Keep the old project site available after that change as well. Do not disable an App Store URL before its replacement has been reviewed and published.

## Use for future apps

Copy an HTML file from `templates/`, create `apps/<app-slug>/support/` and `apps/<app-slug>/privacy/`, then list the app on the root page. The generic [`templates/app-ads.template.txt`](./templates/app-ads.template.txt) deliberately uses placeholders; verify each publisher ID and authority ID with AdMob before replacing it.
