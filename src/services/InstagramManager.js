const { IgApiClient } = require('instagram-private-api');
const { readFile } = require('fs').promises;
const path = require('path');

class InstagramManager {
    constructor() {
        this.ig = new IgApiClient();
        this.limits = {
            maxUpdatesPerDay: 8,
            minTimeBetweenUpdates: 3600000, // 1 hour in milliseconds
            randomDelay: {
                min: 60000,  // 1 minute
                max: 180000  // 3 minutes
            }
        };
        this.updateHistory = new Map();
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

    async canUpdate(userId) {
        const now = Date.now();
        const userHistory = this.updateHistory.get(userId) || {
            lastUpdate: 0,
            todayCount: 0,
            lastDayChecked: new Date().toDateString()
        };

        // Reset daily count if it's a new day
        if (userHistory.lastDayChecked !== new Date().toDateString()) {
            userHistory.todayCount = 0;
            userHistory.lastDayChecked = new Date().toDateString();
            console.log(`🔄 Reset daily count for user ${userId}`);
        }

        // Check daily limit
        if (userHistory.todayCount >= this.limits.maxUpdatesPerDay) {
            console.log(`⚠️ Daily limit reached for user ${userId}: ${userHistory.todayCount}/${this.limits.maxUpdatesPerDay}`);
            return {
                allowed: false,
                reason: `Daily limit reached (${userHistory.todayCount}/${this.limits.maxUpdatesPerDay})`,
                nextUpdate: 'Tomorrow',
                limits: {
                    daily: `${userHistory.todayCount}/${this.limits.maxUpdatesPerDay}`,
                    nextReset: new Date(new Date().setHours(24, 0, 0, 0)).toLocaleString()
                }
            };
        }

        // Check time between updates
        const timeSinceLastUpdate = now - userHistory.lastUpdate;
        if (timeSinceLastUpdate < this.limits.minTimeBetweenUpdates) {
            const waitTime = Math.ceil((this.limits.minTimeBetweenUpdates - timeSinceLastUpdate) / 60000);
            console.log(`⏳ Cooldown active for user ${userId}: ${waitTime} minutes remaining`);
            return {
                allowed: false,
                reason: 'Cooldown active',
                nextUpdate: `Wait ${waitTime} minutes`,
                limits: {
                    cooldown: `${waitTime} minutes remaining`,
                    daily: `${userHistory.todayCount}/${this.limits.maxUpdatesPerDay}`
                }
            };
        }

        return { 
            allowed: true,
            limits: {
                daily: `${userHistory.todayCount}/${this.limits.maxUpdatesPerDay}`,
                lastUpdate: userHistory.lastUpdate ? new Date(userHistory.lastUpdate).toLocaleString() : 'Never'
            }
        };
    }

    async getLimitStatus(userId) {
        const now = Date.now();
        const userHistory = this.updateHistory.get(userId) || {
            lastUpdate: 0,
            todayCount: 0,
            lastDayChecked: new Date().toDateString()
        };

        const timeSinceLastUpdate = now - userHistory.lastUpdate;
        const cooldownRemaining = Math.max(0, Math.ceil((this.limits.minTimeBetweenUpdates - timeSinceLastUpdate) / 60000));

        return {
            daily: `${userHistory.todayCount}/${this.limits.maxUpdatesPerDay}`,
            cooldown: cooldownRemaining > 0 ? `${cooldownRemaining} minutes` : 'Ready',
            lastUpdate: userHistory.lastUpdate ? new Date(userHistory.lastUpdate).toLocaleString() : 'Never',
            nextReset: new Date(new Date().setHours(24, 0, 0, 0)).toLocaleString()
        };
    }

    async updateProfilePicture(userId, mood) {
        try {
            const canUpdateCheck = await this.canUpdate(userId);
            if (!canUpdateCheck.allowed) {
                throw new Error(`${canUpdateCheck.reason}\n\nLimits:\n- Daily: ${canUpdateCheck.limits.daily}\n- Next update: ${canUpdateCheck.nextUpdate}`);
            }

            // Add random delay
            const delay = Math.floor(
                Math.random() * 
                (this.limits.randomDelay.max - this.limits.randomDelay.min) + 
                this.limits.randomDelay.min
            );
            console.log(`⏱️ Adding random delay of ${delay/1000}s for user ${userId}`);
            await new Promise(resolve => setTimeout(resolve, delay));

            // Update user history
            const userHistory = this.updateHistory.get(userId) || {
                lastUpdate: 0,
                todayCount: 0,
                lastDayChecked: new Date().toDateString()
            };
            userHistory.lastUpdate = Date.now();
            userHistory.todayCount++;
            this.updateHistory.set(userId, userHistory);

            // Log the update
            console.log(`📸 Profile update for user ${userId}:`, {
                mood,
                delay: `${delay/1000}s`,
                todayCount: userHistory.todayCount,
                nextUpdateAllowed: new Date(Date.now() + this.limits.minTimeBetweenUpdates).toLocaleString()
            });

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

            console.log(`✅ Profile picture updated to ${mood} (Update ${userHistory.todayCount}/${this.limits.maxUpdatesPerDay} today)`);
            return {
                success: true,
                limits: await this.getLimitStatus(userId)
            };

        } catch (error) {
            if (error.message.includes('login_required')) {
                console.log('🔄 Session expired, attempting to re-login');
                await this.login();
                return this.updateProfilePicture(userId, mood); // Retry once after re-login
            }
            console.error('❌ Profile update error:', error);
            throw error;
        }
    }
}

module.exports = InstagramManager; 