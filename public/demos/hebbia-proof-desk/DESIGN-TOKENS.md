# Proof Desk design tokens (matched to Hebbia's public visual language)

Read on Oct 29, 2026 from public files on hebbia.com. The goal is that Proof Desk looks like it fits Hebbia's product family. It does not use Hebbia's logo, wordmark, product name as a brand, or licensed font files.

Sources
- S1: https://www.hebbia.com/static/css/screen.css (site design tokens: color ramps, type, spacing, radius, buttons, @font-face)
- S2: https://www.hebbia.com/static/css/modules/matrixMockTable/matrixMockTable.css (the Matrix product mock on the home page; product surface, text, border, and pill tokens)
- S3: https://www.hebbia.com/ (computed styles read in headless Chromium: body bg rgb(14,11,11), body text rgb(244,241,235), body font Selecta 16px, button radius 4px)
- S4: https://www.hebbia.com/blog/introducing-matrix-2-0 (serif display headline, dark page)
- Reference screenshots: _shots/ref-hebbia-home-matrix-section.png, _shots/ref-hebbia-matrix-mock.png, _shots/ref-hebbia-blog-matrix2.png (not shipped in the package)

All tokens live in `tokens.css`. `styles.css` only uses them.

## Fonts
| Role | Hebbia uses | Proof Desk uses | Why | Source |
|---|---|---|---|---|
| UI sans | "Selecta" (400, 500, 700) and "Selecta Upright" variable | Inter variable, bundled in fonts/ (OFL) | Selecta is a licensed retail font. Hebbia's own CSS lists Inter as the first fallback: `"Selecta", "Inter", "Roboto", ...` | S1 `--ff-sans` |
| Display serif | "Edict Display" variable (and Roman) | Instrument Serif 400, bundled in fonts/ (OFL) | Edict Display is licensed. Instrument Serif is the closest free high contrast, narrow display serif. Used for page titles, KPI numbers, memo title, and quotes. | S1 `--ff-serif`, S4 |
| Fallback stacks | Iowan Old Style, Palatino Linotype, URW Palladio L, P052 | same stack after Instrument Serif | copied from Hebbia's stack | S1 |

## Color
| Token | Value | Use in Proof Desk | Source |
|---|---|---|---|
| --grey-950 | #0E0B0B | top bar, hero band, footer | S1, S3 body bg |
| --warm-grey-50 | #F4F1EB | text on dark | S1, S3 body text |
| --steel | #828893 | soft text on dark | S1 |
| --grey-900 / 800 | #171717 / #262626 | secondary (black) buttons, active chip | S1 `--color-btn-black` |
| --blue-500 | #465BFF | primary button, focus, selected cell | S1 `--color-btn-blue` |
| --blue-600 | #3043E0 | primary hover | S1 |
| --background-primary | rgb(251,251,251) | app background | S2 |
| --background-secondary | rgb(244,244,244) | nav hover and active, meters | S2 |
| --background-emphasis | #fff | cards, grid cells | S2 |
| --header-primary | rgb(23,23,23) | headings | S2 |
| --content-primary / secondary / tertiary | rgb(38,38,38) / rgb(91,91,91) / rgb(134,134,134) | body, secondary, meta text | S2 |
| --header-eyebrow | rgb(163,163,163) | eyebrow labels | S2 |
| --border-default / hairline | rgb(229,229,229), 0.5px | all borders and grid lines | S2 `--matrix-mock-hairline` |
| --border-hairline | rgba(0,0,0,.13) | button and chip outlines | S2 |
| --border-focus | rgb(144,157,255) | focus ring | S2 |
| --content-cobalt / arbor / nova / solar / negative | rgb(70,91,255) / rgb(94,142,113) / rgb(164,109,224) / rgb(215,161,54) / rgb(220,57,34) | chart lines, status dots, quote rules | S2 |
| --background-cobalt / arbor / solar / negative | rgb(238,242,255) / rgb(232,246,242) / rgb(247,244,234) / rgb(255,233,230) | fixed, verified, low confidence, conflict fills | S2 |
| --pill-*-bg / --pill-*-text | e.g. green rgba(22,138,74,.1) / #126d3b, red rgba(227,51,34,.09) / #c2261a, blue rgba(70,91,255,.1) / #1d2eb3, yellow rgba(255,212,0,.23) / #80661d | status pills | S2 |
| --sand / --sand-tint | #EEECDD / #DEDBD4 | defined, not used much (Hebbia uses sand for light marketing sections) | S1 |
| Row avatar colors | #465BFF, #5E8E71, #A46DE0, #EC7F70, #D7A136, #262626, #0E8AC6 | borrower initials in the grid | built from S2 content tones |

