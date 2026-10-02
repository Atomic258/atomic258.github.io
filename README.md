# Javelin Vendor Flip

An Old School RuneScape style shop calculator for world-hopping adamant and rune
javelin runs. It tells you how many javelins to sell to the vendor on one world
before hopping, and the total gold you will make from a full run.

## What is in here

- `index.html` - the whole site (HTML, CSS and JavaScript in one file, no build step)
- `README.md` - this file

## Run it locally

Double-click `index.html`, or open it in any browser. Nothing to install.

## Publish it with GitHub Pages

1. Create a new repository on GitHub (for example `javelin-vendor-flip`).
2. Upload `index.html` to the root of the repository (or copy and paste the file
   contents into a new `index.html` on GitHub).
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
