require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const MoodDetector = require('./services/MoodDetector');
const ProfileManager = require('./services/ProfileManager');
const TimeManager = require('./services/TimeManager');
const StatisticsManager = require('./services/StatisticsManager');
const config = require('./config');

console.log('Environment check:', {
    hasDiscordToken: !!process.env.DISCORD_TOKEN,
    tokenFirstChars: process.env.DISCORD_TOKEN ? process.env.DISCORD_TOKEN.substring(0, 5) + '...' : 'not found'
});

// Add a message cooldown map
const messageCooldowns = new Map();
const COOLDOWN_DURATION = 5000; // 5 seconds cooldown

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMembers
    ]
});

const moodDetector = new MoodDetector();
const profileManager = new ProfileManager();
const statsManager = new StatisticsManager();
const timeManager = new TimeManager(client, profileManager, statsManager);

client.once('ready', () => {
    console.log('\n=== Bot Startup ===');
    console.log(`✅ Logged in as: ${client.user.tag}`);
    console.log('📡 Connected to Discord');
    console.log('⏰ Starting scheduler...');
    timeManager.startScheduler();
    console.log('🤖 Bot is ready and listening!\n');
});

client.on('messageCreate', async (message) => {
    // Ignore bot messages and DMs
    if (message.author.bot || !message.guild) return;

    try {
        console.log('\n=== New Message ===');
        console.log(`From: ${message.author.username}`);
        console.log(`Content: "${message.content}"`);
        console.log('==================\n');

        // Handle stats command
        if (message.content.toLowerCase() === '!moodstats') {
            console.log('📊 Processing stats command...');
            const stats = statsManager.getStats();
            
            let response = '📊 **Mood Statistics**\n\n';
            response += `Total mood changes: ${stats.total}\n`;
            response += `Changes today: ${stats.today}\n`;
            response += `Most common mood: ${stats.mostCommon}\n`;
            
            message.channel.send(response)
                .then(() => console.log('✅ Stats response sent successfully'))
                .catch(err => console.error('❌ Error sending stats:', err));
            return;
        }

        // Direct mood commands
        if (message.content.toLowerCase().startsWith('i am ')) {
            const moodText = message.content.slice(5).trim().toLowerCase();
            console.log(`🎯 Direct mood command detected: "${moodText}"`);
            
            try {
                console.log('📸 Attempting to update Instagram profile picture...');
                const updated = await profileManager.updateProfilePicture(null, moodText);
                
                const response = updated 
                    ? `I'm feeling ${moodText} too! Updated my Instagram profile picture! ✨`
                    : `I understand you're feeling ${moodText}, but I couldn't update my Instagram picture 😕`;
                
                await message.channel.send(response);
                console.log(`✅ Mood response sent: ${response}`);
                
                await statsManager.recordMoodChange(moodText, message.author.id);
                console.log('📝 Mood statistics updated');
            } catch (error) {
                console.error('❌ Error in mood command:', error);
                message.channel.send('Sorry, I had trouble processing that mood change.');
            }
            return;
        }

        // AI-based mood detection
        console.log('🤖 Analyzing message sentiment...');
        const analysis = await moodDetector.getDetailedAnalysis(message.content);
        console.log('📊 Analysis result:', analysis);

        if (analysis && analysis.mood) {
            console.log(`🎭 Detected mood: ${analysis.mood}`);
            
            try {
                console.log('📸 Updating Instagram profile picture...');
                const updated = await profileManager.updateProfilePicture(null, analysis.mood);
                
                let response = `I sense that you're feeling ${analysis.mood}! `;
                if (updated) {
                    response += `I've updated my Instagram profile to match your mood! 🌟`;
                } else {
                    response += `(Though I couldn't update my Instagram picture right now) 🤔`;
                }
                
                await message.channel.send(response);
                console.log('✅ Response sent:', response);
                
                await statsManager.recordMoodChange(analysis.mood, message.author.id);
                console.log('📝 Mood statistics updated');
            } catch (error) {
                console.error('❌ Error processing mood:', error);
                message.channel.send('I understand your mood but encountered an error updating my picture.');
            }
        }

    } catch (error) {
        console.error('❌ Critical error:', error);
        message.channel.send('Sorry, I encountered an error processing your message.')
            .catch(err => console.error('Failed to send error message:', err));
    }
});

// Error handling
client.on('error', error => {
    console.error('❌ Discord client error:', error);
});

process.on('unhandledRejection', error => {
    console.error('❌ Unhandled promise rejection:', error);
});

// Login with error handling
client.login(process.env.DISCORD_TOKEN)
    .then(() => console.log('🔑 Login successful'))
    .catch(error => console.error('❌ Login failed:', error)); 