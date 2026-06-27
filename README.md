# Meaty Blog (Astro)

Astro + Markdown rebuild of the Meaty Blog. Scaffolded under **MEAT-9** with secret-leak and
supply-chain prevention baked in from the first commit.

## 🔧 Setup (fresh clone)

```sh
brew install gitleaks   # required — the pre-commit hook fails closed without it
fnm use                 # Node pinned via .nvmrc (or: nvm use)
corepack enable         # activates the pnpm version pinned in package.json
pnpm install            # also self-wires the gitleaks pre-commit hook via `prepare`
```

The `prepare` script runs `git config core.hooksPath .githooks` on install. If you skip
`pnpm install`, wire it manually with that same command.

## 🔒 Security guardrails

- **pnpm** (not npm): dependency lifecycle scripts are off by default; only `esbuild`/`sharp`
  are allowlisted in `pnpm-workspace.yaml` (`allowBuilds`). `minimumReleaseAge` enforces a 24h
  cooldown before any newly published version resolves.
- **Pre-commit secret scan**: `.githooks/pre-commit` runs `gitleaks` on staged changes and
  **fails closed** if gitleaks is missing.
- **CI** (`.github/workflows/ci.yml`): full-history gitleaks scan + frozen-lockfile build.
- **Never commit `.env`** — `.gitignore` covers `.env` and `.env.*`; use `.env.example` as the
  template. GitHub push protection + secret scanning are enabled on the remote.

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `pnpm install`             | Installs dependencies                            |
| `pnpm dev`             | Starts local dev server at `localhost:4321`      |
| `pnpm build`           | Build your production site to `./dist/`          |
| `pnpm preview`         | Preview your build locally, before deploying     |
| `pnpm astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `pnpm astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
