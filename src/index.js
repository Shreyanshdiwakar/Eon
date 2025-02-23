require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const MoodDetector = require('./services/MoodDetector');
const ProfileManager = require('./services/ProfileManager');
const TimeManager = require('./services/TimeManager');
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
const timeManager = new TimeManager(client, profileManager);

client.once('ready', () => {
    console.log('Bot is ready!');
    timeManager.startScheduler();
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Check cooldown
    const lastMessageTime = messageCooldowns.get(message.author.id);
    const now = Date.now();
    if (lastMessageTime && now - lastMessageTime < COOLDOWN_DURATION) {
        return; // Ignore messages during cooldown
    }
    messageCooldowns.set(message.author.id, now);
    
    try {
        console.log('Processing message:', message.content);
        
        // Direct mood commands
        if (message.content.toLowerCase().startsWith('i am ')) {
            const userInput = message.content.toLowerCase().replace('i am ', '').trim();
            console.log('Detected mood command with input:', userInput);
            
            const analysis = await moodDetector.getDetailedAnalysis(message.content);
            console.log('Mood analysis:', analysis);
            
            let response = `I detected your mood as: ${analysis.mood}\n`;
            response += `Confidence scores: Positive: ${(analysis.scores.positive * 100).toFixed(1)}%, Negative: ${(analysis.scores.negative * 100).toFixed(1)}%`;
            
            try {
                // Send a single response with both the analysis and the update status
                const imagePath = await profileManager.updateProfilePicture(message.author.id, analysis.mood);
                if (imagePath) {
                    response += `\nUpdated profile picture: ${imagePath}`;
                }
                await message.reply(response);
            } catch (error) {
                console.error('Profile update error:', error);
                response += `\nError updating profile: ${error.message}`;
                await message.reply(response);
            }
            return;
        }

        // AI-based mood detection for other messages
        const analysis = await moodDetector.getDetailedAnalysis(message.content);
        console.log('Message analysis:', analysis);
        
        // Only respond if sentiment is strong enough
        if (Math.abs(analysis.scores.compound) > 0.2) {
            let response = `I sense that you're feeling ${analysis.mood}! `;
            response += `(Confidence: ${(Math.abs(analysis.scores.compound) * 100).toFixed(1)}%)`;
            
            try {
                const imagePath = await profileManager.updateProfilePicture(message.author.id, analysis.mood);
                if (imagePath) {
                    response += `\nUpdated profile picture: ${imagePath}`;
                }
                await message.reply(response);
            } catch (error) {
                console.error('Profile update error:', error);
                response += `\nError updating profile: ${error.message}`;
                await message.reply(response);
            }
        }
        
    } catch (error) {
        console.error('Error processing message:', error.stack);
        await message.reply('Sorry, I encountered an error processing your mood.');
    }
});

client.login(process.env.DISCORD_TOKEN); 