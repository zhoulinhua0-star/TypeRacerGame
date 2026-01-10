import java.awt.*;
import java.io.*;
import java.util.Random;
import java.util.Scanner;
import javax.sound.sampled.*;
import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.event.DocumentEvent;
import javax.swing.event.DocumentListener;
import javax.swing.text.*;

/**
 * PrecisionTyper: 
 * A rigorous typing speed and accuracy trainer.
 * Requires 100% character-match accuracy for completion.
 * - Procedural Mechanical Click Engine (White Noise Version)
 * - Persistent Theme (Dark/Light)
 * - Full Comprehensive Database
 */
public class PrecisionTyper {

    // --- FULL TEXT DATABASE RESTORED ---
    private static final String[][] TEXT_DATABASE = {
        { // EASY
            "The sun rises in the east and sets in the west.",
            "System.out.println(\"Hello, World!\");",
            "A rolling stone gathers no moss.",
            "Clean code is happy code.",
            "Java is a high-level, class-based, object-oriented language.",
            "Practice makes perfect.",
            "Keep it simple, stupid (KISS).",
            "Debugging is like being the detective in a crime movie.",
            "While there is life, there is hope."
        },
        { // MEDIUM
            "Success is not final, failure is not fatal: it is the courage to continue that counts.",
            "Programming is the art of telling another human what one wants the computer to do.",
            "The quick brown fox jumps over the lazy dog. This sentence contains every letter in the alphabet.",
            "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.",
            "Happiness can be found, even in the darkest of times, if one only remembers to turn on the light.",
            "Logic will get you from A to B. Imagination will take you everywhere.",
            "The only way to do great work is to love what you do. If you haven't found it yet, keep looking."
        },
        { // HARD
            "To be, or not to be, that is the question: Whether 'tis nobler in the mind to suffer the slings and arrows of outrageous fortune, or to take arms against a sea of troubles.",
            "A computer is like a violin. You can imagine it making music, but you have to learn how to play it. It takes thousands of hours of practice to become a virtuoso.",
            "Complexity is the enemy of reliability. Therefore, we must strive for simplicity in our architectures. A well-designed system is one that is easy to reason about.",
            "In software engineering, loose coupling is a design goal that seeks to reduce the interdependencies between components of a system with the goal of reducing the risk that changes in one component will require changes in any other component.",
            "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity."
        }
    };

    // Colors
    private Color bgColor, fgColor, accentColor;
    private static final Color GREEN_TEXT = new Color(100, 255, 100);
    private static final Color RED_TEXT = new Color(255, 100, 100);
    private static final Color GREY_TEXT = new Color(120, 120, 120);
    private static final Color CURSOR_COLOR = new Color(255, 255, 0, 100);

    private String currentTargetText;
    private JFrame frame;
    private JTextPane textDisplay;
    private JTextArea inputArea; 
    private JLabel timerLabel, wpmLabel, accuracyLabel;
    private JComboBox<String> difficultyBox;
    private JCheckBox soundToggle, modeToggle;
    private JPanel mainPanel, topPanel, configPanel, statsBar, centerPanel;
    
    private Timer gameTimer;
    private boolean isGameRunning = false;
    private int secondsElapsed = 0;
    private final Random random = new Random();
    private final ClickSoundEngine soundEngine = new ClickSoundEngine();
    private final String CONFIG_FILE = "config.txt";

    public static void main(String[] args) {
        SwingUtilities.invokeLater(PrecisionTyper::new);
    }

    public PrecisionTyper() {
        loadSettings(); // Load user theme preference
        pickNewText(1);
        initializeUI();
    }

    private void pickNewText(int difficultyIndex) {
        String[] options = TEXT_DATABASE[difficultyIndex];
        currentTargetText = options[random.nextInt(options.length)];
    }

