require('dotenv').config();
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const MoodDetector = require('./services/MoodDetector');
const ProfileManager = require('./services/ProfileManager');
const TimeManager = require('./services/TimeManager');
const StatisticsManager = require('./services/StatisticsManager');
const MoodSuggester = require('./services/MoodSuggester');
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
const moodSuggester = new MoodSuggester();

client.once('ready', () => {
    console.log('\n=== Bot Startup ===');
    console.log(`✅ Logged in as: ${client.user.tag}`);
    console.log('📡 Connected to Discord');
    console.log('⏰ Starting scheduler...');
    timeManager.startScheduler();
    console.log('🤖 Bot is ready and listening!\n');
});

// Create main menu buttons
function createMainMenu() {
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('menu_moods')
                .setLabel('🎭 Change Mood')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('menu_stats')
                .setLabel('📊 Mood Stats')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('menu_suggest')
                .setLabel('🤔 I\'m Unsure')
                .setStyle(ButtonStyle.Success)
        );
    return [row];
}

// Create mood selection menu
function createMoodButtons(page = 0) {
    const moods = [
        'happy', 'normal', 'tired', 'confused',
        'awkward', 'working', 'celebration', 'birthday',
        'with-girlfriend', 'eating', 'eating1', 'sleeping'
    ];

    const buttonsPerRow = 4;
    const buttonsPerPage = 8;
    const startIdx = page * buttonsPerPage;
    const pageButtons = moods.slice(startIdx, startIdx + buttonsPerPage);
    const rows = [];

    // Create button rows
    for (let i = 0; i < pageButtons.length; i += buttonsPerRow) {
        const row = new ActionRowBuilder();
        const rowButtons = pageButtons.slice(i, i + buttonsPerRow);

        rowButtons.forEach(mood => {
            const label = mood === 'eating1' ? 'Eating 2' : 
                         mood.charAt(0).toUpperCase() + mood.slice(1).replace('-', ' ');
            
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`mood_${mood}`)
                    .setLabel(label)
                    .setStyle(ButtonStyle.Primary)
            );
        });

        rows.push(row);
    }

    // Add navigation and back buttons
    const navRow = new ActionRowBuilder();
    
    // Add back button
    navRow.addComponents(
        new ButtonBuilder()
            .setCustomId('menu_back')
            .setLabel('↩️ Back to Menu')
            .setStyle(ButtonStyle.Danger)
    );

    // Add navigation buttons if needed
    if (moods.length > buttonsPerPage) {
        if (page > 0) {
            navRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`prev_${page}`)
                    .setLabel('◀️ Previous')
                    .setStyle(ButtonStyle.Secondary)
            );
        }
        if ((page + 1) * buttonsPerPage < moods.length) {
            navRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`next_${page}`)
                    .setLabel('Next ▶️')
                    .setStyle(ButtonStyle.Secondary)
            );
        }
    }
    
    rows.push(navRow);
    return rows;
}

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    try {
        // Handle menu command
        if (message.mentions.has(client.user)) {
            console.log('📋 Main menu requested');
            const rows = createMainMenu();
            await message.reply({
                content: '**Choose an option:**',
                components: rows
            });
            return;
        }

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

        // Handle default/normal profile picture command
        if (message.content.toLowerCase() === '!default' || message.content.toLowerCase() === '!normal') {
            console.log('🔄 Default profile picture command received');
            try {
                const updated = await profileManager.updateProfilePicture(null, 'normal');
                const response = updated 
                    ? 'Reset to my default profile picture! 🔄'
                    : 'Sorry, I had trouble setting my default picture 😕';
                
                await message.channel.send(response);
                if (updated) {
                    await statsManager.recordMoodChange('normal', message.author.id);
                }
            } catch (error) {
                console.error('❌ Error setting default picture:', error);
                await message.channel.send('Sorry, I encountered an error setting my default picture.');
            }
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
            // Only respond if confidence is high enough
            if (analysis.confidence > 0.2) {
                console.log(`🎭 Detected mood: ${analysis.mood} (Confidence: ${(analysis.confidence * 100).toFixed(1)}%)`);
                
                try {
                    console.log('📸 Updating Instagram profile picture...');
                    const updated = await profileManager.updateProfilePicture(null, analysis.mood);
                    
                    let response = `I sense that you're feeling ${analysis.mood}! `;
                    response += `(${(analysis.confidence * 100).toFixed(1)}% confident) `;
                    
                    if (updated) {
                        response += `\nI've updated my Instagram profile to match your mood! 🌟`;
                    } else {
                        response += `\n(Though I couldn't update my Instagram picture right now) 🤔`;
                    }
                    
                    await message.channel.send(response);
                    console.log('✅ Response sent:', response);
                    
                    await statsManager.recordMoodChange(analysis.mood, message.author.id);
                    console.log('📝 Mood statistics updated');
                } catch (error) {
                    console.error('❌ Error processing mood:', error);
                    message.channel.send('I understand your mood but encountered an error updating my picture.');
                }
            } else {
                console.log(`⏭️ Skipping low confidence mood: ${analysis.confidence}`);
            }
        }

    } catch (error) {
        console.error('❌ Critical error:', error);
        message.channel.send('Sorry, I encountered an error processing your message.')
            .catch(err => console.error('Failed to send error message:', err));
    }
});

