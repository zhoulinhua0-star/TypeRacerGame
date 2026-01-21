import java.util.Scanner;

/**
 * ConsoleTypeRacer
 *
 * A simple console-based typing game that measures typing speed and accuracy.
 * Users type a series of predefined sentences, and for each sentence, the program
 * calculates:
 *   - Time taken to type the sentence
 *   - Number of correct characters
 *   - Typing accuracy
 *   - Words per minute (WPM)
 *
 * After all rounds are completed, an overall summary is displayed.
 */
public class TypeRacerGame {

    private static final String[] SENTENCES = {
            "Practice makes perfect and consistency is the key to success.",
            "Java is a powerful language for building reliable applications.",
            "Typing faster comes from accuracy not rushing your fingers.",
            "Learning programming reasoning requires patience and logical thinking.",
            "Small progress every day leads to big achievements."
    };

    private final Scanner scanner = new Scanner(System.in);
    
    private double totalTime = 0;
    private int totalCorrectChars = 0;
    private int totalChars = 0;
    private int totalWords = 0;

    public static void main(String[] args) {
        TypeRacerGame game = new TypeRacerGame();
        game.run();
    }

    /**
     * Controls the main flow of the game.
     */
    public void run() {
        showIntroduction();
        for (int i = 0; i < SENTENCES.length; i++) {
            playRound(i + 1, SENTENCES[i]);
        }
        showFinalSummary();
        scanner.close();
    }

    private void showIntroduction() {
        System.out.println("===== CONSOLE TYPE RACER =====");
        System.out.println("\nPress ENTER to start the game!");
        scanner.nextLine();
    }

    /**
     * Handles the logic for a single round of typing.
     */
    private void playRound(int roundNumber, String targetSentence) {
        if (roundNumber == 1) {
            System.out.println("\n--- Round " + roundNumber + " ---");
        } else {
            System.out.println("\n\n--- Round " + roundNumber + " ---");
        }
        System.out.println("Type the following sentence:");
        System.out.println(">> " + targetSentence);

        long startTime = System.currentTimeMillis();
        String userInput = scanner.nextLine();
        long endTime = System.currentTimeMillis();

        processResults(targetSentence, userInput, startTime, endTime);
    }

    /**
     * Calculates and displays statistics for the current round.
     */
    private void processResults(String target, String input, long start, long end) {
        double timeTaken = (end - start) / 1000.0;
        int correctChars = calculateCorrectChars(target, input);
        int wordCount = target.split(" ").length;

        // Update Global Stats
        totalTime += timeTaken;
        totalCorrectChars += correctChars;
        totalChars += target.length();
        totalWords += wordCount;

        displayRoundStats(timeTaken, target.length(), correctChars, wordCount);
    }

    private int calculateCorrectChars(String target, String input) {
        int correct = 0;
        int lengthToCompare = Math.min(input.length(), target.length());
        
        for (int i = 0; i < lengthToCompare; i++) {
            if (input.charAt(i) == target.charAt(i)) {
                correct++;
            }
        }
        return correct;
    }

    private void displayRoundStats(double time, int totalLen, int correctLen, int words) {
        double accuracy = ((double) correctLen / totalLen) * 100;
        double wpm = (words / time) * 60;

        System.out.println("\n--- Round Result ---");
        System.out.printf("Time: %.2f s | Accuracy: %.2f%% | Speed: %.2f WPM%n", 
                          time, accuracy, wpm);
    }

    private void showFinalSummary() {
        if (totalTime == 0) { return; }

        double overallAccuracy = ((double) totalCorrectChars / totalChars) * 100;
        double overallWPM = (totalWords / totalTime) * 60;

        System.out.println("\n============================");
        System.out.println("      FINAL SUMMARY");
        System.out.println("============================");
        System.out.printf("Avg Time per Round: %.2f s%n", totalTime / SENTENCES.length);
        System.out.printf("Overall Accuracy:   %.2f%%%n", overallAccuracy);
        System.out.printf("Overall Speed:      %.2f WPM%n", overallWPM);
        System.out.println("============================");
    }
}
