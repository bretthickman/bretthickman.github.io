# Portfolio design system

The homepage contains a wordmark, three icon actions, one prompt, and a pile of 24 objects. The objects carry the visual character; readable stories live in dialogs. Shared colors and motion keep the different silhouettes part of one system.

Sources of truth: `next/src/styles.css` for interface tokens, layout, and shared close controls, `next/src/components/objects.css` for miniatures and footprints, `next/src/components/dialogs.css` for story layouts, `next/src/components/index.css` for browsing, `next/src/components/resume.css` for the document view, `next/src/theme.ts` for theme choices, and `next/src/scene/` for placement and physics. Content and appearances come from `next/src/content/catalog.json`.

## Themes and tokens

The studio theme is the default. The paper and dark themes override semantic tokens through `data-theme`; unchanged values inherit studio. Theme choice is stored under `brett-theme` when storage is available. The dark theme sets `color-scheme: dark`.

A static, seamless SVG grain gives the canvas a light paper texture. It blends through soft light beneath the interface and objects, with theme-specific `--grain-opacity`: .55 in studio, .75 in paper, and .3 in dark. The isolated decorative layer ignores pointer events and requires no animation or JavaScript.

| Token | studio | paper | dark |
| --- | --- | --- | --- |
| `--canvas` | `#f7f8fa` | `#f5f0e7` | `#171b21` |
| `--surface` | `#ffffff` | `#fffcf6` | `#222730` |
| `--ink` | `#242933` | `#34302c` | `#f0eff6` |
| `--muted` | `#626b79` | `#6f675e` | `#a1a7b3` |
| `--line` | `#e2e5eb` | `#e5ddd0` | `#363c47` |
| `--accent` | `#3559eb` | `#d65338` | `#d1ef8a` |
| `--accent-ink` | `#ffffff` | `#ffffff` | `#28351c` |
| `--card-ink` | `#303643` | `#403b32` | `#272c38` |

