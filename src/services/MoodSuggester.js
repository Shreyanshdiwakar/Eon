class MoodSuggester {
    constructor(statsManager) {
        this.statsManager = statsManager;
        this.timePatterns = {
            morning: ['working', 'tired', 'normal'],
            afternoon: ['working', 'eating', 'confused'],
            evening: ['tired', 'eating', 'with-girlfriend'],
            night: ['sleeping', 'tired', 'normal']
        };
    }

    getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 17) return 'afternoon';
        if (hour >= 17 && hour < 22) return 'evening';
        return 'night';
    }

    async suggestMood(interaction) {
        try {
            const timeOfDay = this.getTimeOfDay();
            console.log(`⏰ Time of day: ${timeOfDay}`);

            // Get stats and last mood
            const stats = this.statsManager.getStats();
            const lastMood = stats.lastMood;
            console.log(`📊 Last mood: ${lastMood}`);

            // Initialize weights with time patterns
            const moodWeights = {};
            this.timePatterns[timeOfDay].forEach(mood => {
                moodWeights[mood] = (moodWeights[mood] || 0) + 1;
            });

            // Add weight for last used mood
            if (lastMood) {
                moodWeights[lastMood] = (moodWeights[lastMood] || 0) + 3;
            }

            // Add weights for most common moods
            if (stats.percentages) {
                Object.entries(stats.percentages).forEach(([mood, percentage]) => {
                    moodWeights[mood] = (moodWeights[mood] || 0) + (parseFloat(percentage) / 20);
                });
            }

            // Get top 3 suggestions
            const suggestions = Object.entries(moodWeights)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([mood]) => mood);

            console.log('💡 Suggested moods:', suggestions);
            return suggestions;
        } catch (error) {
            console.error('❌ Error suggesting mood:', error);
            return ['normal', 'happy', 'tired']; // fallback suggestions
        }
    }
}

module.exports = MoodSuggester; 