# Brett Hickman — portfolio

The redesign has a name, three icon actions, one prompt, and 24 tangible objects. Relevant objects rise when someone asks about Brett’s work, projects, or interests. Each opens into an authored story; the Index offers direct access to the full collection.

The original HTML, assets, and résumé remain unchanged at the repository root. The redesign lives in `next/`. Deployment keeps the original site as the homepage and publishes the redesign at an unlinked preview path.

## Run locally

Use Node.js 22.12 or newer. From this directory:

```sh
npm install
npm run dev
```

Open <http://127.0.0.1:5173>. Search works through local metadata even without the model service.

For Laya ranking, start the separate Python service in another terminal from `next/`, using the setup and cached-model command in [next/service/README.md](next/service/README.md). It listens on `127.0.0.1:8788`; the Vite development server proxies `/api/search` to it. The service’s `/health` endpoint reports model readiness.

## Check and build

```sh
npm test
npm run build
npm run preview
```

Tests cover relevance matching, scene layout, pointer gestures, throw velocity, and the real Rapier release behavior, including sparse pointer events, capture loss, deliberate drops, layout updates, and keyboard activation. The build runs TypeScript checks and writes the static site to `dist/`. Preview serves that build at <http://127.0.0.1:4173>; it uses local search unless a separate API endpoint was configured when building.

## Publish both versions

`deployment.json` controls which version is the homepage and holds the stable, randomly generated preview directory. `homepage: "legacy"` keeps the current site at `/`; the redesign is available at `/<previewPath>/`. The public homepage contains no link or shortcut to the preview. Its HTML requests `noindex, nofollow`. The URL is unlisted, not private: anyone who has or discovers it can visit, and the repository is public.

```sh
npm run build:pages
npm run preview:pages
```

The combined local preview serves both versions at <http://127.0.0.1:4173>. Before building, `scripts/build-pages.mjs` checks all 132 original files against the SHA-256 values in `legacy-files.json`. It refuses to deploy if an original file has changed. It writes the original site to the root of `site-dist/` and builds the redesign inside its preview directory. Asset URLs, original case studies, and résumé downloads stay inside that directory.

The [Pages workflow](.github/workflows/pages.yml) tests and builds both versions, then deploys the combined artifact on pushes to `main` or a manual workflow run. Pages must use **GitHub Actions** as its publishing source. Work locally with `npm run dev`; commit and push reviewed updates to `main` when the public preview should change. Python, model caches, dependencies, and source files are excluded from the deployment artifact.

When the redesign is ready, change `homepage` to `"next"` in `deployment.json`, verify `npm run build:pages`, then publish. The redesign becomes `/`, the old site remains at `/previous/`, and the preview URL continues to work. Switching back to `"legacy"` restores the original homepage.

## Structure

| Location | Responsibility |
| --- | --- |
| Original root HTML, `assets/`, `images/`, `resume.pdf` | Current live site, preserved byte for byte. |
| `scripts/`, `deployment.json`, `legacy-files.json` | Combined publishing, version choice, and legacy verification. |
| `next/src/App.tsx` | Query state, selected stories, dialogs, URL state, and theme selection. |
| `next/src/content/catalog.json` | The single source of truth for copy, retrieval topics, links, images, and object appearances. |
| `next/src/content/types.ts` | The content contract. |
| `next/src/components/` | The cycling prompt field, object faces, physics host, story dialogs, image demos, Index, and theme menu. |
| `next/src/scene/` | Deterministic layouts, Rapier simulation, dragging, and animation lifetime. |
| `next/src/search/` | Predictable direct matches, API requests, cancellation, and metadata fallback. |
| `next/src/styles.css`, `next/src/components/objects.css`, `next/src/components/dialogs.css`, `next/src/components/index.css`, `next/src/components/resume.css`, `next/src/theme.ts` | Interface tokens, miniature footprints, dialog and document layouts, and themes. |
| `next/service/` | Local MiniLM candidate retrieval and Laya ranking over existing catalog IDs. |
| `next/public/archive/` | Original case studies and their assets. |

React owns content and user intent. Physics updates DOM transforms outside React’s rendering cycle. The scene uses a fixed timestep, sleeps when settled, pauses for dialogs and hidden tabs, and disposes its listeners and WASM resources on cleanup. Objects can be dragged and thrown throughout the canvas. A separate pointer-gesture tracker distinguishes clicks from drags without relying on the simulation’s release-event timing.

## Design and interaction

The studio, paper, and dark themes share one layout and component system. CSS custom properties define canvas, surfaces, text, accent, object colors, shadows, radii, and motion. The canvas provides most of the visual space, objects provide secondary color, and the accent marks important interaction states. Theme choice is saved locally when storage is available.

