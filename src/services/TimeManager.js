const cron = require('node-cron');

class TimeManager {
    constructor(client, profileManager) {
        this.client = client;
        this.profileManager = profileManager;
    }

    startScheduler() {
        // Change profile picture at 8 PM daily
        cron.schedule('0 20 * * *', () => {
            this.updateNightTheme();
        });

        // Change back to day theme at 6 AM
        cron.schedule('0 6 * * *', () => {
            this.updateDayTheme();
        });
    }

    async updateNightTheme() {
        try {
            const users = await this.client.users.fetch();
            for (const [userId, user] of users) {
                await this.profileManager.updateProfilePicture(userId, 'night');
            }
        } catch (error) {
            console.error('Error updating night theme:', error);
        }
    }

    async updateDayTheme() {
        try {
            const users = await this.client.users.fetch();
            for (const [userId, user] of users) {
                await this.profileManager.updateProfilePicture(userId, 'day');
            }
        } catch (error) {
            console.error('Error updating day theme:', error);
        }
    }
}

module.exports = TimeManager; 