const vader = require('vader-sentiment');
const config = require('../config');

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

        this.moodEmojis = config.moodEmojis;
        this.workKeywords = ['work', 'working', 'busy', 'studying', 'coding', 'programming'];
        
        // Define direct mood keywords
        this.directMoods = {
            'working': ['work', 'working', 'busy', 'coding', 'studying'],
            'sleeping': ['sleep', 'sleeping', 'sleepy', 'tired', 'nap'],
            'eating': ['eat', 'eating', 'food', 'hungry', 'lunch', 'dinner'],
            'confused': ['confused', 'unsure', 'puzzled'],
            'happy': ['happy', 'glad', 'excited', 'joy'],
            'awkward': ['awkward', 'weird'],
            'celebration': ['celebration', 'party', 'celebrate'],
            'birthday': ['birthday', 'bday'],
            'with-girlfriend': ['girlfriend', 'date', 'dating']
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
            
            const intensity = vader.SentimentIntensityAnalyzer.polarity_scores(text);
            console.log('📊 VADER scores:', intensity);

            let mood = 'normal';
            let confidence = Math.abs(intensity.compound);
            let additionalEmojis = [];
            
            // Check for direct mood mentions first
            const lowerText = text.toLowerCase();
            for (const [moodType, keywords] of Object.entries(this.directMoods)) {
                if (keywords.some(word => lowerText.includes(word))) {
                    mood = moodType;
                    confidence = 0.9;  // High confidence for direct mood mentions
                    console.log(`🎯 Direct mood match: ${mood} (confidence: ${confidence})`);
                    break;
                }
            }

            // If no direct mood found, use sentiment analysis
            if (mood === 'normal') {
                if (intensity.compound >= 0.5) {
                    mood = 'happy';
                    additionalEmojis = ['⭐', '✨'];
                } else if (intensity.compound <= -0.5) {
                    mood = 'tired';
                    additionalEmojis = ['💫'];
                } else if (intensity.compound > 0.2) {
                    mood = 'celebration';
                    additionalEmojis = ['🌟'];
                } else if (intensity.compound < -0.2) {
                    mood = 'confused';
                    additionalEmojis = ['❓'];
                }
            }

            // Add mood-specific emojis
            switch (mood) {
                case 'sleeping':
                    additionalEmojis = ['💤', '🛏️'];
                    break;
                case 'eating':
                    additionalEmojis = ['🍽️', '🍴'];
                    break;
                case 'working':
                    additionalEmojis = ['💻', '📚'];
                    break;
                case 'birthday':
                    additionalEmojis = ['🎂', '🎈'];
                    break;
                case 'with-girlfriend':
                    additionalEmojis = ['❤️', '💕'];
                    break;
                case 'awkward':
                    additionalEmojis = ['😅', '😳'];
                    break;
            }

            console.log(`🎭 Final mood detection: ${mood} (confidence: ${confidence})`);

            return {
                mood: mood,
                scores: intensity,
                confidence: confidence,
                mainEmoji: this.moodEmojis[mood],
                additionalEmojis: additionalEmojis
            };
        } catch (error) {
            console.error('❌ Error analyzing mood:', error);
            return {
                mood: 'normal',
                scores: { compound: 0, pos: 0, neg: 0, neu: 1 },
                confidence: 0,
                mainEmoji: this.moodEmojis['normal'],
                additionalEmojis: []
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