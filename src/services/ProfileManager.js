const path = require('path');
const { RateLimiter } = require('limiter');
const { IgApiClient } = require('instagram-private-api');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs').promises;
const config = require('../config');
const { FileCookieStore } = require('tough-cookie-file-store');

class ProfileManager {
    constructor() {
        console.log('🔧 Initializing ProfileManager...');
        this.profilePictures = config.moodImages;

        // Separate rate limiters for Discord and Instagram
        this.discordRateLimiter = new RateLimiter({
            tokensPerInterval: 2,
            interval: 'minute'
        });

        this.instagramRateLimiter = new RateLimiter({
            tokensPerInterval: 1,
            interval: 'hour'
        });

        // Initialize Instagram client
        this.ig = new IgApiClient();

        this.limiter = new RateLimiter({
            tokensPerInterval: 2,
            interval: "minute"
        });

        this.isInstagramInitialized = false;
        this.currentMood = 'normal';
        console.log('✅ ProfileManager initialized');
    }

    async initializeInstagram() {
        if (this.isInstagramInitialized) {
            console.log('ℹ️ Instagram already initialized');
            return;
        }

        try {
            console.log('🔄 Starting Instagram initialization...');
            console.log(`👤 Attempting login for: ${process.env.IG_USERNAME}`);
            
            this.ig.state.generateDevice(process.env.IG_USERNAME);
            console.log('📱 Device generated');
            
            await this.ig.simulate.preLoginFlow();
            console.log('🔄 Pre-login flow completed');
            
            const loggedInUser = await this.ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);
            console.log(`✅ Successfully logged in as: ${loggedInUser.username}`);
            
            process.nextTick(async () => {
                await this.ig.simulate.postLoginFlow();
                console.log('✅ Post-login flow completed');
            });

            this.isInstagramInitialized = true;
            console.log('🎉 Instagram initialization complete!');
        } catch (error) {
            console.error('❌ Instagram initialization failed:', error);
            throw error;
        }
    }

    normalizeMood(mood) {
        // Remove extra words and normalize common variations
        const moodLower = mood.toLowerCase();
        
        // Handle variations of "happy"
        if (moodLower.includes('happy')) return 'happy';
        if (moodLower.includes('tired')) return 'tired';
        if (moodLower.includes('confused')) return 'confused';
        if (moodLower.includes('working')) return 'working';
        if (moodLower.includes('eating')) return 'eating';
        if (moodLower.includes('sleeping')) return 'sleeping';
        if (moodLower.includes('birthday')) return 'birthday';
        if (moodLower.includes('celebration')) return 'celebration';
        if (moodLower.includes('awkward')) return 'awkward';
        if (moodLower.includes('girlfriend')) return 'with-girlfriend';
        
        return 'normal';  // default mood
    }

    async updateProfilePicture(userId, mood) {
        try {
            console.log('\n=== Profile Picture Update ===');
            console.log(`🎭 Raw mood input: ${mood}`);
            
            // Normalize the mood
            const normalizedMood = this.normalizeMood(mood);
            console.log(`🎯 Normalized mood: ${normalizedMood}`);
            
            await this.limiter.removeTokens(1);
            console.log('⏳ Rate limit check passed');

            if (!this.isInstagramInitialized) {
                console.log('🔄 Instagram not initialized, initializing now...');
                await this.initializeInstagram();
            }

            const imagePath = config.moodImages[normalizedMood];
            
            if (!imagePath) {
                console.error(`❌ No image found for mood: ${normalizedMood}`);
                return false;
            }

            const fullPath = path.join(__dirname, '../../', imagePath);
            console.log(`📂 Reading image from: ${fullPath}`);
            
            const imageBuffer = await fs.readFile(fullPath);
            console.log('✅ Image file read successfully');

            console.log('📤 Uploading new profile picture...');
            await this.ig.account.changeProfilePicture(imageBuffer);
            
            this.currentMood = normalizedMood;
            console.log('🎉 Profile picture updated successfully!');
            console.log('========================\n');
            return true;
        } catch (error) {
            console.error('❌ Profile picture update failed:', error);
            if (error.name === 'IgNotFoundError') {
                console.log('⚠️ Instagram API error - retrying initialization...');
                this.isInstagramInitialized = false;
            }
            return false;
        }
    }

    async updateDiscordProfile(userId, pictureUrl) {
        const hasToken = await this.discordRateLimiter.tryRemoveTokens(1);
        if (!hasToken) {
            throw new Error('Discord rate limit exceeded for profile picture updates');
        }

        // Implement Discord profile update logic here
        // Note: Requires OAuth2 permissions
        return true;
    }

    async updateInstagramProfile(pictureUrl) {
        const hasToken = await this.instagramRateLimiter.tryRemoveTokens(1);
        if (!hasToken) {
            throw new Error('Instagram rate limit exceeded for profile picture updates');
        }

        try {
            // Download the image first (you'll need to implement this)
            const imageBuffer = await this.downloadImage(pictureUrl);
            
            // Update Instagram profile picture
            await this.ig.account.changeProfilePicture(imageBuffer);
            return true;
        } catch (error) {
            console.error('Instagram profile update error:', error);
            throw error;
        }
    }

    async downloadImage(url) {
        // Implement image download logic here
        // You can use axios, node-fetch, or other libraries
        const response = await fetch(url);
        return Buffer.from(await response.arrayBuffer());
    }
}

module.exports = ProfileManager; 