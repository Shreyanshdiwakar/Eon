const fs = require('fs').promises;
const path = require('path');
const GraphGenerator = require('./GraphGenerator');

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
        this.graphGenerator = new GraphGenerator();
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

    async generateGraphs() {
        try {
            const QuickChart = require('quickchart-js');

            // Get mood data
            const moodData = this.getMoodData();

            // Create trend chart
            const trendChart = new QuickChart();
            trendChart
                .setWidth(800)
                .setHeight(400)
                .setConfig({
                    type: 'line',
                    data: {
                        labels: moodData.dates,
                        datasets: [{
                            label: 'Mood Changes',
                            data: moodData.counts,
                            fill: false,
                            borderColor: 'rgb(75, 192, 192)',
                            tension: 0.1
                        }]
                    },
                    options: {
                        plugins: {
                            title: {
                                display: true,
                                text: 'Mood Changes Over Time'
                            }
                        }
                    }
                });

            // Create distribution chart
            const distributionChart = new QuickChart();
            distributionChart
                .setWidth(800)
                .setHeight(400)
                .setConfig({
                    type: 'bar',
                    data: {
                        labels: Object.keys(moodData.distribution),
                        datasets: [{
                            label: 'Mood Distribution',
                            data: Object.values(moodData.distribution),
                            backgroundColor: 'rgba(75, 192, 192, 0.6)'
                        }]
                    },
                    options: {
                        plugins: {
                            title: {
                                display: true,
                                text: 'Mood Distribution'
                            }
                        }
                    }
                });

            // Get URLs for the charts
            const trendUrl = trendChart.getUrl();
            const distributionUrl = distributionChart.getUrl();

            return { trend: trendUrl, distribution: distributionUrl };
        } catch (error) {
            console.error('Error generating graphs:', error);
            return null;
        }
    }

    getMoodData() {
        // Get data from your storage
        const moodHistory = this.loadMoodHistory();
        
        // Process data for graphs
        const dates = [];
        const counts = [];
        const distribution = {};

        // Last 7 days
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            dates.push(date.toLocaleDateString());
            counts.push(0);
        }

        // Count moods
        moodHistory.forEach(entry => {
            const date = new Date(entry.timestamp).toLocaleDateString();
            const dateIndex = dates.indexOf(date);
            if (dateIndex !== -1) {
                counts[dateIndex]++;
            }

            distribution[entry.mood] = (distribution[entry.mood] || 0) + 1;
        });

        return { dates, counts, distribution };
    }

    async getUserStats(userId) {
        try {
            const stats = this.loadStats();
            const userStats = stats[userId] || {
                moods: [],
                lastUpdate: null
            };

            const todayChanges = this.countTodayChanges(userStats.moods);
            const totalChanges = userStats.moods.length;
            const mostCommonMood = this.getMostCommonMood(userStats.moods);

            return {
                todayChanges,
                totalChanges,
                mostCommonMood
            };
        } catch (error) {
            console.error('Error getting user stats:', error);
            throw error;
        }
    }

    loadStats() {
        try {
            const fs = require('fs');
            if (!fs.existsSync(this.statsFile)) {
                return {};
            }
            return JSON.parse(fs.readFileSync(this.statsFile, 'utf8'));
        } catch (error) {
            console.error('Error loading stats:', error);
            return {};
        }
    }

    countTodayChanges(moods) {
        const today = new Date().toDateString();
        return moods.filter(mood => 
            new Date(mood.timestamp).toDateString() === today
        ).length;
    }

    getMostCommonMood(moods) {
        if (!moods.length) return 'None';
        
        const counts = moods.reduce((acc, mood) => {
            acc[mood.type] = (acc[mood.type] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])[0][0];
    }
}

module.exports = StatisticsManager; 