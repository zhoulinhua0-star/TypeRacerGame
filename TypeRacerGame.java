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

    // Predefined sentences for typing practice
    private static final String[] SENTENCES = {
            "Practice makes perfect and consistency is the key to success.",
            "Java is a powerful language for building reliable applications.",
            "Typing faster comes from accuracy not rushing your fingers.",
            "Learning programming requires patience and logical thinking.",
            "Small progress every day leads to big achievements."
    };

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        // Aggregate statistics across all rounds
        double totalTime = 0;           // Total time in seconds for all sentences
        int totalCorrectChars = 0;      // Total correctly typed characters
        int totalChars = 0;             // Total characters across all sentences
        int totalWords = 0;             // Total words across all sentences

        // Game introduction
        System.out.println("===== CONSOLE TYPE RACER =====");
        System.out.println("\nPress ENTER to start the game!");
        scanner.nextLine();  // Wait for user input to start

        // Iterate through each sentence in the predefined list
        for (int round = 0; round < SENTENCES.length; round++) {
            String sentence = SENTENCES[round];

            // Display round header
            if (round != 0) {
                System.out.println("\n--- Round " + (round + 1) + " ---");
            } else {
                System.out.println("--- Round " + (round + 1) + " ---");
            }

            // Display sentence to type
            System.out.println("Type the following sentence:");
            System.out.println(sentence);

            // Record start time for this round
            long startTime = System.currentTimeMillis();

            // Capture user input
            String userInput = scanner.nextLine();

            // Record end time for this round
            long endTime = System.currentTimeMillis();

            // Calculate time taken in seconds
            double timeTaken = (endTime - startTime) / 1000.0;
            totalTime += timeTaken;

            // Calculate number of correct characters
            int correctChars = 0;
            int minLength = Math.min(userInput.length(), sentence.length());
            for (int i = 0; i < minLength; i++) {
                if (userInput.charAt(i) == sentence.charAt(i)) {
                    correctChars++;
                }
            }

            // Update aggregate statistics
            totalCorrectChars += correctChars;
            totalChars += sentence.length();
            totalWords += sentence.split(" ").length;

            // Calculate accuracy and words per minute (WPM) for this round
            double accuracy = ((double) correctChars / sentence.length()) * 100;
            double wpm = (sentence.split(" ").length / timeTaken) * 60;

            // Display round results
            System.out.println("\n--- Result ---");
            System.out.printf("Time: %.2f seconds%n", timeTaken);
            System.out.printf("Accuracy: %.2f%%%n", accuracy);
            System.out.printf("Speed: %.2f WPM%n", wpm);
        }

        // Display final summary across all rounds if at least one round was completed
        if (totalTime > 0) {
            double overallAccuracy = ((double) totalCorrectChars / totalChars) * 100;
            double overallWPM = (totalWords / totalTime) * 60;

            System.out.println("\n===== FINAL SUMMARY =====");
            System.out.printf("Average time: %.2f seconds%n", totalTime / SENTENCES.length);
            System.out.printf("Overall accuracy: %.2f%%%n", overallAccuracy);
            System.out.printf("Overall speed: %.2f WPM%n", overallWPM);
        }

        // Close the scanner to release resources
        scanner.close();
    }
}