## Type scale
| Token | Value | Source |
|---|---|---|
| --fz-xs / sm / md / base / lg | .75 / .8125 / .875 / 1 / 1.125rem | S1 `--fz` steps, S2 font sizes (.75, .8125, .875, 1rem most used) |
| Page title (serif) | 2.5rem, weight 400, line height 1.05 | S1 fluid display sizes, scaled for an app |
| Line heights | 1.2 fine, 1.375 medium, 1.5 normal | S1 `--lh-*` |
| Letter spacing | -0.02em on UI labels | S2 toolbar `--lts:-0.02em` |
| Grid text | .875rem, 500 for headers, sentence case | S2 `.matrix-mock__th` |

## Spacing, radius, shadow
| Token | Value | Source |
|---|---|---|
| --space-1 to --space-8 | .25rem to 2rem (4px scale) | S1 |
| --bdrs-xs | .25rem (buttons, pills) | S1 `--button-radius: var(--bdrs-xs)`, S3 4px |
| --bdrs-sm / md | .375rem / .5rem (inputs, cards) | S1, S2 |
| --bdrs-full | 62.4375rem (chips, borrower chip, doc pill) | S1, S2 toolbar buttons |
| --shadow-small | 0 4px 6px -2px rgb(0 0 0 / 6%) | S2 `--matrix-mock-shadow-small` |
| --shadow-xs | 0 1px 2px 0 rgba(0,0,0,.05) | S2 |
| --shadow-float | 0 8px 32px 0 rgba(0,0,0,.25) | S1 (toast) |
| Sticky first column shadow | 6px 0 8px -4px rgba(0,0,0,.1) | S2 `.matrix-mock__cell--company` |
| Transitions | 120ms ease-out | S2 |

## Components
- Matrix grid: white surface, 0.5px hairlines on every cell, row index column, sticky first column with a soft right shadow, rounded full borrower chip with a colored initial avatar, small rounded doc pill with a red "PDF" tag, sentence case headers with a small icon. Modeled on S2 and _shots/ref-hebbia-matrix-mock.png.
- Pills: small 4px radius tags with tinted fill and dark text of the same hue (S2 `--pill-*`).
- Buttons: 4px radius, cobalt primary, near black secondary, white with hairline for default (S1).
- Chips and filters: rounded full, hairline border, black when on (S1, S2).
- Chrome: dark near black top bar and footer with warm off white text, like the public site nav. Light product body, like the Matrix mock (S2, S3).
- Source panel and quotes: white card, small shadow, serif quote with a 2px colored rule.
- Memo: sans body for reading, serif title, small uppercase eyebrow section labels.
- Charts: thin 1.75px lines in cobalt, arbor, and nova on light hairline grids.

## What we did not match, and why
- Selecta and Edict Display: licensed. Not copied or hot linked. Inter (Hebbia's own first fallback) and Instrument Serif stand in. Instrument Serif has one weight and is narrower than Edict.
- Material Symbols Sharp icons: not loaded to keep the demo offline and small. Unicode symbols stand in.
- Hebbia logo, wordmark, and brand name: not used, on purpose. App stays "Proof Desk".
- Photo and video imagery from the site: not used.
- Fluid clamp() type sizes from the marketing site: replaced with fixed app sizes for a dense tool UI.
