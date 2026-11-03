# Titan News: how to add a post

All posts live in **`news/posts.js`** (`window.TITAN_POSTS`, **newest first**). The main page shows the latest 4 headlines, `news/` lists them all, and each article page renders from the same data.

1. **Add data:** copy the first object in `posts.js` and paste it at the top. Set:
   - `slug` (e.g. `paroi-national-age-2026`) and `date` `{en, bm}`
   - `en` / `bm`: `tag`, `title`, `teaser` (one line), `intro` (may contain `<b>`), `outro`, `cta`
   - Optional: `kl` (medal chips: `{gold,silver,bronze,pb}`) with `klTitle`, `klIntro`, `chips`, `klList` [[name, text]]; and `tm`, `tmTitle`, `tmIntro`, `soon` (team list + "results coming soon" note). Delete any optional block you don't need, in both `en` and `bm`.
2. **Create the page:** copy `news/_template/` to `news/<slug>/` and in its `index.html` replace `SLUG`, `POST TITLE` and `ONE-SENTENCE DESCRIPTION` (these are for search engines and social share previews).
3. Never publish raw `[PLACEHOLDER]` brackets. Leave the field out or use `soon`.
4. Preview with `python3 -m http.server` in `titan-fins/`, then copy `index.html`, `news/` and `assets/` to the repo's `titan/` folder and push.

Language: `?lang=bm` or the EN/BM toggle (remembered in localStorage).