    private void initializeUI() {
        frame = new JFrame("PrecisionTyper - Ultimate Edition"); 
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.setSize(1100, 850); 
        frame.setLocationRelativeTo(null);

        mainPanel = new JPanel(new BorderLayout(20, 20));
        mainPanel.setBorder(new EmptyBorder(20, 30, 20, 30));

        topPanel = new JPanel(new BorderLayout());
        configPanel = new JPanel(new FlowLayout(FlowLayout.LEFT));
        
        difficultyBox = new JComboBox<>(new String[]{"Easy", "Medium", "Hard"});
        difficultyBox.setSelectedIndex(1);
        difficultyBox.addActionListener(e -> resetGame());
        difficultyBox.setFocusable(false);
        
        soundToggle = new JCheckBox("Sound", true);
        soundToggle.setFocusable(false);

        modeToggle = new JCheckBox("Light Mode", (bgColor.getRed() > 100));
        modeToggle.setFocusable(false);
        modeToggle.addActionListener(e -> { toggleTheme(); saveSettings(); });

        configPanel.add(new JLabel("Difficulty: "));
        configPanel.add(difficultyBox);
        configPanel.add(soundToggle);
        configPanel.add(modeToggle);
        
        statsBar = new JPanel(new GridLayout(1, 3, 20, 0));
        statsBar.setPreferredSize(new Dimension(500, 50));
        
        timerLabel = createStatLabel("Time: 0s");
        wpmLabel = createStatLabel("WPM: 0");
        accuracyLabel = createStatLabel("Accuracy: 100%");

        statsBar.add(timerLabel);
        statsBar.add(wpmLabel);
        statsBar.add(accuracyLabel);

        topPanel.add(configPanel, BorderLayout.WEST);
        topPanel.add(statsBar, BorderLayout.CENTER);

        centerPanel = new JPanel(new GridLayout(2, 1, 0, 20));
        textDisplay = new JTextPane();
        textDisplay.setEditable(false);
        textDisplay.setFont(new Font("Monospaced", Font.BOLD, 26));
        textDisplay.setMargin(new Insets(20, 20, 20, 20));
        
        inputArea = new JTextArea();
        inputArea.setFont(new Font("Monospaced", Font.PLAIN, 26));
        inputArea.setLineWrap(true);
        inputArea.setWrapStyleWord(true);
        inputArea.setMargin(new Insets(20, 20, 20, 20));
        inputArea.setFocusTraversalKeys(KeyboardFocusManager.FORWARD_TRAVERSAL_KEYS, java.util.Collections.emptySet());

        centerPanel.add(new JScrollPane(textDisplay));
        centerPanel.add(new JScrollPane(inputArea));

        mainPanel.add(topPanel, BorderLayout.NORTH);
        mainPanel.add(centerPanel, BorderLayout.CENTER);
        frame.add(mainPanel);

        inputArea.getDocument().addDocumentListener(new DocumentListener() {
            public void insertUpdate(DocumentEvent e) { handle(true); }
            public void removeUpdate(DocumentEvent e) { handle(true); }
            public void changedUpdate(DocumentEvent e) { handle(false); }
            private void handle(boolean playSound) {
                SwingUtilities.invokeLater(() -> {
                    checkProgress();
                    if (playSound && soundToggle.isSelected()) soundEngine.playClick();
                });
            }
        });

        refreshUI();
        frame.setVisible(true);
        inputArea.requestFocusInWindow();
    }

    private void toggleTheme() {
        if (modeToggle.isSelected()) {
            bgColor = new Color(245, 245, 245); fgColor = Color.BLACK; accentColor = Color.WHITE;
        } else {
            bgColor = new Color(30, 30, 30); fgColor = new Color(220, 220, 220); accentColor = new Color(60, 63, 65);
        }
        refreshUI();
    }

    private void refreshUI() {
        frame.getContentPane().setBackground(bgColor);
        for (JPanel p : new JPanel[]{mainPanel, topPanel, configPanel, statsBar, centerPanel}) p.setBackground(bgColor);
        for (JCheckBox cb : new JCheckBox[]{soundToggle, modeToggle}) { cb.setBackground(bgColor); cb.setForeground(fgColor); }
        textDisplay.setBackground(accentColor);
        inputArea.setBackground(accentColor); 
        inputArea.setForeground(fgColor);
        inputArea.setCaretColor(modeToggle.isSelected() ? Color.BLACK : Color.WHITE);
        for (JLabel l : new JLabel[]{timerLabel, wpmLabel, accuracyLabel}) {
            l.setBackground(accentColor);
            l.setForeground(modeToggle.isSelected() ? new Color(0, 102, 204) : new Color(87, 199, 255));
        }
        updateTextStyles(inputArea.getText());
    }

    private void saveSettings() {
        try (PrintWriter out = new PrintWriter(new File(CONFIG_FILE))) {
            out.println(modeToggle.isSelected() ? "LIGHT" : "DARK");
        } catch (Exception e) {}
    }

    private void loadSettings() {
        File f = new File(CONFIG_FILE);
        boolean isLight = false;
        if (f.exists()) {
            try (Scanner sc = new Scanner(f)) { if (sc.hasNext()) isLight = sc.next().equals("LIGHT"); } catch (Exception e) {}
        }
        if (isLight) {
            bgColor = new Color(245, 245, 245); fgColor = Color.BLACK; accentColor = Color.WHITE;
        } else {
            bgColor = new Color(30, 30, 30); fgColor = new Color(220, 220, 220); accentColor = new Color(60, 63, 65);
        }
    }

