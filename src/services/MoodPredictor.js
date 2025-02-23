const { EmbedBuilder } = require('discord.js');

class MoodPredictor {
    constructor(statsManager) {
        this.statsManager = statsManager;
        this.timePatterns = {
            weekday: {
                morning: ['working', 'normal', 'tired'],
                afternoon: ['working', 'eating', 'normal'],
                evening: ['tired', 'eating', 'with-girlfriend'],
                night: ['sleeping', 'tired', 'normal']
            },
            weekend: {
                morning: ['sleeping', 'normal', 'happy'],
                afternoon: ['eating', 'celebration', 'with-girlfriend'],
                evening: ['celebration', 'eating', 'happy'],
                night: ['tired', 'sleeping', 'normal']
            }
        };
    }

    async predictTomorrowsMood() {
        try {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            const isWeekend = tomorrow.getDay() === 0 || tomorrow.getDay() === 6;
            const dayType = isWeekend ? 'weekend' : 'weekday';
            
            // Get user's mood history
            const history = await this.statsManager.getMoodHistory();
            const patterns = this.analyzeMoodPatterns(history);
            
            // Generate predictions for each time period
            const predictions = {};
            for (const [timeOfDay, possibleMoods] of Object.entries(this.timePatterns[dayType])) {
                predictions[timeOfDay] = this.predictMoodForTime(
                    possibleMoods,
                    patterns,
                    timeOfDay,
                    dayType
                );
            }

            return this.createPredictionEmbed(predictions, tomorrow, dayType);
        } catch (error) {
            console.error('❌ Error predicting mood:', error);
            return null;
        }
    }

    analyzeMoodPatterns(history) {
        const patterns = {
            timeOfDay: {},
            dayType: {
                weekday: {},
                weekend: {}
            },
            sequential: {}
        };

        history.forEach((entry, index) => {
            const date = new Date(entry.timestamp);
            const timeOfDay = this.getTimeOfDay(date);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const dayType = isWeekend ? 'weekend' : 'weekday';

            // Time of day patterns
            patterns.timeOfDay[timeOfDay] = patterns.timeOfDay[timeOfDay] || {};
            patterns.timeOfDay[timeOfDay][entry.mood] = (patterns.timeOfDay[timeOfDay][entry.mood] || 0) + 1;

            // Day type patterns
            patterns.dayType[dayType][entry.mood] = (patterns.dayType[dayType][entry.mood] || 0) + 1;

            // Sequential patterns (what mood typically follows another)
            if (index > 0) {
                const prevMood = history[index - 1].mood;
                patterns.sequential[prevMood] = patterns.sequential[prevMood] || {};
                patterns.sequential[prevMood][entry.mood] = (patterns.sequential[prevMood][entry.mood] || 0) + 1;
            }
        });

        return patterns;
    }

    predictMoodForTime(possibleMoods, patterns, timeOfDay, dayType) {
        const weights = {};
        
        possibleMoods.forEach(mood => {
            weights[mood] = 1; // Base weight

            // Add weight from time of day patterns
            if (patterns.timeOfDay[timeOfDay]?.[mood]) {
                weights[mood] += patterns.timeOfDay[timeOfDay][mood] * 2;
            }

            // Add weight from day type patterns
            if (patterns.dayType[dayType]?.[mood]) {
                weights[mood] += patterns.dayType[dayType][mood];
            }

            // Add weight from sequential patterns if we have a last mood
            const lastMood = this.statsManager.getStats().lastMood;
            if (lastMood && patterns.sequential[lastMood]?.[mood]) {
                weights[mood] += patterns.sequential[lastMood][mood] * 1.5;
            }
        });

        // Sort and get top 2 predictions
        return Object.entries(weights)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 2)
            .map(([mood]) => mood);
    }

    getTimeOfDay(date) {
        const hour = date.getHours();
        if (hour >= 5 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 17) return 'afternoon';
        if (hour >= 17 && hour < 22) return 'evening';
        return 'night';
    }

    createPredictionEmbed(predictions, tomorrow, dayType) {
        const embed = new EmbedBuilder()
            .setColor('#FF69B4')
            .setTitle('🔮 Tomorrow\'s Mood Prediction')
            .setDescription(`Here's what I predict for ${tomorrow.toDateString()}\n(${dayType.charAt(0).toUpperCase() + dayType.slice(1)})`)
            .addFields(
                {
                    name: '🌅 Morning',
                    value: predictions.morning.map(mood => `• ${mood}`).join('\n'),
                    inline: true
                },
                {
                    name: '☀️ Afternoon',
                    value: predictions.afternoon.map(mood => `• ${mood}`).join('\n'),
                    inline: true
                },
                {
                    name: '🌆 Evening',
                    value: predictions.evening.map(mood => `• ${mood}`).join('\n'),
                    inline: true
                },
                {
                    name: '🌙 Night',
                    value: predictions.night.map(mood => `• ${mood}`).join('\n'),
                    inline: true
                }
            )
            .setFooter({ text: 'Based on your mood patterns and daily routines' })
            .setTimestamp();

        return embed;
    }
}

module.exports = MoodPredictor; 