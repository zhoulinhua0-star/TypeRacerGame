import java.awt.*;
import java.awt.event.*;
import javax.swing.*;
import javax.swing.text.*;

/**
 * PrecisionTyper: A rigorous typing speed and accuracy trainer.
 * Requires 100% character-match accuracy for completion.
 */
public class PrecisionTyper { 

    // --- Settings ---
    private static final String TARGET_TEXT = 
        "The quick brown fox jumps over the lazy dog. Programming is the art of telling another human what one wants the computer to do. Success is not final, failure is not fatal: it is the courage to continue that counts.";
    
    // --- UI Components ---
    private JFrame frame;
    private JPanel cardPanel;
    private CardLayout cardLayout;
    
    // Game Screen Components
    private JTextPane textDisplay;
    private JTextField inputField;
    private JLabel timerLabel;
    private JLabel instructionsLabel;
    
    // Logic Variables
    private Timer gameTimer;
    private boolean isGameRunning = false;
    private int secondsElapsed = 0;

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            try {
                UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
            } catch (Exception e) {
                e.printStackTrace();
            }
            new PrecisionTyper(); 
        });
    }

    public PrecisionTyper() {
        initializeUI();
    }

    private void initializeUI() {
        frame = new JFrame("PrecisionTyper - Accuracy Challenge"); 
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.setSize(1000, 800);
        frame.setLocationRelativeTo(null);

        cardLayout = new CardLayout();
        cardPanel = new JPanel(cardLayout);

        JPanel gamePanel = createGamePanel();
        cardPanel.add(gamePanel, "GAME");
        cardPanel.add(new JPanel(), "RESULT"); 

        frame.add(cardPanel);
        frame.setVisible(true);
        
        updateTextStyles(""); 
    }

    private JPanel createGamePanel() {
        JPanel panel = new JPanel(new BorderLayout(20, 20));
        panel.setBorder(BorderFactory.createEmptyBorder(30, 30, 30, 30));

        // --- TOP ---
        JPanel topPanel = new JPanel(new BorderLayout());
        instructionsLabel = new JLabel("Strict Mode: Match the text exactly to complete the challenge.");
        instructionsLabel.setFont(new Font("SansSerif", Font.BOLD, 16));
        
        timerLabel = new JLabel("Time: 0s");
        timerLabel.setFont(new Font("Monospaced", Font.BOLD, 24));
        timerLabel.setForeground(new Color(0, 102, 204));

        topPanel.add(instructionsLabel, BorderLayout.WEST);
        topPanel.add(timerLabel, BorderLayout.EAST);
        panel.add(topPanel, BorderLayout.NORTH);

        // --- CENTER ---
        textDisplay = new JTextPane();
        textDisplay.setEditable(false);
        textDisplay.setFont(new Font("SansSerif", Font.PLAIN, 28));
        textDisplay.setText(TARGET_TEXT);
        
        StyledDocument doc = textDisplay.getStyledDocument();
        SimpleAttributeSet leftAlign = new SimpleAttributeSet();
        StyleConstants.setAlignment(leftAlign, StyleConstants.ALIGN_LEFT);
        doc.setParagraphAttributes(0, doc.getLength(), leftAlign, false);
        
        JScrollPane scrollPane = new JScrollPane(textDisplay);
        scrollPane.setBorder(null);
        panel.add(scrollPane, BorderLayout.CENTER);

        // --- BOTTOM ---
        inputField = new JTextField();
        inputField.setFont(new Font("SansSerif", Font.PLAIN, 24));
        inputField.setBorder(BorderFactory.createCompoundBorder(
            BorderFactory.createLineBorder(Color.GRAY, 1),
            BorderFactory.createEmptyBorder(10, 10, 10, 10)));

        inputField.addKeyListener(new KeyAdapter() {
            @Override
            public void keyReleased(KeyEvent e) {
                if (e.getKeyCode() != KeyEvent.VK_ENTER) {
                    checkProgress(false); 
                }
            }
        });

        inputField.addActionListener(e -> checkProgress(true));

        panel.add(inputField, BorderLayout.SOUTH);

        return panel;
    }

    private void startTimer() {
        if (isGameRunning) return;
        isGameRunning = true;
        
        gameTimer = new Timer(1000, e -> {
            secondsElapsed++;
            timerLabel.setText("Time: " + secondsElapsed + "s");
        });
        gameTimer.start();
    }

    private void checkProgress(boolean enterPressed) {
        String typed = inputField.getText();

        if (!isGameRunning && typed.length() > 0) {
            startTimer();
        }

        updateTextStyles(typed);

        if (typed.equals(TARGET_TEXT)) {
            gameOver();
        } 
        else if (enterPressed) {
            if (typed.trim().equals(TARGET_TEXT)) {
                gameOver(); 
            } else {
                JOptionPane.showMessageDialog(frame, 
                    "Validation Failed: Input does not match target text.\nCorrect all red characters and check punctuation.", 
                    "Precision Required", 
                    JOptionPane.ERROR_MESSAGE);
            }
        }
    }

    private void updateTextStyles(String typed) {
        StyledDocument doc = textDisplay.getStyledDocument();
        
        SimpleAttributeSet greenStyle = new SimpleAttributeSet();
        StyleConstants.setForeground(greenStyle, new Color(0, 153, 0));
        StyleConstants.setBold(greenStyle, true);

        SimpleAttributeSet redStyle = new SimpleAttributeSet();
        StyleConstants.setForeground(redStyle, Color.RED);
        StyleConstants.setStrikeThrough(redStyle, true);

        SimpleAttributeSet grayStyle = new SimpleAttributeSet();
        StyleConstants.setForeground(grayStyle, Color.GRAY);

        try {
            doc.remove(0, doc.getLength());
            for (int i = 0; i < TARGET_TEXT.length(); i++) {
                String charStr = String.valueOf(TARGET_TEXT.charAt(i));
                if (i < typed.length()) {
                    if (typed.charAt(i) == TARGET_TEXT.charAt(i)) {
                        doc.insertString(doc.getLength(), charStr, greenStyle);
                    } else {
                        doc.insertString(doc.getLength(), charStr, redStyle);
                    }
                } else {
                    doc.insertString(doc.getLength(), charStr, grayStyle);
                }
            }
        } catch (BadLocationException e) {
            e.printStackTrace();
        }
    }

    private void gameOver() {
        if (gameTimer != null) gameTimer.stop();
        isGameRunning = false;
        inputField.setEditable(false);

        double minutes = secondsElapsed / 60.0;
        if (minutes == 0) minutes = 0.01;
        int wordCount = TARGET_TEXT.split(" ").length;
        int wpm = (int) (wordCount / minutes);

        JPanel resultPanel = new JPanel(new GridBagLayout());
        resultPanel.setBackground(new Color(240, 240, 240));
        
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.gridx = 0;
        gbc.gridy = 0;
        gbc.insets = new Insets(10, 10, 10, 10);

        JLabel title = new JLabel("Accuracy Validated!");
        title.setFont(new Font("SansSerif", Font.BOLD, 40));
        title.setForeground(new Color(0, 153, 0));
        resultPanel.add(title, gbc);

        gbc.gridy++;
        JLabel wpmLabel = new JLabel("Speed: " + wpm + " WPM");
        wpmLabel.setFont(new Font("SansSerif", Font.PLAIN, 30));
        resultPanel.add(wpmLabel, gbc);

        gbc.gridy++;
        JLabel timeLabel = new JLabel("Duration: " + secondsElapsed + "s");
        timeLabel.setFont(new Font("SansSerif", Font.PLAIN, 24));
        resultPanel.add(timeLabel, gbc);

        gbc.gridy++;
        JButton retryButton = new JButton("Reset Challenge");
        retryButton.setFont(new Font("SansSerif", Font.BOLD, 20));
        retryButton.setPreferredSize(new Dimension(200, 50));
        retryButton.addActionListener(e -> restartGame());
        resultPanel.add(retryButton, gbc);

        cardPanel.add(resultPanel, "RESULT");
        cardLayout.show(cardPanel, "RESULT");
    }

    private void restartGame() {
        frame.dispose();
        new PrecisionTyper(); 
    }
}
