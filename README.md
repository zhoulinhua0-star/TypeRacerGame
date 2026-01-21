# TypeRacerGame

A simple typing game to practice typing speed and accuracy. This repository contains both console-based and GUI versions, plus a modern web application.

## Projects

### Project 1: Console-Based Edition
**TypeRacerGame.java** - A console-based typing game written in Java. Users type a series of predefined sentences, and the program calculates typing time, accuracy, and words per minute (WPM) for each round, with an overall summary at the end.

### Project 2: GUI Precision Edition (Java Swing)
**PrecisionTyper.java** - A precision-focused desktop typing application built with Java Swing. Designed for users who want to master both speed and 100% accuracy. Unlike casual typing games, this "Strict Edition" requires a perfect match of the target text before allowing a successful submission. Features include:
- Real-time Light/Dark mode toggle
- Custom-coded mechanical "tock" sound generator
- Persistent theme settings
- Three difficulty levels (Easy, Medium, Hard)
- Full comprehensive text database

### Project 3: Web Edition ⭐ NEW
**Modern Web Application** - A complete conversion of the Java Swing application to a modern, browser-based typing trainer. No installation required - just open `index.html` in your browser!

#### Features:
- **Three Difficulty Levels**: Easy, Medium, and Hard with curated text samples
- **Real-time Statistics**: 
  - Words Per Minute (WPM)
  - Accuracy percentage
  - Elapsed time
- **Visual Feedback**: 
  - Green for correct characters
  - Red underline for incorrect characters
  - Grey for untyped characters
  - Yellow highlight for the next character position
- **Sound Effects**: Procedural mechanical click sounds using Web Audio API
- **Theme Support**: Dark and Light modes with persistent settings (localStorage)
- **Responsive Design**: Works on desktop and mobile devices
- **100% Accuracy Required**: Must perfectly match the target text to complete

#### How to Use the Web Version:
1. Open `index.html` in a modern web browser
2. Select your difficulty level (Easy, Medium, or Hard)
3. Start typing in the input area below the target text
4. The timer starts automatically when you begin typing
5. Watch your real-time WPM and accuracy statistics
6. Complete the text with 100% accuracy to finish

#### Settings:
- **Difficulty**: Choose between Easy, Medium, and Hard text samples
- **Sound**: Toggle click sounds on/off
- **Light Mode**: Switch between dark and light themes (preference is saved)

#### Browser Compatibility:
Requires a modern browser with support for:
- ES6 JavaScript
- Web Audio API
- CSS Custom Properties (CSS Variables)
- LocalStorage

Tested on Chrome, Firefox, Safari, and Edge.

#### Deployment:
The web version can be easily deployed to:
- **GitHub Pages** (free static hosting)
- Netlify
- Vercel
- AWS S3
- Any static web server

No build process required - just upload the HTML, CSS, and JS files!

---

## Technical Specifications

### Java Projects (Project 1 & 2)
* **Language:** Java 21+
* **Library:** Swing / AWT (Project 2)
* **OS Compatibility:** Windows, macOS, Linux
* **IDE Recommended:** VS Code / IntelliJ IDEA

### Web Project (Project 3)
* **Technologies:** HTML5, CSS3, Vanilla JavaScript (ES6+)
* **Dependencies:** None - pure client-side application
* **Browser Compatibility:** Modern browsers (Chrome, Firefox, Safari, Edge)
* **Hosting:** Any static web server

## How to Run

### Java Projects:
1. Open the terminal.
2. Compile: `javac PrecisionTyper.java` (or `javac TypeRacerGame.java`)
3. Run: `java PrecisionTyper` (or `java TypeRacerGame`)

### Web Project:
1. Simply open `index.html` in your web browser
2. No installation or compilation needed!

## File Structure

```
TypeRacerGame/
├── TypeRacerGame.java          # Console-based version
├── PrecisionTyper.java          # Java Swing GUI version
├── index.html                   # Web version - Main HTML
├── styles.css                   # Web version - Styling
├── script.js                    # Web version - Game logic
└── README.md                    # This file
```

## License

This project is open-source and available under the MIT License.