[Base UI](https://base-ui.com/) supplies headless dialog and menu behavior. Objects use different silhouettes, including game cartridges, a keyboard, a running shoe, an Ongawa studio plaque, a metronome, an award trophy, a record, an envelope, and a folded sheet. Their miniature details are decorative. Header labels slide out on hover and keyboard focus above 600px, without a background tile. [Rapier](https://rapier.rs/) supplies the rigid-body simulation, with a small spring layer for lifting relevant objects. The initial pile uses footprint-based skyline packing; records use circular colliders. See [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) for the current tokens, sizes, and motion behavior.

The empty prompt cycles native placeholders such as `try "what is brett good at?"` every 6.5 seconds, with a 350ms fade. It pauses while focused, after typing, with a dialog open, under reduced motion, or while the document is hidden. Its accessible label stays constant.

Story dialogs use one column with a fixed title and plain close icon above a named, focusable scroll region. Single-section text entries use a compact 560px panel that shows the body without a repeated summary or section heading; other text entries use up to 820px, and entries with imagery use up to 1160px. Paper has subtle grain, games have a restrained screen bezel, and code has a terminal treatment. All share the same reading layout, with prose limited to 72ch. Titles use the interface font, or monospace in terminals. Figures preserve their aspect ratio and support descriptive alt text and captions. `DialogCloseButton` supplies the same 44px close hit area to story and index dialogs.

Dialogs share responsive gutters of 32px, 24px at ≤900px, and 20px at ≤600px. Titles, reading text, figures, index rows, and the résumé toolbar follow those edges. The 18px close icon sits inside its 44px target with an optical adjustment that balances its top and side spacing. A 4px spacing rhythm sets section, image, caption, and link gaps; fixed year and arrow slots keep index rows aligned. Search and clear icons have balanced centers within the prompt. Exact dimensions and responsive rules are documented in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).

The résumé opens directly into its original A4 document in a panel up to 980px wide, with a fixed toolbar for its title, original-version label, `download`, `linkedin`, and close actions. Its actions use 44px targets and a second toolbar row on mobile; the document frame follows the shared gutter around a centered page up to 820px wide. A static SVG preview keeps the page crisp without loading a PDF renderer. `ResumeDocument` provides a structured text equivalent for assistive technology; the original PDF remains the download.

The index is a 640px browsing panel with category filters and simple icon rows. Work appears first. Its header stays at a fixed position as category changes alter the list length, and the list scrolls independently.

Display titles, short interface labels, object labels, link actions, headings, and example prompts are authored lowercase, including `ongawa`, `linkedin`, and `ui/ux`. This display styling does not change the proper spelling of names in source material. Summaries, paragraphs, captions, alt text, and the original résumé retain normal spelling and casing. Physical keyboard keycaps and the `Aa` type specimen keep their representational forms. Casing is authored per field rather than applied through a global CSS transformation.

`StoryImage` displays a still preview for demos with `stillSrc`. Play demo loads the animation; Pause demo restores the still. The shared `ContentImage` type also accepts optional captions and intrinsic dimensions. Hero images load eagerly and section images load lazily.

Sixteen static images use full-resolution lossless WebP copies under `next/public/media/optimized/`. They retain the original decoded pixels and color profiles while reducing their combined transfer size from 24.36 MB to 11.77 MB. Original assets remain in the archive. Object faces are memoized, unchanged transforms are skipped, and the physics world rebuilds only when canvas or object dimensions change.

Objects are labeled buttons and can be opened with a keyboard. The Index provides a predictable alternative to the pile, and search feedback uses a polite live region. With reduced motion enabled, objects use a deterministic static layout and CSS animation and transitions are disabled. If physics fails to load, the objects remain available in a static grid.

## Search and hosting

The local Laya service ranks existing stories; it does not generate biography or portfolio copy. Direct requests such as résumé and contact use local matching. Other queries can use Laya, with an eight-second timeout and local metadata fallback when the service is unavailable.

GitHub Pages serves static files and cannot run the Python model service. A production build without an API URL searches local metadata immediately, without sending requests to an unavailable endpoint. To connect a hosted service, set `VITE_SEARCH_API_URL` to its base URL before building, and configure `PORTFOLIO_ALLOWED_ORIGINS` on the service. Model hosting, request limits, and operational setup remain separate work; see [next/service/README.md](next/service/README.md).

## Editing content

Edit `next/src/content/catalog.json` to add or update a story. Keep its ID stable for links using `?view=<id>`, choose an appearance from the content contract, and add retrieval topics that accurately describe the story. Images can accompany the overview or individual sections. Supply meaningful `alt` text, optional `caption`, and `width`/`height` when known; add a `stillSrc` preview for animated demos. Put public assets under `next/public/` and reference them with site-root paths. Restart the model service after catalog changes so its context and caches reflect the same content as the interface. When updating the résumé, replace `next/public/resume.pdf`, regenerate `next/public/media/resume/resume.svg`, and update the matching text in `ResumeDocument.tsx`.

The 24-entry catalog includes the seven original game projects, with Virtuosos now presented as the Ongawa company story and Brett’s former CTO role, plus specific stories about calibration, input handling, audio timing, multiplayer lobbies, camera movement, momentum, inverse kinematics, level editing, and Frogmancer’s documented audio award. Industrious Design, Premier, and running entries contain only the broad facts Brett has supplied. Detailed work examples, outcomes, running history, and a current résumé are deferred. `next/public/resume.pdf` is the original portfolio résumé and is identified that way in the site.
