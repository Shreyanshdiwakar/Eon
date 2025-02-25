const { IgApiClient } = require('instagram-private-api');
const { readFile } = require('fs').promises;
const path = require('path');

class InstagramManager {
    constructor() {
        this.ig = new IgApiClient();
        this.lastUpdate = 0;
        this.minTimeBetweenUpdates = 3600000; // 1 hour minimum between updates
        this.maxUpdatesPerDay = 8; // Maximum 8 updates per day
        this.updateCount = 0;
        this.lastDayReset = new Date().setHours(0,0,0,0);
    }

    async login() {
        try {
            this.ig.state.generateDevice(process.env.IG_USERNAME);
            await this.ig.simulate.preLoginFlow();
            await this.ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);
            console.log('✅ Instagram login successful');
        } catch (error) {
            console.error('❌ Instagram login failed:', error.message);
            throw error;
        }
    }

    async updateProfilePicture(mood) {
        try {
            // Check if we need to reset daily counter
            const today = new Date().setHours(0,0,0,0);
            if (today > this.lastDayReset) {
                this.updateCount = 0;
                this.lastDayReset = today;
            }

            // Check update limits
            const now = Date.now();
            if (now - this.lastUpdate < this.minTimeBetweenUpdates) {
                console.log('⏳ Skipping update - Need to wait longer between updates');
                return false;
            }

            if (this.updateCount >= this.maxUpdatesPerDay) {
                console.log('⚠️ Daily update limit reached');
                return false;
            }

            // Add random delay between 1-3 minutes
            const delay = Math.floor(Math.random() * 120000) + 60000;
            console.log(`⏳ Adding delay of ${delay/1000} seconds before update`);
            await new Promise(resolve => setTimeout(resolve, delay));

            // Get image path
            const imagePath = path.join(__dirname, '..', '..', 'assets', `${mood}.png`);
            const imageBuffer = await readFile(imagePath);

            // Login check and refresh if needed
            if (!this.ig.state.cookiesExists('instagram.com')) {
                console.log('🔄 Refreshing Instagram login');
                await this.login();
            }

            // Update profile picture
            await this.ig.account.changeProfilePicture({
                picture: imageBuffer
            });

            // Update counters
            this.lastUpdate = now;
            this.updateCount++;

            console.log(`✅ Profile picture updated to ${mood} (Update ${this.updateCount}/${this.maxUpdatesPerDay} today)`);
            return true;

        } catch (error) {
            if (error.message.includes('login_required')) {
                console.log('🔄 Session expired, attempting to re-login');
                await this.login();
                return this.updateProfilePicture(mood); // Retry once after re-login
            }
            console.error('❌ Error updating Instagram profile picture:', error.message);
            return false;
        }
    }
}

module.exports = InstagramManager; 