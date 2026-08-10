<p align="center">
  <img src="./assets/readme/hero.svg" width="100%" alt="PrecisionTyper — exact-match typing practice with Zen and Focus modes">
</p>

<p align="center">
  <strong>Exact-match typing practice that can feel measurable or meditative.</strong><br>
  Train with live feedback, or switch on Zen and let the numbers disappear.
</p>

<p align="center">
  <a href="https://zhoulinhua0-star.github.io/TypeRacerGame/"><strong>Play in your browser</strong></a>
  ·
  <a href="https://zhoulinhua0-star.github.io/TypeRacerGame/game.html">Open the typing canvas</a>
  ·
  <a href="#three-editions">Explore all three editions</a>
</p>

## Why PrecisionTyper?

PrecisionTyper is a dependency-free typing trainer built around one rule: a passage is complete only when every character matches. The Web Edition adds two distinct ways to practice without changing that rule.

<p align="center">
  <img src="./assets/readme/modes.svg" width="100%" alt="Practice mode shows performance signals while Zen mode provides quieter feedback; both require an exact match">
</p>

- **One typing canvas:** read, type, correct, and submit in the same surface.
- **Practice or unwind:** keep WPM, accuracy, and time visible—or let Zen hide performance pressure and continue automatically.
- **Five collection choices:** General, Calm, Quotes, Code, and browser-saved Custom passages.
- **Keyboard-first flow:** `/` starts typing, `Enter` checks the match, and `Tab` opens session settings.
- **Focus without fullscreen:** remove surrounding navigation and controls without a browser permission prompt.
- **Resilient by design:** local preferences degrade safely to session memory, and built-in passages cover restrictive `file://` use.

## Start typing

### Use the hosted app

Open **[PrecisionTyper](https://zhoulinhua0-star.github.io/TypeRacerGame/)**, choose **Play now**, and press `/` to focus the typing canvas. Nothing needs to be installed.

For a focused session, try **Calm + Zen + Focus + Sound**. For deliberate practice, choose **General**, set a difficulty, and turn Zen off to watch live statistics.

### Run it locally

```bash
git clone https://github.com/zhoulinhua0-star/TypeRacerGame.git
cd TypeRacerGame
python3 -m http.server 8000
```

Then open [http://localhost:8000/PrecisionTyper/](http://localhost:8000/PrecisionTyper/).

The landing page also works when opened directly. If a browser blocks `texts.json` under `file://`, PrecisionTyper automatically uses its smaller built-in passage set.

## Keyboard map

| Action | Shortcut |
| --- | --- |
| Focus the typing canvas | `/` |
| Check for an exact match | `Enter` or `Cmd/Ctrl + Enter` |
| Open session settings | `Tab`, then `Enter` |
| Restart the current passage | `Esc` |
| Skip to another passage | `Cmd/Ctrl + →` |
| Toggle Focus view | `Cmd/Ctrl + Shift + F` |
| Leave Focus view | `Esc` |

Typing keeps native editing behavior: arrow keys, selection, paste, Home, and End continue to work. `Enter` inserts a line break only when the target passage actually expects one. A teal `↳` can mark a visually wrapped code token; it is never a character you need to type.

## What happens in a session

1. **Choose a collection.** General includes Easy, Medium, and Hard pools; the other collections use their own passage sets.
2. **Type exactly.** Correct, current, remaining, and extra characters receive distinct visual feedback in one canvas.
3. **Check with Enter.** A perfect match opens the result overlay; an incomplete match prompts you to correct the passage.
4. **Continue your way.** Regular practice keeps statistics visible. Zen softens mistakes, hides evaluative chrome, and advances after a short success pause.

The timer uses the browser's monotonic clock, and WPM follows the standard five-characters-per-word calculation.

## Three editions

| Edition | Best for | Run it |
| --- | --- | --- |
| **Web · PrecisionTyper** | Single-canvas practice, Zen/Focus sessions, custom passages, and responsive use | [Open online](https://zhoulinhua0-star.github.io/TypeRacerGame/) or serve `PrecisionTyper/` |
| **Desktop · PrecisionTyper.java** | Strict Java Swing practice with difficulty levels, themes, and synthesized key sounds | `javac PrecisionTyper.java && java PrecisionTyper` |
| **Console · TypeRacerGame.java** | A minimal terminal loop with per-round timing, accuracy, and WPM | `javac TypeRacerGame.java && java TypeRacerGame` |

The Java editions target Java 21+ and run on Windows, macOS, and Linux. The Web Edition uses HTML, CSS, and vanilla JavaScript with no runtime dependencies.

## Passage quality, privacy, and fallback behavior

The Web Edition ships **134 passages across six internal pools**. The UI presents those pools as General difficulty levels plus Calm, Quotes, and Code; Custom passages are supplied by the user.

- Every bundled passage has a stable ID and source record.
- The 12 Quote entries include verified public-domain literature metadata.
- The remaining 122 project-curated passages are marked as awaiting full provenance review instead of receiving guessed attribution.
- Preferences, custom passages, and shuffle progress stay in the browser; the app does not upload them.
- Denied or full `localStorage` falls back to in-memory session state without blocking play.
- Each pool is exhausted before reshuffling when persistent storage is available.

## Development

There is no package install step. Before deploying changes, run the repository checks directly with Node:

```bash
node scripts/validate-texts.mjs
node scripts/test-web-logic.mjs
node scripts/test-keyboard-guide.mjs
```

These checks cover passage schema and duplication, source metadata, fallback selection, shuffle behavior, word-safe wrapping, semantic Enter handling, browser-storage failures, session-setting focus restoration, and the landing-page keyboard guide contract.

<details>
<summary><strong>Project structure</strong></summary>

```text
TypeRacerGame/
├── TypeRacerGame.java          # Console edition
├── PrecisionTyper.java         # Java Swing edition
├── PrecisionTyper/
│   ├── index.html              # Web landing page
│   ├── game.html               # Typing canvas
│   ├── website.css             # Landing-page design
│   ├── website.js              # Navigation and keyboard guide
│   ├── styles.css              # Game, Zen, Focus, and themes
│   ├── script.js               # Typing engine and persistence
│   └── texts.json              # Versioned passage database
├── assets/readme/              # README visual system
├── scripts/                    # Validation and behavior checks
├── .github/workflows/          # GitHub Pages deployment
├── README.md
└── LICENSE
```

</details>

<details>
<summary><strong>GitHub Pages deployment</strong></summary>

The deployment workflow publishes `PrecisionTyper/` to the site root. In **Settings → Pages**, set **Build and deployment → Source** to **GitHub Actions**. A push to `main` then deploys the landing page at `/TypeRacerGame/` and the game at `/TypeRacerGame/game.html`.

If a deployment looks stale, wait for the **Deploy GitHub Pages** workflow to finish, then hard-refresh with `Cmd+Shift+R` on macOS or `Ctrl+Shift+R` on Windows.

</details>

## License

Released under the [MIT License](./LICENSE).
