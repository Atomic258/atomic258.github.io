# Javelin Vendor Flip

An Old School RuneScape style shop calculator for world-hopping adamant and rune
javelin runs. It tells you how many javelins to sell to the vendor on one world
before hopping, and the total gold you will make from a full run.

## What is in here

- `index.html` - the whole site (HTML, CSS and JavaScript in one file, no build step)
- `runescape_uf.ttf` - the RuneScape font (you add this file; see Fonts below)
- `README.md` - this file

## Fonts

The site font is **`runescape_uf.ttf`** - your RuneScape bitmap font. Drop the
file in beside `index.html`, keeping the exact name `runescape_uf.ttf`, and the
page picks it up automatically through `@font-face` (same origin, no build
step). It is used for everything: headings, labels, body text, inputs and all
the numbers.

If the font file is missing or fails to load, the page falls back automatically
to two open-source Google Fonts (both SIL Open Font License):

- **Silkscreen** - pixel fallback for headings, labels, buttons and badges
- **Space Mono** - fallback for body text, inputs and numbers

The page also disables synthetic bold (`font-synthesis: none`) so the bitmap
font stays crisp instead of being smeared into a fake bold.

Note: `runescape_uf.ttf` is a fan-made recreation of the RuneScape font, so it
is Jagex's intellectual property rather than an open licence. Fine for a
personal project, but if you would rather not host it publicly, just leave it
out - the fallback fonts keep the site working.

## If the font does not show up

GitHub Pages only redeploys when the branch changes, so an upload that does not
change `index.html` can leave the old site live. If the page still looks the
same after adding the font:

1. Check the build first: repository **Actions** tab, then the **pages build
   and deployment** run. If it is red, the old site keeps being served until the
   build passes - re-run it, or read the error log.
2. Nudge a rebuild: upload `index.html` again (Add files > Upload files >
   Commit changes). Any commit to `main` triggers a fresh deploy.
3. Wait one or two minutes, then hard-refresh so the browser drops its cached
   copy - `Ctrl+Shift+R` on Windows, `Cmd+Shift+R` on Mac.

To confirm the font is really loading, press `F12` for DevTools, open the
**Network** tab, filter for `ttf`, and reload the page: `runescape_uf.ttf`
should come back with status `200`. A `404` there means the font file is not
sitting next to `index.html` in the published root.

## Run it locally

Double-click `index.html`, or open it in any browser. Nothing to install.

## Publish it with GitHub Pages

1. Create a new repository on GitHub (for example `javelin-vendor-flip`).
2. Upload `index.html` and `runescape_uf.ttf` to the root of the repository (or
   copy and paste `index.html` into a new file of the same name on GitHub).
   Keep the font file name exactly `runescape_uf.ttf`.
3. Open the repository **Settings** tab, then **Pages** in the left sidebar.
4. Under **Build and deployment**, set Source to **Deploy from a branch**.
5. Choose the `main` branch and the `/(root)` folder, then click **Save**.
6. Wait a minute or two. Your site will be live at:

   `https://<your-username>.github.io/javelin-vendor-flip/`

## How the maths works

The shop pays `floor(base * (0.60 - 0.001 * i))` for the i-th javelin sold on a
world (i starts at 0), where base is 160 gp for adamant javelins and 400 gp for
rune javelins. Prices are floored to whole coins. Hopping worlds resets the
index back to zero.

You can change the price drop per item, the seconds per world hop and the
seconds per sell-X action (50 javelins per click) in the assumptions panel on
the page.

Shop values: sells at 100%, buys at 60%, stock 500, change per 0.1% of base
value per item sold. Default buy-in prices (57 gp adamant, 135 gp rune) are
listed GE prices - Grand Exchange prices move constantly, so enter what you
actually paid.

Unofficial fan project. Not affiliated with Jagex Ltd.
