const vaderSentiment = require('vader-sentiment');

class MoodDetector {
    constructor() {
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
            const intensity = vaderSentiment.SentimentIntensityAnalyzer.polarity_scores(message);

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

    async getDetailedAnalysis(message) {
        try {
            const intensity = vaderSentiment.SentimentIntensityAnalyzer.polarity_scores(message);
            let mood = 'normal';

            // Check for specific keywords first
            for (const [emotion, keywords] of Object.entries(this.emotionMappings)) {
                if (keywords.some(keyword => message.toLowerCase().includes(keyword))) {
                    // Special handling for food-related messages
                    if (emotion === 'food') {
                        mood = Math.random() < 0.5 ? 'eating' : 'eating1';
                    } else {
                        mood = emotion;
                    }
                    break;
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

            return {
                mood: mood,
                scores: {
                    compound: intensity.compound,
                    positive: intensity.pos,
                    negative: intensity.neg,
                    neutral: intensity.neu
                },
                message: message
            };
        } catch (error) {
            console.error('Error in mood analysis:', error);
            return {
                mood: 'normal',
                scores: {
                    compound: 0,
                    pos: 0,
                    neg: 0,
                    neu: 0
                }
            };
        }
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