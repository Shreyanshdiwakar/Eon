const fs = require('fs').promises;
const path = require('path');

class StatisticsManager {
    constructor() {
        this.stats = {
            totalMoodChanges: 0,
            moodCounts: {},
            dailyStats: {},
            lastMood: null,
            lastMoodTime: null
        };
        this.statsFile = path.join(__dirname, '../../data/moodStats.json');
        this.loadStats();
    }

    async loadStats() {
        try {
            const data = await fs.readFile(this.statsFile, 'utf8');
            this.stats = JSON.parse(data);
            console.log('Loaded mood statistics');
        } catch (error) {
            console.log('No existing stats found, starting fresh');
            await this.saveStats();
        }
    }

    async saveStats() {
        try {
            await fs.mkdir(path.dirname(this.statsFile), { recursive: true });
            await fs.writeFile(this.statsFile, JSON.stringify(this.stats, null, 2));
        } catch (error) {
            console.error('Error saving stats:', error);
        }
    }

    async recordMoodChange(mood, userId) {
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        this.stats.totalMoodChanges++;
        this.stats.moodCounts[mood] = (this.stats.moodCounts[mood] || 0) + 1;

        if (!this.stats.dailyStats[today]) {
            this.stats.dailyStats[today] = {
                moodCounts: {},
                totalChanges: 0
            };
        }
        this.stats.dailyStats[today].moodCounts[mood] = 
            (this.stats.dailyStats[today].moodCounts[mood] || 0) + 1;
        this.stats.dailyStats[today].totalChanges++;

        this.stats.lastMood = mood;
        this.stats.lastMoodTime = now.toISOString();

        await this.saveStats();
    }

    getStats() {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const todayStats = this.stats.dailyStats[today] || { moodCounts: {}, totalChanges: 0 };

        const totalMoods = Object.values(this.stats.moodCounts).reduce((a, b) => a + b, 0) || 1;
        const moodPercentages = {};
        for (const [mood, count] of Object.entries(this.stats.moodCounts)) {
            moodPercentages[mood] = ((count / totalMoods) * 100).toFixed(1);
        }

        const mostCommonMood = Object.entries(this.stats.moodCounts)
            .sort(([,a], [,b]) => b - a)[0];

        return {
            total: this.stats.totalMoodChanges,
            today: todayStats.totalChanges,
            percentages: moodPercentages,
            mostCommon: mostCommonMood ? mostCommonMood[0] : 'none',
            lastMood: this.stats.lastMood,
            lastMoodTime: this.stats.lastMoodTime
        };
    }

    async getUserMoodHistory(userId, limit = 10) {
        try {
            // This is a simple in-memory implementation
            // You might want to use a database in production
            return this.moodHistory
                .filter(entry => entry.userId === userId)
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, limit);
        } catch (error) {
            console.error('Error getting user mood history:', error);
            return [];
        }
    }
}

module.exports = StatisticsManager; 