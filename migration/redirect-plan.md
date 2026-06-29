# Canonical slug map + 301 redirect plan (MEAT-14 / B3)

The canonical old→new **301** redirect plan for the Gatsby/Contentful → Astro
migration. The machine-readable map is **`redirect-map.json`** (this directory);
this doc is the human spec + the **verified** Firebase Hosting config form, and
the hand-off to **F2 / MEAT-34** (which adds the `redirects` to `firebase.json`).

B3 produces the plan; it does **not** change `firebase.json` — that's F2.

## Scope

- Only the **5 renamed** `/posts/*` slugs need redirects.
- `setup-pivpn-wireguard-raspberry-pi` was authored clean (slug == old path) and
  needs **no** redirect.
- Legacy had **no sitemap**, and the only indexed content was the 6 posts, so
  there are no other paths to map. Root and all non-post routes are unchanged.

The 6 canonical slugs are already locked as the `slug:` frontmatter on the synced
posts; B3 confirms them, it does not change them (AC bullet 1).

## The map (5 × 301)

| From (legacy path, decoded)                            | To (canonical)                              |
| ------------------------------------------------------ | ------------------------------------------- |
| `/posts/Burn Your Self Help Books Before They Burn You`| `/posts/burn-your-self-help-books/`         |
| `/posts/Friends Suck and Making them is Worse`         | `/posts/friends-suck-and-making-them-is-worse/` |
| `/posts/Revenge Bedtime Procrastination`               | `/posts/revenge-bedtime-procrastination/`   |
| `/posts/Don't Follow Your Dreams`                      | `/posts/dont-follow-your-dreams/`           |
| `/posts/The Four Hour Workday Is Misguided`            | `/posts/four-hour-workday-is-misguided/`    |

Destinations use the **trailing-slash** canonical form to match
`firebase.json` → `trailingSlash: true`.

## Decisions

1. **Type 301** (permanent) for SEO link-equity transfer (AC bullet 3).
2. **Destinations are trailing-slash** (`/posts/<slug>/`) — matches the live
   `trailingSlash: true` config; the canonical pages are emitted at
   `dist/posts/<slug>/index.html`.
3. **Match form: literal `source` glob with raw (decoded) characters** — see the
   verification below for why this beats a `%20`-encoded source or a `regex`.
4. **Case-sensitive**, matching the exact indexed casing. Case-insensitive
   matching is deliberately out (keeps rules tight, avoids over-matching);
   revisit only if Search Console shows mixed-case hits.
5. **Encoding / apostrophe / trailing slash** are all absorbed by the chosen form
   (verified): `%20` vs literal space, `'` vs `%27`, and old paths with **or**
   without a trailing slash.

## Verified Firebase config form (the empirical result)

The open Phase-2 question was glob-vs-regex and how Firebase matches encoded
paths. Resolved empirically against the **Firebase Hosting emulator**
(`firebase-tools` superstatic) serving the real built `dist/`.

**Finding: superstatic decodes the request path before matching.** So:

- A `source` written with **raw spaces** (`/posts/Burn Your Self Help Books …`)
  matches incoming `…/Burn%20Your%20Self%20Help%20Books…` → **301**. ✅
- A `source` written with literal `%20` does **not** match (→ 404). ❌ — do not
  percent-encode the `source`.
- Because both `'` and `%27` decode to `'`, a literal `'` in the `source` matches
  **both** apostrophe forms. ✅
- The glob `source` (written without a trailing slash) matches the incoming path
  **with or without** a trailing slash. ✅

So no `regex` is needed — a plain literal glob covers every variant. This is the
array **F2 should paste into `firebase.json` → `hosting.redirects`**:

