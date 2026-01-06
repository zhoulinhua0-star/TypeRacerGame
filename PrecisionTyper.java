import java.awt.*;
import javax.swing.*;
import javax.swing.event.DocumentEvent;
import javax.swing.event.DocumentListener;
import javax.swing.text.*;

/**
 * PrecisionTyper: A rigorous typing speed and accuracy trainer.
 * Requires 100% character-match accuracy for completion.
 */
public class PrecisionTyper {

    private static final String TARGET_TEXT = 
        "The quick brown fox jumps over the lazy dog. Programming is the art of telling another human what one wants the computer to do. Success is not final, failure is not fatal: it is the courage to continue that counts.";
    
    private JFrame frame;
    private JTextPane textDisplay;
    private JTextArea inputArea; 
    private JLabel timerLabel, wpmLabel, accuracyLabel;
    
    private Timer gameTimer;
    private boolean isGameRunning = false;
    private int secondsElapsed = 0;

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            try {
                UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
            } catch (Exception e) {}
            new PrecisionTyper(); 
        });
    }

    public PrecisionTyper() {
        initializeUI();
    }

    private void initializeUI() {
        frame = new JFrame("PrecisionTyper - Focus Mode"); 
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.setSize(1100, 850); 
        frame.setLocationRelativeTo(null);

        JPanel mainPanel = new JPanel(new BorderLayout(20, 20));
        mainPanel.setBorder(BorderFactory.createEmptyBorder(20, 30, 20, 30));

        // --- STATS BAR ---
        JPanel statsBar = new JPanel(new GridLayout(1, 3, 10, 0));
        statsBar.setPreferredSize(new Dimension(1100, 60));
        
        timerLabel = createStatLabel("Time: 0s");
        wpmLabel = createStatLabel("WPM: 0");
        accuracyLabel = createStatLabel("Accuracy: 100%");

        statsBar.add(timerLabel);
        statsBar.add(wpmLabel);
        statsBar.add(accuracyLabel);
        mainPanel.add(statsBar, BorderLayout.NORTH);

        // --- CENTER PANEL ---
        JPanel centerPanel = new JPanel(new GridLayout(2, 1, 10, 20));

        textDisplay = new JTextPane();
        textDisplay.setEditable(false);
        textDisplay.setFont(new Font("Monospaced", Font.BOLD, 24));
        textDisplay.setMargin(new Insets(15, 15, 15, 15));
        textDisplay.setBackground(new Color(250, 250, 250));
        
        JScrollPane scrollTarget = new JScrollPane(textDisplay);
        scrollTarget.setBorder(BorderFactory.createTitledBorder("Target Text"));
        centerPanel.add(scrollTarget);

        inputArea = new JTextArea();
        inputArea.setFont(new Font("Monospaced", Font.PLAIN, 24));
        inputArea.setLineWrap(true);
        inputArea.setWrapStyleWord(true);
        inputArea.setMargin(new Insets(15, 15, 15, 15));
        
        // Tab key would normally move focus; this makes it type a space instead
        inputArea.setFocusTraversalKeysEnabled(false); 

        JScrollPane scrollInput = new JScrollPane(inputArea);
        scrollInput.setBorder(BorderFactory.createTitledBorder("Your Typing Area"));
        centerPanel.add(scrollInput);

        mainPanel.add(centerPanel, BorderLayout.CENTER);

        inputArea.getDocument().addDocumentListener(new DocumentListener() {
            public void insertUpdate(DocumentEvent e) { handle(); }
            public void removeUpdate(DocumentEvent e) { handle(); }
            public void changedUpdate(DocumentEvent e) { handle(); }
            private void handle() {
                SwingUtilities.invokeLater(() -> checkProgress());
            }
        });

        frame.add(mainPanel);
        frame.setVisible(true);
        updateTextStyles(""); 
    }

    private JLabel createStatLabel(String text) {
        JLabel label = new JLabel(text, SwingConstants.CENTER);
        label.setFont(new Font("SansSerif", Font.BOLD, 20));
        label.setOpaque(true);
        label.setBackground(Color.WHITE);
        label.setBorder(BorderFactory.createLineBorder(Color.LIGHT_GRAY));
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
        // FIX: Remove newlines and carriage returns so "Enter" doesn't break the match
        String rawTyped = inputArea.getText();
        String cleanedTyped = rawTyped.replace("\n", "").replace("\r", "");

        if (!isGameRunning && !cleanedTyped.isEmpty()) startTimer();

        updateTextStyles(cleanedTyped);
        updateLiveStats();

        // Check against target text exactly
        if (cleanedTyped.equals(TARGET_TEXT)) {
            gameOver();
        }
    }

    private void updateLiveStats() {
        String typed = inputArea.getText().replace("\n", "").replace("\r", "");
        if (typed.isEmpty()) return;

        double minutes = Math.max(secondsElapsed / 60.0, 0.01);
        int wpm = (int) ((typed.length() / 5.0) / minutes);
        wpmLabel.setText("WPM: " + wpm);

        int correctChars = 0;
        int minLen = Math.min(typed.length(), TARGET_TEXT.length());
        for (int i = 0; i < minLen; i++) {
            if (typed.charAt(i) == TARGET_TEXT.charAt(i)) correctChars++;
        }
        int accuracy = (int) ((double) correctChars / Math.max(typed.length(), 1) * 100);
        accuracyLabel.setText("Accuracy: " + accuracy + "%");
    }

    private void updateTextStyles(String typed) {
        StyledDocument doc = textDisplay.getStyledDocument();
        SimpleAttributeSet green = new SimpleAttributeSet();
        StyleConstants.setForeground(green, new Color(34, 139, 34));

        SimpleAttributeSet red = new SimpleAttributeSet();
        StyleConstants.setForeground(red, Color.RED);
        StyleConstants.setUnderline(red, true);

        SimpleAttributeSet gray = new SimpleAttributeSet();
        StyleConstants.setForeground(gray, Color.LIGHT_GRAY);

        SimpleAttributeSet cursorHighlight = new SimpleAttributeSet();
        StyleConstants.setBackground(cursorHighlight, new Color(255, 255, 180));

        try {
            doc.remove(0, doc.getLength());
            for (int i = 0; i < TARGET_TEXT.length(); i++) {
                String charStr = String.valueOf(TARGET_TEXT.charAt(i));
                if (i < typed.length()) {
                    doc.insertString(doc.getLength(), charStr, 
                        typed.charAt(i) == TARGET_TEXT.charAt(i) ? green : red);
                } else if (i == typed.length()) {
                    doc.insertString(doc.getLength(), charStr, cursorHighlight);
                } else {
                    doc.insertString(doc.getLength(), charStr, gray);
                }
            }
        } catch (BadLocationException e) {}
    }

    private void gameOver() {
        if (gameTimer != null) gameTimer.stop();
        isGameRunning = false;
        inputArea.setEditable(false);

        JOptionPane.showMessageDialog(frame, 
            "Success! The strings matched perfectly.\n" + wpmLabel.getText() + "\nFinal Time: " + secondsElapsed + "s", 
            "Finished", JOptionPane.INFORMATION_MESSAGE);
        
        frame.dispose();
        new PrecisionTyper();
    }
}
