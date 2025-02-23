const path = require('path');
const { RateLimiter } = require('limiter');
const { IgApiClient } = require('instagram-private-api');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs').promises;
const config = require('../config');
const { FileCookieStore } = require('tough-cookie-file-store');

class ProfileManager {
    constructor() {
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

        this.rateLimiter = new RateLimiter({
            tokensPerInterval: 2,
            interval: 'minute'
        });

        this.isInstagramInitialized = false;
    }

    async initializeInstagram() {
        try {
            // Basic device setup
            this.ig.state.generateDevice(process.env.IG_USERNAME);
            
            // Simple cookie store
            this.ig.state.cookieStore = new FileCookieStore('./cookies.json');
            
            console.log('Attempting Instagram login for:', process.env.IG_USERNAME);
            
            // Direct login without simulation
            const loggedInUser = await this.ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);
            console.log('Instagram login successful for:', loggedInUser.username);
            
            this.isInstagramInitialized = true;
            
            // Save session
            await fs.writeFile(
                './ig_session.json', 
                JSON.stringify(await this.ig.state.serialize())
            );
            
            return true;
        } catch (error) {
            console.error('Instagram login error:', error.message);
            
            if (error.message.includes('challenge_required')) {
                throw new Error('Instagram security check required. Please log in through the website first.');
            } else if (error.message.includes('bad_password')) {
                throw new Error('Instagram password is incorrect.');
            } else if (error.message.includes('login_required')) {
                throw new Error('Instagram session expired. Please try again.');
            }
            
            throw new Error(`Instagram login failed: ${error.message}`);
        }
    }

    async updateProfilePicture(userId, mood) {
        try {
            const hasToken = await this.rateLimiter.tryRemoveTokens(1);
            if (!hasToken) {
                throw new Error('Rate limit exceeded. Please wait a minute.');
            }

            if (!this.isInstagramInitialized) {
                await this.initializeInstagram();
            }

            const imagePath = this.profilePictures[mood] || this.profilePictures.normal;
            const absolutePath = path.resolve(process.cwd(), imagePath);
            
            try {
                const imageBuffer = await fs.readFile(absolutePath);
                await this.ig.account.changeProfilePicture(imageBuffer);
                return `Successfully updated Instagram profile to ${mood} mood`;
            } catch (error) {
                if (error.message.includes('login_required')) {
                    this.isInstagramInitialized = false;
                    await this.initializeInstagram();
                    // Retry once after re-login
                    const imageBuffer = await fs.readFile(absolutePath);
                    await this.ig.account.changeProfilePicture(imageBuffer);
                    return `Successfully updated Instagram profile to ${mood} mood (after re-login)`;
                }
                throw error;
            }
        } catch (error) {
            console.error('Profile update error:', error);
            throw error;
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