```json
"redirects": [
  { "source": "/posts/Burn Your Self Help Books Before They Burn You", "destination": "/posts/burn-your-self-help-books/", "type": 301 },
  { "source": "/posts/Friends Suck and Making them is Worse", "destination": "/posts/friends-suck-and-making-them-is-worse/", "type": 301 },
  { "source": "/posts/Revenge Bedtime Procrastination", "destination": "/posts/revenge-bedtime-procrastination/", "type": 301 },
  { "source": "/posts/Don't Follow Your Dreams", "destination": "/posts/dont-follow-your-dreams/", "type": 301 },
  { "source": "/posts/The Four Hour Workday Is Misguided", "destination": "/posts/four-hour-workday-is-misguided/", "type": 301 }
]
```

> **Fallback (only if a live preview channel disagrees with the emulator):** swap
> any failing rule for a `regex` form, e.g.
> `{ "regex": "^/posts/Don't[ ]Follow[ ]Your[ ]Dreams/?$", "destination": "/posts/dont-follow-your-dreams/", "type": 301 }`.
> The `regex` form was also verified to match `%20`, both apostrophe forms, and
> optional trailing slash. Document any residual gaps rather than silently
> dropping a variant.

## Verification results

Emulator: `firebase-tools emulators:start --only hosting` over the built `dist/`
with the array above. Every legacy URL was requested in its real wire-encoded
form (no redirect-follow first, then followed):

| Request (encoded)                                            | Immediate | Followed       |
| ------------------------------------------------------------ | --------- | -------------- |
| `/posts/Burn%20Your%20Self%20Help%20Books%20Before%20They%20Burn%20You` | 301 → `/posts/burn-your-self-help-books/` | 200, 1 hop |
| …same **with** trailing slash                                | 301 → same | 200, 1 hop    |
| `/posts/Friends%20Suck%20and%20Making%20them%20is%20Worse`   | 301 → `/posts/friends-suck-and-making-them-is-worse/` | 200, 1 hop |
| `/posts/Revenge%20Bedtime%20Procrastination`                 | 301 → `/posts/revenge-bedtime-procrastination/` | 200, 1 hop |
| `/posts/Don't%20Follow%20Your%20Dreams` (literal `'`)        | 301 → `/posts/dont-follow-your-dreams/` | 200, 1 hop |
| `/posts/Don%27t%20Follow%20Your%20Dreams` (`%27`)            | 301 → `/posts/dont-follow-your-dreams/` | 200, 1 hop |
| `/posts/The%20Four%20Hour%20Workday%20Is%20Misguided`        | 301 → `/posts/four-hour-workday-is-misguided/` | 200, 1 hop |

Controls (all as expected):

- `/posts/setup-pivpn-wireguard-raspberry-pi/` → **200, 0 hops** (unchanged, not
  redirected).
- Each canonical destination requested directly → **200, 0 hops** (terminal — no
  redirect chain or loop; old→new is a single hop).
- An unmapped `/posts/Some%20Random%20Old%20Path` → **404** (no over-matching).

> Emulator gotcha for whoever re-runs this: superstatic only serves files when
> `public` is **relative** to the project dir. Point `public: "dist"` with `dist`
> beside `firebase.json` (symlink is fine); an absolute `public` path makes the
> redirect rules fire but 404s every static file.

## Hand-off to F2 / MEAT-34

1. Paste the `redirects` array above into `firebase.json` → `hosting` (keep the
   existing `public`/`cleanUrls`/`trailingSlash` keys).
2. Deploy to a **Hosting preview channel** (not prod) and re-verify against the
   live edge — production path normalization is a close but not identical proxy
   for the emulator:

   ```bash
   # one example; repeat per legacy URL
   curl -sI "https://<preview-channel-url>/posts/Don%27t%20Follow%20Your%20Dreams" | grep -iE "^HTTP|^location"
   # expect: HTTP/2 301  +  location: /posts/dont-follow-your-dreams/
   ```
3. Confirm every legacy URL returns `301` → the canonical `/posts/<slug>/` and
   that the destination then returns `200` (single hop). Promote the channel only
   once all 5 pass.

The `meaty.blog` custom-domain DNS cutover (F3 / MEAT-35) is independent; these
redirects are origin-relative and work on `meatyblog.web.app` and the final
domain alike.
