This repository consists of two files regarding a simple type racer game.

### Project 1: Console-Based Edition
TypeRacerGame.java is a console-based typing game written in Java to practice typing speed and accuracy. Users type a series of predefined sentences, and the program calculates typing time, accuracy, and words per minute (WPM) for each round, with an overall summary at the end. 

### Project 2: GUI Precision Edition
PrecisionTyper.java is a more advanced and (more importantly) cooler version marked by the generation of the "window" which is also more challenging for users: a precision-focused desktop typing application built with Java Swing. Designed for users who want to master both speed and 100% accuracy. Unlike casual typing games, this "Strict Edition" requires a perfect match of the target text before allowing a successful submission. What makes it even cooler is that it features a real-time Light/Dark mode toggle and uses a custom-coded mechanical "tock" generator.

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

---

### Technical Specifications
* **Language:** Java 21+
* **Library:** Swing / AWT (Project 2)
* **OS Compatibility:** Windows, macOS, Linux
* **IDE Recommended:** VS Code / IntelliJ IDEA

**Web Version (Project 3):**
* **Technologies:** HTML5, CSS3, Vanilla JavaScript (ES6+)
* **Dependencies:** None - pure client-side application
* **Browser Compatibility:** Modern browsers (Chrome, Firefox, Safari, Edge)
* **Hosting:** Any static web server (GitHub Pages, Netlify, Vercel, etc.)

### How to Run

**Java Projects:**
1. Open the terminal.
2. Compile: `javac PrecisionTyper.java` (or `javac TypeRacerGame.java`)
3. Run: `java PrecisionTyper` (or `java TypeRacerGame`)

**Web Version:**
1. Simply open `index.html` in your web browser
2. No installation or compilation needed!

---

### License 
This project is open-source and available under the MIT License.
