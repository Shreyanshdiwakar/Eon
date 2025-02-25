class MoodManager {
    constructor(instagramManager, statsManager) {
        this.instagramManager = instagramManager;
        this.statsManager = statsManager;
        this.lastMood = null;
    }

    async updateMood(mood, userId, interaction) {
        try {
            // Don't update if it's the same mood
            if (mood === this.lastMood) {
                await interaction.reply({
                    content: '🤔 You\'re already in this mood! No need to update.',
                    ephemeral: true
                });
                return true;
            }

            // Check time limits from InstagramManager
            const now = Date.now();
            const timeSinceLastUpdate = now - this.instagramManager.lastUpdate;
            
            if (this.instagramManager.updateCount >= this.instagramManager.maxUpdatesPerDay) {
                await interaction.reply({
                    content: `⚠️ Daily limit reached! You've updated your mood ${this.instagramManager.maxUpdatesPerDay} times today.\n`
                        + `This limit helps prevent Instagram from flagging your account for automated behavior.\n`
                        + `Try again tomorrow!`,
                    ephemeral: true
                });
                return false;
            }

            if (timeSinceLastUpdate < this.instagramManager.minTimeBetweenUpdates) {
                const waitTime = Math.ceil((this.instagramManager.minTimeBetweenUpdates - timeSinceLastUpdate) / 60000);
                await interaction.reply({
                    content: `⏳ Please wait ${waitTime} more minutes before changing your mood again.\n`
                        + `This helps prevent Instagram from detecting automated behavior on your account.\n`
                        + `Updates left today: ${this.instagramManager.maxUpdatesPerDay - this.instagramManager.updateCount}`,
                    ephemeral: true
                });
                return false;
            }

            // Update Instagram profile picture
            const updated = await this.instagramManager.updateProfilePicture(mood);
            
            if (!updated) {
                await interaction.reply({
                    content: '⚠️ Your mood was recorded, but Instagram profile picture update was delayed to prevent automation detection.',
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: `✅ Mood updated to ${mood}!\n`
                        + `Updates left today: ${this.instagramManager.maxUpdatesPerDay - this.instagramManager.updateCount}`,
                    ephemeral: true
                });
            }

            // Update stats regardless of Instagram success
            await this.statsManager.recordMood(mood, userId);
            this.lastMood = mood;

            return true;
        } catch (error) {
            console.error('❌ Error in mood update:', error);
            await interaction.reply({
                content: '❌ Something went wrong while updating your mood. Please try again later.',
                ephemeral: true
            });
            return false;
        }
    }
}

module.exports = MoodManager; 