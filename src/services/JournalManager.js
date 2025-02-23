const { EmbedBuilder } = require('discord.js');

class JournalManager {
    constructor(client, statsManager) {
        this.client = client;
        this.statsManager = statsManager;
        this.journalHour = 20; // 8 PM
        this.journalMinute = 0;
    }

    async generateDailySummary(userId) {
        try {
            console.log(`📔 Generating daily summary for user ${userId}`);
            const stats = this.statsManager.getStats();
            const userHistory = await this.statsManager.getUserMoodHistory(userId);
            
            // Get today's moods
            const today = new Date();
            const todayMoods = userHistory.filter(entry => {
                const entryDate = new Date(entry.timestamp);
                return entryDate.toDateString() === today.toDateString();
            });

            // Create embed
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('📊 Your Daily Mood Journal')
                .setDescription(`Here's your mood summary for ${today.toDateString()}`)
                .addFields(
                    { 
                        name: '🎭 Today\'s Moods', 
                        value: todayMoods.length > 0 
                            ? todayMoods.map(m => `• ${m.mood} (${new Date(m.timestamp).toLocaleTimeString()})`).join('\n')
                            : 'No mood changes today'
                    },
                    { 
                        name: '📈 Most Common Mood', 
                        value: stats.mostCommon || 'Not enough data'
                    },
                    {
                        name: '💭 Current Mood',
                        value: stats.lastMood || 'No current mood'
                    }
                )
                .setTimestamp()
                .setFooter({ text: 'Daily Mood Journal' });

            return embed;
        } catch (error) {
            console.error('❌ Error generating daily summary:', error);
            return null;
        }
    }

    async sendDailyJournal(userId) {
        try {
            console.log(`📬 Sending daily journal to user ${userId}`);
            const user = await this.client.users.fetch(userId);
            const summary = await this.generateDailySummary(userId);

            if (summary) {
                await user.send({ embeds: [summary] });
                console.log('✅ Daily journal sent successfully');
            }
        } catch (error) {
            console.error('❌ Error sending daily journal:', error);
        }
    }

    scheduleDaily(userId) {
        console.log(`⏰ Scheduling daily journal for user ${userId}`);
        
        // Calculate initial delay
        const now = new Date();
        let scheduledTime = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            this.journalHour,
            this.journalMinute
        );

        if (scheduledTime < now) {
            scheduledTime.setDate(scheduledTime.getDate() + 1);
        }

        const delay = scheduledTime.getTime() - now.getTime();

        // Schedule initial send
        setTimeout(() => {
            this.sendDailyJournal(userId);
            
            // Set up daily interval
            setInterval(() => {
                this.sendDailyJournal(userId);
            }, 24 * 60 * 60 * 1000);
        }, delay);

        console.log(`📅 Daily journal scheduled for ${scheduledTime.toLocaleString()}`);
    }
}

module.exports = JournalManager; 