`--blue`, `--lilac`, `--peach`, and `--mint` provide object colors. `--terminal` and `--terminal-ink` pair a dark material with readable marks. The terminal’s syntax palette uses `--syntax-blue` (#89caff), `--syntax-green` (#b3e594), and `--syntax-peach` (#ffbd94), with thicker segmented lines for recognizable code at miniature scale. `--shadow` and `--shadow-raised` serve interface surfaces. `--object-shadow` and `--object-shadow-raised` follow each silhouette; hovering, selection, and dragging use the raised treatment in every theme. Document folds use a local `--fold` of 14px, reduced to 12px at widths ≤900px.

DM Sans Variable handles the interface, dialog titles, and reading text. DM Serif Display appears only on miniature type specimens and notes; terminal titles, section headings, and decorative marks use `ui-monospace`. Fontsource bundles the fonts locally. Input text is 1rem, or .9375rem at ≤900px. Dialog titles use 24px/32px, or 20px/28px at ≤600px; prose is 1rem/1.75, or .9375rem/1.7 at ≤600px. Object labels vary with the miniature rather than impose a uniform card layout.

## Casing

Display titles, short interface labels, themes, object labels, link actions, section headings, and example prompts use authored lowercase. Names and acronyms follow the same display styling in these fields: `brett`, `ongawa`, `linkedin`, `ui/ux`, and `cto`.

Source spelling remains intact in summaries, body paragraphs, captions, and alt text, where names and technical terms use normal casing. The original résumé and its accessible transcription retain the document's original typography and spelling. Physical keyboard keycaps remain uppercase, and the `Aa` type specimen retains its letterforms. Each content field owns its casing; there is no global CSS text transformation.

## Alignment and spacing

Story titles, reading text, figures, index rows, and the résumé toolbar share `--dialog-inset`: 32px, 24px at ≤900px, and 20px at ≤600px. Header block padding follows the same breakpoints at 20px, 12px, and 8px. The close control keeps a 44px target around its 18px icon; a −13px inline-end margin aligns the icon box with the shared gutter. Its top and side clearances are optically balanced, and its focus outline uses zero offset.

Reading layout follows a 4px spacing rhythm: links start 16px after text and have 24px horizontal gaps; sections are separated by 32px; section imagery starts after 24px and captions after 12px. Index filter text starts on the same gutter by pairing equal negative outer margins with button padding. Rows have a 56px minimum height, 16px vertical padding, and 16px gaps, reduced to 12px on mobile. Four-character, right-aligned year slots and reserved arrow slots keep columns steady when titles wrap.

The shell uses 28px × 40px padding, 20px × 24px at ≤900px, and 20px on mobile. The wordmark has a 44px target. A 10px compensation aligns the last navigation icon with the shell gutter; the theme positioner offsets its anchor by the same amount to keep the popup on that edge. Theme options use 12px padding and 4px between their title and supporting copy. The prompt is 64px high, or 60px at ≤900px, with 20px/16px horizontal padding and a 12px icon-to-input gap. Its search and clear icon centers sit 31px/27px from their respective edges; the search icon remains 20px on mobile.

## Shell and prompt

The header exposes index, résumé, and theme through accessible icon buttons with 40×40px icon areas. At widths above 600px, hover, keyboard focus, or an open menu reveals a lowercase, 1rem label to the right over 440ms with a gentle acceleration and deceleration. The label animates its actual width (56px for index, 72px for résumé, 64px for theme), with a 90ms fade-in delay and a quicker fade-out. This avoids the uneven timing of a maximum-width transition. The label expands and slides into view without a background tile; smaller screens keep the compact icons. The search icon uses a 2.25px stroke. The wordmark resets exploration. The prompt is at most 460px wide. The canvas uses `100svh` with minimum heights of 600px, 620px at ≤600px, and 640px at ≤360px. Short screens can scroll.

`PromptField` cycles six native placeholders formatted `try "…"` every 6.5 seconds. Its 350ms opacity transition fades the old example out and the next one in. Cycling pauses while the field is focused, contains text, a dialog is open, reduced motion is enabled, or the document is hidden. Hiding the document cancels a pending fade and restores the current text. The accessible input label stays constant.

Typing waits 250ms before search; submission runs immediately. A decorative dot signals loading. Clearing or Escape releases selection and focuses the field. Successful result counts are announced through a polite live region without permanent visible helper text; an unmatched query offers the Index.

Base UI supplies the theme radio menu and both dialogs. A story dialog’s animation origin follows the opened object, and focus returns to its opener. The index uses a 640px single-column panel with a fixed header, understated category filters, and native button rows with appearance icons. Work appears first in the all view. The header is anchored near the top of the viewport so switching between categories does not move the controls; the list scrolls independently. Smaller screens use 12px viewport margins.

## Story reading and media

`ContentDialog` uses a single fixed header containing its title and a plain close icon. It omits category, year, and decorative window metadata. The named, keyboard-focusable reading region scrolls independently beneath the header. Its semantic title and description remain available to assistive technology.

Single-section entries without images use a compact panel up to 560px wide. They display their body paragraphs directly, keep the summary for screen readers, and omit the repeated section heading. Other text entries use up to 820px; entries with overview or section imagery use up to 1160px. All have a single-column layout, with prose limited to 72ch. Multi-section entries show an overview summary, links, optional hero, and section headings above their paragraphs. Figures preserve each image’s aspect ratio, contain rather than crop it, and show optional captions. The shared reading stylesheet is `next/src/components/dialogs.css`.

Dialog treatments come from the entry’s appearance: game and studio use a screen bezel; code, keyboard, and folder use a terminal treatment; other stories use paper. Local `--story-*` tokens keep colors, focus indicators, captions, and controls readable in each treatment. Paper uses subtle grain, screen uses a slim charcoal bezel, and terminal uses existing syntax colors and monospace headings. Body text retains DM Sans for readability; paper titles use DM Sans as well.

`CloseIcon` supplies the same 18px X with a 2px stroke to search clearing and every dialog close, matching the header icon weight. Both use `.close-control`: a transparent 44×44px hit area, no border or background shape, and muted color that becomes ink on hover or keyboard focus. Search clearing is optically aligned with the search icon at the opposite edge of the field. `DialogCloseButton` wraps Base UI's close behavior for story, résumé, and index dialogs. Local story or interface tokens keep the icon readable across treatments and themes.

The résumé has a separate document view, up to 980px wide, with a fixed toolbar containing its title, original-version label, `download`, `linkedin`, and close actions. Its toolbar uses the shared header gutter and block padding, and actions have 44px targets. Mobile actions occupy a controlled second toolbar row. The document frame uses the shared gutter; the faithful vector page remains white in every theme and centered at a maximum width of 820px. A structured hidden transcription provides the document’s text to assistive technology.

The `ContentImage` contract is shared by overview and section images: `src`, `alt`, optional `caption`, `stillSrc`, `width`, and `height`. `StoryImage` uses the still preview when supplied. The `play demo` action switches to the animated source; `pause demo` restores the still, with the button state exposed through `aria-pressed`. Hero images load eagerly; section images load lazily. Authors should supply a still preview for GIF demos so motion is opt-in.

## Objects and footprints

CSS shapes, gradients, clipping, and decorative spans give each object its own silhouette. Project images appear inside cartridge labels. Decorative details are hidden from assistive technology; each surrounding native button carries the story’s accessible name. Running uses a running-shoe silhouette with a contrasting sole and visible laces. Input handling uses a keyboard with highlighted WASD keys. Ongawa has a distinct studio plaque with a `cto` marker; its original Virtuosos images remain identified as early work.

| Appearance | Silhouette | Base footprint, px |
| --- | --- | --- |
| Palette | Color strip | 108×48 |
| Type | Printed specimen | 68×86 |
| Interface | Miniature control panel | 106×74 |
| Rhythm | Audio module | 84×60 |
| Code | Terminal window | 112×72 |
| Game | Cartridge | 72×88 |
| Runner | Running shoe | 110×68 |
| Document | Folded résumé sheet | 66×96 |
| Note | Taped sticky note | 78×76 |
| Contact | Envelope | 100×63 |
| Disc | Vinyl record | 80×80 |
| Ticket | Perforated admission ticket | 110×52 |
| Folder | Folder with a visible sheet | 96×68 |
| Award | Trophy cup, handles, and plinth | 66×84 |
| Metronome | Tapered case with pendulum | 62×84 |
| Keyboard | Keycaps, WASD accents, and space bar | 98×62 |
| Studio | Ongawa plaque with `cto` marker | 104×80 |

Both dimensions multiply by `--object-size`: 1 by default, .86 at ≤900px, .70 at ≤600px, and .65 at ≤360px. Selected faces enlarge using `--result-scale`: 1.5 by default and 1.8 at ≤600px. The button remains compact; result layout measures the enlarged visual footprint. Up to four ranked objects fit below the prompt with 16px gaps and edge clearance; shorter layouts retain a fitting prefix, and announcements use the displayed count.

Objects fade in over 250ms after scene initialization. With results visible, unselected pile objects dim to .26 opacity; hover, keyboard focus, and dragging restore full opacity. Selected objects use layer 3, dragging layer 4, and keyboard focus layer 5.

## Motion, physics, and accessible equivalents

The shared easing is `cubic-bezier(.22, 1, .36, 1)` and interface duration is 280ms. Face enlargement takes 380ms, miniature shadows 180ms, dialog transforms 420ms, and menu appearance 150ms. The loading dot alternates opacity over 900ms.

The initial pile uses deterministic bottom-up skyline packing based on rotated footprints, with tilt up to ±.34 radians. Discs use circle-aware placement and Rapier circle colliders; other objects use rectangular colliders. Initial packing reserves space below the prompt. The physical world spans the entire canvas, bounded only by the left, right, top, and bottom edges, so objects can be dragged and thrown through the upper screen. Rapier runs at 60Hz, with 100 CSS pixels per metre and gravity of 15m/s². Frame catch-up is capped at four steps. There is no continuous bobbing: animation frames stop once the scene settles.

Selected objects become collision sensors and move to unrotated targets through a damped spring. Clearing selection restores dynamic collisions and gravity. Dragging starts after 6px of movement, uses pointer capture, and stays within the full scene. `PointerGesture` tracks activation intent separately from the simulation: once movement crosses the threshold, returning to the start or receiving late release events cannot turn it into a click. Cancellation and unexpected capture loss also suppress activation. Keyboard activation remains available, and each new press begins a fresh gesture.

`DragVelocity` uses a 100ms window of object positions, interpolating its start to avoid dependence on pointer event frequency. The release position contributes even when no final move event was delivered. Stationary time gradually reduces momentum, so pausing before release produces a drop. Speed is limited to 1800 CSS pixels per second without changing direction. Normal capture release preserves velocity; cancellation or capture loss while a button is held cancels the throw.

Dialogs and hidden documents pause the simulation. Resize remeasures objects and rebuilds the world only when canvas or object dimensions change, retaining selection. Search-area changes update selection targets while preserving body positions, active drags, and momentum. Unchanged transforms are skipped; cleanup releases listeners and WASM resources.

Dragging is optional. Native object buttons support keyboard activation, while the stationary Index reaches the same content. A skip link reaches the labeled field. Focus uses a 2px accent outline with 5px offset by default; close controls use zero offset, and the input uses its field’s focus treatment. Base UI manages menu keyboard navigation and modal focus.

Reduced motion disables CSS transitions, placeholder cycling, gravity, and simulated dragging. The static scene retains deterministic placements, compressing its vertical packing only when needed to keep the prompt clear. Searching, direct object activation, the Index, and dialogs remain available. If physics fails to load, the objects use a static flex grid.
