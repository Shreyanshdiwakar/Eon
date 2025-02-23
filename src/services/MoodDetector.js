const vader = require('vader-sentiment');

class MoodDetector {
    constructor() {
        console.log('🔧 Initializing MoodDetector...');
        // Updated emotion mappings to match your images
        this.emotionMappings = {
            // High positive emotions
            celebration: ['party', 'celebrate', 'congratulations', 'achievement'],
            happy: ['happy', 'joy', 'excited', 'great', 'wonderful'],
            priyanshi: ['priyanshi', 'love', 'date', 'romantic'],
            birthday: ['birthday', 'cake', 'anniversary'],
            
            // Eating keywords (combined for random selection)
            food: ['eating', 'food', 'hungry', 'lunch', 'dinner', 'breakfast', 'snack', 'meal', 'yummy'],
            
            // Neutral/Working states
            working: ['work', 'busy', 'coding', 'studying'],
            normal: ['okay', 'fine', 'normal', 'alright'],
            
            // Negative states
            confused: ['confused', 'unsure', 'what', 'why', 'how'],
            tired: ['tired', 'exhausted', 'sleepy', 'fatigue'],
            awkward: ['awkward', 'uncomfortable', 'weird'],
            sleeping: ['sleep', 'goodnight', 'night', 'bed']
        };

        // VADER thresholds
        this.thresholds = {
            high_pos: 0.5,
            low_pos: 0.1,
            low_neg: -0.1,
            high_neg: -0.5
        };
    }

    async analyzeMood(message) {
        try {
            const lowerMessage = message.toLowerCase();
            const intensity = vader.SentimentIntensityAnalyzer.polarity_scores(message);

            // First check for specific keywords
            for (const [mood, keywords] of Object.entries(this.emotionMappings)) {
                if (keywords.some(word => lowerMessage.includes(word))) {
                    return mood;
                }
            }

            // If no keywords found, use sentiment analysis
            const compound = intensity.compound;
            
            if (compound >= this.thresholds.high_pos) {
                return 'happy';
            } else if (compound <= this.thresholds.high_neg) {
                return 'tired';
            } else if (compound <= this.thresholds.low_neg) {
                return 'confused';
            } else if (compound >= this.thresholds.low_pos) {
                return 'normal';
            }

            return 'normal';
        } catch (error) {
            console.error('Error analyzing mood:', error);
            return 'normal';
        }
    }

    async getDetailedAnalysis(text) {
        try {
            console.log(`\n🔍 Analyzing text: "${text}"`);
            
            // Get VADER sentiment scores
            const intensity = vader.SentimentIntensityAnalyzer.polarity_scores(text);
            console.log('📊 VADER scores:', intensity);

            // Determine mood based on compound score
            let mood = 'normal';  // default mood
            
            if (intensity.compound >= 0.5) {
                mood = 'happy';
            } else if (intensity.compound <= -0.5) {
                mood = 'tired';  // using tired for negative emotions
            } else if (intensity.compound > 0.2) {
                mood = 'celebration';
            } else if (intensity.compound < -0.2) {
                mood = 'confused';
            }

            // Check for specific keywords
            const lowerText = text.toLowerCase();
            if (lowerText.includes('sleep') || lowerText.includes('tired')) {
                mood = 'sleeping';
            } else if (lowerText.includes('eat') || lowerText.includes('food') || lowerText.includes('hungry')) {
                mood = 'eating';
            } else if (lowerText.includes('work') || lowerText.includes('busy')) {
                mood = 'working';
            } else if (lowerText.includes('birthday')) {
                mood = 'birthday';
            } else if (lowerText.includes('love') || lowerText.includes('girlfriend')) {
                mood = 'with-girlfriend';
            } else if (lowerText.includes('awkward')) {
                mood = 'awkward';
            }

            console.log(`🎭 Detected mood: ${mood}`);

            return {
                mood: mood,
                scores: intensity,
                confidence: Math.abs(intensity.compound)
            };
        } catch (error) {
            console.error('❌ Error analyzing mood:', error);
            return {
                mood: 'normal',
                scores: {
                    compound: 0,
                    pos: 0,
                    neg: 0,
                    neu: 1
                },
                confidence: 0
            };
        }
    }

    // Helper method to check if text contains any of the words
    containsAny(text, words) {
        const lowerText = text.toLowerCase();
        return words.some(word => lowerText.includes(word));
    }
}

module.exports = MoodDetector;

// Test the mood detector
async function testMoodDetector() {
    const detector = new MoodDetector();
    
    const testMessages = [
        "I am so happy today! 😊",
        "This is absolutely amazing!",
        "I'm feeling really sad and down",
        "This makes me so angry and frustrated!",
        "The weather is okay",
        "I hate this so much! 😠",
        "This is the worst day ever 😢"
    ];

    for (const message of testMessages) {
        const analysis = await detector.getDetailedAnalysis(message);
        console.log('\nMessage:', message);
        console.log('Analysis:', analysis);
    }
}

testMoodDetector();
testMoodDetector();