// Handle button interactions
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    try {
        const [action, value] = interaction.customId.split('_');

        if (action === 'menu') {
            if (value === 'suggest') {
                console.log('🤔 Mood suggestion requested from menu');
                const suggestions = await moodSuggester.suggestMood(interaction);
                
                let response = '**Based on your patterns:**\n';
                if (statsManager.stats.lastMood) {
                    response += `Your last mood was: ${statsManager.stats.lastMood}\n`;
                }
                response += 'Here are some suggestions:';
                
                const rows = createSuggestionButtons(suggestions);
                
                await interaction.update({
                    content: response,
                    components: [...rows, createBackRow()]
                });
            } else if (value === 'moods') {
                console.log('🎭 Mood submenu requested');
                const rows = createMoodButtons();
                await interaction.update({
                    content: '**Choose a mood:**',
                    components: rows
                });
            } else if (value === 'stats') {
                console.log('📊 Processing stats request');
                const stats = statsManager.getStats();
                
                let response = '📊 **Mood Statistics**\n\n';
                response += `Total mood changes: ${stats.total}\n`;
                response += `Changes today: ${stats.today}\n`;
                response += `Most common mood: ${stats.mostCommon}\n`;
                
                // Add back button
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('menu_back')
                            .setLabel('↩️ Back to Menu')
                            .setStyle(ButtonStyle.Secondary)
                    );

                await interaction.update({
                    content: response,
                    components: [row]
                });
            } else if (value === 'back') {
                console.log('↩️ Returning to main menu');
                const rows = createMainMenu();
                await interaction.update({
                    content: '**Choose an option:**',
                    components: rows
                });
            }
        } else if (action === 'mood') {
            console.log(`🎭 Mood selected via button: ${value}`);
            await interaction.deferUpdate();

            try {
                const updated = await profileManager.updateProfilePicture(null, value);
                const response = updated 
                    ? `Updated my mood to: ${value} ✨`
                    : `Sorry, I couldn't update my mood to ${value} 😕`;
                
                // Add back button
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('menu_back')
                            .setLabel('↩️ Back to Menu')
                            .setStyle(ButtonStyle.Secondary)
                    );

                await interaction.editReply({
                    content: response,
                    components: [row]
                });

                if (updated) {
                    await statsManager.recordMoodChange(value, interaction.user.id);
                }
            } catch (error) {
                console.error('❌ Error updating mood:', error);
                await interaction.editReply({
                    content: 'Sorry, I encountered an error updating my mood.',
                    components: []
                });
            }
        } else if (action === 'prev' || action === 'next') {
            const currentPage = parseInt(value);
            const newPage = action === 'prev' ? currentPage - 1 : currentPage + 1;
            const rows = createMoodButtons(newPage);
            
            await interaction.update({
                components: rows
            });
        }
    } catch (error) {
        console.error('❌ Error handling button interaction:', error);
        await interaction.reply({
            content: 'Sorry, I encountered an error processing your selection.',
            ephemeral: true
        });
    }
});

// Helper function to create a back button row
function createBackRow() {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('menu_back')
                .setLabel('↩️ Back to Menu')
                .setStyle(ButtonStyle.Danger)
        );
}

// Update the suggestion buttons creation
function createSuggestionButtons(suggestions) {
    const rows = [];
    const row = new ActionRowBuilder();
    
    suggestions.forEach((mood, index) => {
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`mood_${mood}`)
                .setLabel(`${index === 0 ? '✨ ' : ''}${mood.charAt(0).toUpperCase() + mood.slice(1)}`)
                .setStyle(index === 0 ? ButtonStyle.Primary : ButtonStyle.Secondary)
        );
    });
    
    rows.push(row);
    return rows;
}

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