    private JLabel createStatLabel(String text) {
        JLabel label = new JLabel(text, SwingConstants.CENTER);
        label.setFont(new Font("Monospaced", Font.BOLD, 20));
        label.setOpaque(true);
        label.setBorder(BorderFactory.createLineBorder(Color.GRAY, 1));
        return label;
    }

    private void startTimer() {
        if (isGameRunning) return;
        isGameRunning = true;
        gameTimer = new Timer(1000, e -> {
            secondsElapsed++;
            timerLabel.setText("Time: " + secondsElapsed + "s");
            updateLiveStats();
        });
        gameTimer.start();
    }

    private void checkProgress() {
        String typed = inputArea.getText().replace("\n", "").replace("\r", "");
        if (!isGameRunning && !typed.isEmpty()) startTimer();
        updateTextStyles(typed);
        updateLiveStats();
        if (typed.equals(currentTargetText)) gameOver();
    }

    private void updateLiveStats() {
        String typed = inputArea.getText().replace("\n", "").replace("\r", "");
        if (typed.isEmpty()) return;
        double mins = Math.max(secondsElapsed / 60.0, 0.01);
        wpmLabel.setText("WPM: " + (int)((typed.length() / 5.0) / mins));
        int correct = 0;
        int len = Math.min(typed.length(), currentTargetText.length());
        for (int i = 0; i < len; i++) if (typed.charAt(i) == currentTargetText.charAt(i)) correct++;
        accuracyLabel.setText("Accuracy: " + (int)((double)correct / Math.max(typed.length(), 1) * 100) + "%");
    }

    private void updateTextStyles(String typed) {
        StyledDocument doc = textDisplay.getStyledDocument();
        SimpleAttributeSet c = new SimpleAttributeSet(), w = new SimpleAttributeSet(), r = new SimpleAttributeSet(), h = new SimpleAttributeSet();
        StyleConstants.setForeground(c, GREEN_TEXT);
        StyleConstants.setForeground(w, RED_TEXT); StyleConstants.setUnderline(w, true);
        StyleConstants.setForeground(r, GREY_TEXT);
        StyleConstants.setBackground(h, CURSOR_COLOR);
        try {
            doc.remove(0, doc.getLength());
            for (int i = 0; i < currentTargetText.length(); i++) {
                if (i < typed.length()) {
                    boolean match = typed.charAt(i) == currentTargetText.charAt(i);
                    doc.insertString(doc.getLength(), String.valueOf(currentTargetText.charAt(i)), match ? c : w);
                } else {
                    doc.insertString(doc.getLength(), String.valueOf(currentTargetText.charAt(i)), i == typed.length() ? h : r);
                }
            }
        } catch (Exception e) {}
    }

    private void gameOver() {
        if (gameTimer != null) gameTimer.stop();
        isGameRunning = false;
        JOptionPane.showMessageDialog(frame, "Done!\n" + wpmLabel.getText() + "\n" + accuracyLabel.getText());
        resetGame();
    }

    private void resetGame() {
        if (gameTimer != null) gameTimer.stop();
        secondsElapsed = 0; isGameRunning = false;
        timerLabel.setText("Time: 0s"); wpmLabel.setText("WPM: 0"); accuracyLabel.setText("Accuracy: 100%");
        inputArea.setText(""); pickNewText(difficultyBox.getSelectedIndex());
        updateTextStyles(""); inputArea.requestFocusInWindow();
    }

    /**
     * Mechanical Sound Engine: Procedural White Noise Version
     */
    private static class ClickSoundEngine {
        private byte[] clickSoundData;
        private AudioFormat format;

        public ClickSoundEngine() {
            try {
                format = new AudioFormat(44100, 8, 1, true, false);
                int durationMs = 25;
                int bufferSize = (int)(44100 * (durationMs / 1000.0));
                clickSoundData = new byte[bufferSize];

                Random r = new Random();
                for (int i = 0; i < clickSoundData.length; i++) {
                    double noise = (r.nextDouble() * 2.0) - 1.0; 
                    double decay = 1.0 - ((double)i / clickSoundData.length);
                    double amplitude = noise * (decay * decay); 
                    clickSoundData[i] = (byte)(amplitude * 127);
                }
            } catch (Exception e) { e.printStackTrace(); }
        }

        public void playClick() {
            try {
                SourceDataLine line = AudioSystem.getSourceDataLine(format);
                line.open(format); line.start();
                line.write(clickSoundData, 0, clickSoundData.length);
                line.drain(); line.close();
            } catch (Exception e) {}
        }
    }
}
