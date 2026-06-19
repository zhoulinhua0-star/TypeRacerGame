# TypeRacerGame

A collection of typing speed and accuracy trainers with three implementations: console-based, desktop GUI, and modern web application.

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

The Web Edition of PrecisionTyper is a modern, browser-based typing trainer designed to help you improve your typing speed and accuracy from anywhere, on any device. Simply open the website in your browser and start practicing immediately.

**🌐 [Access the Web Application](https://zhoulinhua0-star.github.io/TypeRacerGame/)**

#### 🎯 Why Use PrecisionTyper Web Edition?

Whether you're a student, professional, or casual typist, PrecisionTyper helps you build muscle memory and typing confidence through focused practice. The strict 100% accuracy requirement ensures you develop proper typing habits, not just speed.

#### 🚀 Quick Start

1. **Open the Application**
   - Visit: **[https://zhoulinhua0-star.github.io/TypeRacerGame/](https://zhoulinhua0-star.github.io/TypeRacerGame/)**
   - Or open `PrecisionTyper/index.html` locally in your browser
   - No downloads, installations, or account creation required

2. **Choose Your Difficulty Level**
   - **Easy**: Short, simple sentences perfect for beginners
   - **Medium**: Moderate-length passages for intermediate typists
   - **Hard**: Complex, longer texts to challenge advanced users

3. **Start Typing**
   - Type the text shown in the display area
   - The timer starts automatically when you begin
   - Match every character exactly - 100% accuracy is required

4. **Track Your Progress**
   - Watch real-time statistics:
     - **WPM (Words Per Minute)**: Your typing speed
     - **Accuracy**: Percentage of correct characters
     - **Time**: Elapsed time since you started

5. **Complete the Challenge**
   - Finish typing the entire text with perfect accuracy
   - Review your final statistics
   - Select a new text to continue practicing

#### 💡 Pro Tips for Best Results

- **Start with Easy**: Build confidence with shorter texts before progressing
- **Focus on Accuracy**: Speed comes naturally with proper technique
- **Practice Regularly**: Consistent daily practice yields better results than long sporadic sessions
- **Use Visual Feedback**: Pay attention to the color-coded characters:
  - 🟢 **Green** = Correct
  - 🔴 **Red** = Mistake (fix it!)
  - ⚪ **Grey** = Not yet typed
  - 🟡 **Yellow** = Current position
- **Customize Your Experience**: Toggle sound effects and switch between dark/light themes in the settings

#### 🎨 Features

- **Real-Time Feedback**: Instant visual and statistical feedback as you type
- **Three Difficulty Levels**: Progress from beginner to advanced at your own pace
- **Theme Support**: Dark and light modes with automatic preference saving
- **Sound Effects**: Optional mechanical click sounds for enhanced focus
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **No Setup Required**: Open and start practicing immediately

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
2. Open `PrecisionTyper/index.html` in your web browser (landing page), then use **Play** to open `game.html`
3. Start practicing immediately

## File Structure

```
TypeRacerGame/
├── TypeRacerGame.java          # Console-based version
├── PrecisionTyper.java         # Java Swing GUI version
├── PrecisionTyper/             # Web edition (GitHub Pages publishes this folder)
│   ├── index.html              # Landing page → live at /TypeRacerGame/
│   ├── game.html               # Typing game → live at /TypeRacerGame/game.html
│   ├── website.css             # Landing page styles
│   ├── website.js              # Landing page behavior (smooth scroll, nav, reveals)
│   ├── styles.css              # Game styles
│   ├── script.js               # Game logic
│   └── texts.json              # Typing passages (easy / medium / hard)
├── .github/workflows/          # Deploy GitHub Pages (publishes PrecisionTyper/)
├── .nojekyll                   # GitHub Pages helper (static site hosting)
├── README.md                   # This file
├── LICENSE                     # MIT License
└── .gitignore
```

**ui-ux-pro-max (Cursor skill):** Under `.cursor/skills/ui-ux-pro-max/` this repo includes an optional [Cursor](https://cursor.com) Agent skill used when designing or polishing UI: it runs a local Python search tool (`scripts/search.py`) over bundled design data to suggest design systems, color and typography pairings, layout patterns, and UX checklists. You do not need it to run the Java or web apps; it is tooling for contributors who use Cursor. Thanks to the resources from [ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill).

## License

This project is open-source and available under the MIT License.
