# TypeRacerGame

A collection of typing speed and accuracy trainers with three implementations: console, desktop GUI, and a modern web application. The Web Edition supports both strict skill practice and low-pressure typing sessions for unwinding.

## 🌐 Live Website

**👉 [Try PrecisionTyper Online](https://zhoulinhua0-star.github.io/TypeRacerGame/)** - No installation required!

## Projects

### Project 1: Console-Based Edition
**TypeRacerGame.java** - A console-based typing game written in Java. Users type a series of predefined sentences, and the program calculates typing time, accuracy, and words per minute (WPM) for each round, with an overall summary at the end.

### Project 2: GUI Precision Edition
**PrecisionTyper.java** - A precision-focused desktop typing application built with Java Swing. Designed for users who want to master both speed and 100% accuracy. Unlike casual typing games, this "Strict Edition" requires a perfect match of the target text before allowing a successful submission. Features include:
- Real-time Light/Dark mode toggle
- Custom-coded mechanical "tock" sound generator
- Persistent theme settings
- Three difficulty levels (Easy, Medium, Hard)
- Full comprehensive text database

### Project 3: Web Edition ⭐

**Practice Your Typing Skills Online - No Installation Required**

The Web Edition of PrecisionTyper is a browser-based typing space for two complementary uses: deliberate accuracy practice and quiet, rhythmic typing for stress relief. It combines strict character matching with an immersive single canvas, optional performance statistics, calming text, and tactile audio feedback.

**🌐 [Access the Web Application](https://zhoulinhua0-star.github.io/TypeRacerGame/)**

#### 🎯 Why Use PrecisionTyper Web Edition?

Use General passages and visible statistics when you want structured practice, or combine Calm, Zen, Focus, and Sound for a less evaluative session. Every passage still uses exact character matching, but Zen mode keeps mistakes gentle and removes performance pressure while you type.

#### 🚀 Quick Start

1. **Open the Application**
   - Landing: **[https://zhoulinhua0-star.github.io/TypeRacerGame/](https://zhoulinhua0-star.github.io/TypeRacerGame/)**
   - Game (direct): **[https://zhoulinhua0-star.github.io/TypeRacerGame/game.html](https://zhoulinhua0-star.github.io/TypeRacerGame/game.html)**
   - Or open `PrecisionTyper/index.html` locally, then click **Play now**
   - On the landing page, click the small **?** button or press **?** to open the complete keyboard workflow guide
   - If the game looks outdated after a deploy, hard-refresh: **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows)

2. **Choose a Collection**
   - **General**: The original easy, medium, and hard passage pools
   - **Calm**: Low-pressure, reflective passages for unwinding
   - **Quotes**: Short memorable quotations
   - **Code**: Programming-focused syntax practice
   - **Custom**: Add one passage per line; your text stays in this browser when local storage is available
   - Difficulty applies to **General** only: **Easy** uses short sentences, **Medium** uses longer technical passages, and **Hard** uses dense expert-level text

3. **Start Typing**
   - Click **Play now** on the landing page, or open the game link above
   - Press **/** from anywhere in the game to jump directly to the typing canvas, or click the canvas
   - The timer starts automatically when you begin
   - Match every character exactly — 100% accuracy is required
   - The hidden native text input preserves normal keyboard, selection, paste, and mobile keyboard behavior while the canvas renders your progress
   - Normal words stay together when the passage wraps. A teal **↳** marks an unusually long code token that may wrap visually; do not type the arrow or press Enter for that wrap

4. **Choose Your Experience**
   - **Zen is enabled by default**: once typing begins, settings and live statistics disappear, correct text becomes visually quiet, and mistakes use soft amber feedback
   - **Focus view**: expands the canvas and removes navigation, settings, and help without requesting browser fullscreen permission
   - **Sound**: enables an original, softly synthesized tap with subtle variations for regular keys, Space, Backspace, and Enter
   - Turn off Zen whenever you want to watch real-time statistics:
     - **WPM (Words Per Minute)**: Your typing speed
     - **Accuracy**: Percentage of correct characters
     - **Time**: Elapsed time since you started

5. **Complete the Challenge**
   - When you believe the passage is perfect, press **Cmd+Enter** (Mac) or **Ctrl+Enter** (Windows) to check
   - Perfect match → success overlay with your stats; imperfect match → the panel shakes (fix errors and check again)
   - In Zen mode, the next passage starts automatically about 2.4 seconds after completion
   - Plain **Enter** adds a line break and counts as a character, so it will not match a single-line passage

#### ⌨️ Controls and Shortcuts

| Action | Keyboard | On-screen control |
| --- | --- | --- |
| Jump to typing canvas | **/** | Click the canvas |
| Check exact match | **Cmd/Ctrl + Enter** | — |
| Restart current passage | **Esc** | **Restart** |
| Skip to another passage | **Cmd/Ctrl + →** | **Skip** |
| Toggle Focus view | **Cmd/Ctrl + Shift + F** | **Focus** |
| Leave Focus view | **Esc** | **Exit focus** |

When Focus view is active, the first **Esc** leaves Focus; pressing **Esc** again restarts the passage. Arrow keys, Home, End, selection, editing, and paste retain native text-input behavior.

#### 💡 Pro Tips for Best Results

- **For relaxation**: Try Calm + Zen + Focus + Sound, then type at a comfortable pace without chasing WPM
- **For deliberate practice**: Use General, choose a difficulty, and turn Zen off to see live statistics
- **Focus on accuracy**: Speed comes naturally with proper technique
- **Practice regularly**: Consistent short sessions are often more useful than occasional long ones
- **Use Visual Feedback**: Pay attention to the color-coded characters:
  - 🟢 **Green** = Correct
  - 🔴 **Red** = Mistake (fix it!)
  - ⚪ **Grey** = Not yet typed
  - 🟡 **Yellow** = Current position
- **Zen feedback**: Correct text becomes muted and mistakes switch from red to softer amber with a dotted underline
- **Strict submit**: Press **Cmd+Enter** / **Ctrl+Enter** to finish — typing the last character alone does not auto-complete
- **Mismatch feedback**: Wrong submit attempt shakes the typing panel

#### 🎨 Features

- **Real-Time Feedback**: Instant visual and statistical feedback as you type
- **Zen Mode**: Hides live performance pressure and keeps passages flowing automatically
- **Single Typing Canvas**: Target, feedback, and caret share one central surface instead of separate reading and input panels
- **Keyboard Workflow Guide**: Open the compact homepage guide with the **?** button or the **?** key
- **Focus View**: Removes navigation and settings without requiring browser fullscreen permission
- **Text Collections**: General, calm, quotes, code, and browser-saved custom passages
- **Strict Text Matching**: Preserves newlines, highlights extra characters, and requires an explicit exact-match check
- **Passage Controls**: Restart and skip actions are available through both buttons and keyboard shortcuts
- **Full-Pool Shuffle**: Each collection/difficulty is exhausted before reshuffling, with progress preserved when browser storage is available
- **Verified Quote Sources**: The Quotes collection includes author, work, source link, and public-domain review metadata
- **Three Difficulty Levels**: Progress from beginner to advanced at your own pace
- **Resilient Local Preferences**: Theme, Sound, Zen, collection, difficulty, shuffle progress, and custom passages are stored locally when allowed; blocked or full storage never prevents a session from starting
- **Offline/File Fallback**: If `texts.json` cannot load, normalized built-in passages keep General, Calm, Quotes, and Code usable
- **Theme Support**: Dark and light modes
- **Soft Tap Sound**: Original Web Audio synthesis with three variants per key type and slight pitch variation; no Apple audio assets are copied or bundled
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Accessible Native Input**: Keeps native text editing and provides screen-reader target text and live status messages
- **No Setup Required**: Open and start practicing immediately
- **Accurate Timing**: Uses the browser's monotonic clock instead of counting timer callbacks

#### Passage quality and provenance

`PrecisionTyper/texts.json` uses schema version 2 and currently contains 134 passages across six pools. Every passage has a stable ID and source record. The 12 Quotes entries contain verified public-domain literature metadata; 122 older project-curated General, Calm, and Code passages are explicitly marked as awaiting a full provenance review rather than receiving guessed attribution.

Before deployment, GitHub Actions runs:

```bash
node scripts/validate-texts.mjs
node scripts/test-web-logic.mjs
node scripts/test-keyboard-guide.mjs
```

The validator rejects invalid IDs, exact normalized duplicates, malformed text, missing source fields, and unverified Quote entries. It also reports possible near-overlaps and remaining legacy provenance work. The web-logic suite covers database normalization, fallback passage selection, full-pool shuffling, word-safe wrapping, and denied/quota-limited browser storage. The keyboard-guide suite checks the homepage dialog structure and keyboard behavior contract.

#### Storage and fallback behavior

PrecisionTyper is fully client-side and does not upload preferences or custom passages. When `localStorage` is available, it preserves settings, custom passages, and shuffle progress across visits. If storage access is denied or its quota is full, the game continues normally with in-memory session state. Custom passages remain usable for that session and the UI explains that they could not be persisted.

If `texts.json` is unavailable—for example, when the project is opened directly through a restrictive `file://` browser context—the game automatically uses a normalized built-in fallback for General, Calm, Quotes, and Code. Only an empty Custom collection displays the prompt to add a custom passage.

#### 📊 Understanding Your Statistics

- **WPM (Words Per Minute)**: Standardized measurement of typing speed (1 word = 5 characters)
- **Accuracy**: Percentage of correctly typed characters
- **Time**: Total time spent typing the current text

Aim for balanced improvement - higher accuracy and consistent speed over time.

---

## Technical Specifications

### Java Projects (Project 1 & 2)
* **Language:** Java 21+
* **Library:** Swing / AWT (Project 2)
* **OS Compatibility:** Windows, macOS, Linux
* **IDE Recommended:** VS Code / IntelliJ IDEA

### Web Edition (Project 3)
* **Technologies:** HTML5, CSS3, Vanilla JavaScript (ES6+)
* **Dependencies:** None - pure client-side application
* **Browser APIs:** Web Audio API, resilient `localStorage` access with session-only degradation, `fetch`, and `performance.now()`
* **Browser Compatibility:** Modern browsers (Chrome, Firefox, Safari, Edge)
* **Live URL:** [https://zhoulinhua0-star.github.io/TypeRacerGame/](https://zhoulinhua0-star.github.io/TypeRacerGame/)

#### GitHub Pages deployment

All web files live in **`PrecisionTyper/`** only. GitHub Actions (`.github/workflows/deploy-pages.yml`) publishes that folder to the site root:

- **Landing:** [https://zhoulinhua0-star.github.io/TypeRacerGame/](https://zhoulinhua0-star.github.io/TypeRacerGame/) → `PrecisionTyper/index.html`
- **Game:** [https://zhoulinhua0-star.github.io/TypeRacerGame/game.html](https://zhoulinhua0-star.github.io/TypeRacerGame/game.html) → `PrecisionTyper/game.html`

**One-time setup (required):** In the repo on GitHub, open **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**. Without this, the site will not update from `PrecisionTyper/`.

After pushing to **`main`**, wait for **Deploy GitHub Pages** to finish, then hard-refresh (`Cmd+Shift+R`).

## How to Run

### Java Projects
1. Open the terminal
2. Compile: `javac PrecisionTyper.java` (or `javac TypeRacerGame.java`)
3. Run: `java PrecisionTyper` (or `java TypeRacerGame`)

### Web Edition
**Option 1: Use the Live Website** ⭐ Recommended
- Visit: **[https://zhoulinhua0-star.github.io/TypeRacerGame/](https://zhoulinhua0-star.github.io/TypeRacerGame/)**
- No installation needed!

**Option 2: Run Locally**
1. Download the repository
2. From the repository root, start a static server:
   ```bash
   python3 -m http.server 8000
   ```
3. Open **[http://localhost:8000/PrecisionTyper/](http://localhost:8000/PrecisionTyper/)**
4. Use **Play now** to enter the typing canvas

Opening `PrecisionTyper/index.html` directly also works. If the browser blocks `texts.json` under `file://`, the app uses its smaller built-in fallback database; a local server is recommended for the complete 134-passage collection.

## File Structure

```
TypeRacerGame/
├── TypeRacerGame.java          # Console-based version
├── PrecisionTyper.java         # Java Swing GUI version
├── PrecisionTyper/             # Web edition (GitHub Pages publishes this folder)
│   ├── index.html              # Landing page → live at /TypeRacerGame/
│   ├── game.html               # Typing game → live at /TypeRacerGame/game.html
│   ├── website.css             # Landing page styles
│   ├── website.js              # Landing navigation, reveals, and keyboard-guide dialog
│   ├── styles.css              # Canvas, Zen, Focus, theme, and responsive styles
│   ├── script.js               # Typing, timing, persistence, and procedural audio
│   └── texts.json              # General, Calm, Quotes, and Code passages
├── .github/workflows/          # Deploy GitHub Pages (publishes PrecisionTyper/)
├── .nojekyll                   # GitHub Pages helper (static site hosting)
├── README.md                   # This file
├── LICENSE                     # MIT License
└── .gitignore
```

## License

This project is open-source and available under the MIT License.
