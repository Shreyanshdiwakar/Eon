const { AttachmentBuilder } = require('discord.js');
const QuickChart = require('quickchart-js');

class GraphGenerator {
    constructor() {
        this.colors = {
            happy: '#FFD700',      // Gold
            normal: '#808080',     // Gray
            tired: '#4169E1',      // Royal Blue
            confused: '#FF6B6B',   // Coral
            working: '#32CD32',    // Lime Green
            sleeping: '#9370DB',   // Medium Purple
            eating: '#FFA500',     // Orange
            celebration: '#FF69B4', // Hot Pink
            birthday: '#FF1493',   // Deep Pink
            'with-girlfriend': '#FF69B4', // Hot Pink
            awkward: '#DDA0DD'     // Plum
        };
    }

    async generateDailyTrendGraph(moodHistory, days = 7) {
        try {
            console.log('📊 Generating daily trend graph...');
            
            const dailyData = this.processDailyMoods(moodHistory, days);
            
            const chart = new QuickChart();
            chart.setWidth(800);
            chart.setHeight(400);
            chart.setBackgroundColor('#2F3136');
            
            chart.setConfig({
                type: 'line',
                data: {
                    labels: dailyData.labels,
                    datasets: [{
                        label: 'Mood Trend',
                        data: dailyData.data,
                        borderColor: '#FFFFFF',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: `Mood Trends - Last ${days} Days`,
                            color: '#FFFFFF',
                            font: { size: 16 }
                        },
                        legend: {
                            labels: { color: '#FFFFFF' }
                        }
                    },
                    scales: {
                        y: {
                            grid: { color: '#444444' },
                            ticks: { color: '#FFFFFF' },
                            title: {
                                display: true,
                                text: 'Mood Score',
                                color: '#FFFFFF'
                            }
                        },
                        x: {
                            grid: { color: '#444444' },
                            ticks: { color: '#FFFFFF' }
                        }
                    }
                }
            });

            const url = await chart.getShortUrl();
            const response = await fetch(url);
            const buffer = await response.arrayBuffer();
            
            return new AttachmentBuilder(Buffer.from(buffer), { name: 'mood-trend.png' });
        } catch (error) {
            console.error('❌ Error generating trend graph:', error);
            return null;
        }
    }

    async generateMoodDistributionGraph(moodHistory) {
        try {
            console.log('📊 Generating mood distribution graph...');
            
            // Count mood occurrences
            const moodCounts = {};
            moodHistory.forEach(entry => {
                moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
            });

            const configuration = {
                type: 'doughnut',
                data: {
                    labels: Object.keys(moodCounts),
                    datasets: [{
                        data: Object.values(moodCounts),
                        backgroundColor: Object.keys(moodCounts).map(mood => this.colors[mood] || '#808080'),
                        borderColor: '#2F3136',
                        borderWidth: 2
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Mood Distribution',
                            color: '#FFFFFF',
                            font: { size: 16 }
                        },
                        legend: {
                            position: 'right',
                            labels: { color: '#FFFFFF' }
                        }
                    }
                }
            };

            const image = await this.chartJSNodeCanvas.renderToBuffer(configuration);
            return new AttachmentBuilder(image, { name: 'mood-distribution.png' });
        } catch (error) {
            console.error('❌ Error generating distribution graph:', error);
            return null;
        }
    }

    processDailyMoods(moodHistory, days) {
        const now = new Date();
        const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
        
        // Create array of dates
        const dates = Array.from({length: days}, (_, i) => {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            return date.toISOString().split('T')[0];
        });

        // Calculate mood scores for each day
        const dailyScores = {};
        dates.forEach(date => {
            dailyScores[date] = { total: 0, count: 0 };
        });

        moodHistory.forEach(entry => {
            const date = new Date(entry.timestamp).toISOString().split('T')[0];
            if (dailyScores[date]) {
                dailyScores[date].total += this.getMoodScore(entry.mood);
                dailyScores[date].count++;
            }
        });

        // Calculate averages and prepare data
        const data = dates.map(date => {
            if (dailyScores[date].count === 0) return null;
            return dailyScores[date].total / dailyScores[date].count;
        });

        return {
            labels: dates.map(date => new Date(date).toLocaleDateString()),
            data: data
        };
    }

    getMoodScore(mood) {
        const moodScores = {
            'happy': 1.0,
            'celebration': 0.9,
            'birthday': 0.8,
            'with-girlfriend': 0.7,
            'normal': 0.5,
            'working': 0.4,
            'eating': 0.3,
            'confused': 0.2,
            'tired': 0.1,
            'sleeping': 0.0,
            'awkward': 0.3
        };
        return moodScores[mood] || 0.5;
    }
}

module.exports = GraphGenerator; 