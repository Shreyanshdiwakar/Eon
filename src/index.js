require('dotenv').config();
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const MoodDetector = require('./services/MoodDetector');
const ProfileManager = require('./services/ProfileManager');
const TimeManager = require('./services/TimeManager');
const StatisticsManager = require('./services/StatisticsManager');
const MoodSuggester = require('./services/MoodSuggester');
const config = require('./config');
const JournalManager = require('./services/JournalManager');
const MoodPredictor = require('./services/MoodPredictor');

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
const journalManager = new JournalManager(client, statsManager);
const moodPredictor = new MoodPredictor(statsManager);

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
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('menu_journal')
                .setLabel('📔 Daily Journal')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('menu_predict')
                .setLabel('🔮 Predict Mood')
                .setStyle(ButtonStyle.Secondary)
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

        // AI-based mood detection and reactions
        console.log('🤖 Analyzing message sentiment...');
        const analysis = await moodDetector.getDetailedAnalysis(message.content);
        console.log('📊 Analysis result:', analysis);

        if (analysis && analysis.mood) {
            // Add reactions based on mood
            try {
                // Add main mood emoji
                await message.react(analysis.mainEmoji);
                
                // Add additional contextual emojis (up to 2)
                for (const emoji of analysis.additionalEmojis.slice(0, 2)) {
                    await message.react(emoji);
                }
                
                console.log('✅ Added mood reactions:', [analysis.mainEmoji, ...analysis.additionalEmojis]);

                // Only respond with mood update if confidence is high enough
                if (analysis.confidence > 0.2) {
                    console.log(`🎭 Detected mood: ${analysis.mood} (Confidence: ${(analysis.confidence * 100).toFixed(1)}%)`);
                    
                    try {
                        console.log('📸 Updating Instagram profile picture...');
                        const updated = await profileManager.updateProfilePicture(null, analysis.mood);
                        
                        let response = `I sense that you're feeling ${analysis.mood}! `;
                        response += `(${(analysis.confidence * 100).toFixed(1)}% confident) `;
                        
                        if (updated) {
                            response += `\nI've updated my Instagram profile to match your mood! ${analysis.mainEmoji}`;
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
            } catch (error) {
                console.error('❌ Error adding reactions:', error);
            }
        }

        // Handle journal commands
        if (message.content.toLowerCase() === '!journal') {
            console.log('📔 Journal requested');
            const embed = await journalManager.generateDailySummary(message.author.id);
            
            if (embed) {
                await message.author.send({ embeds: [embed] });
                await message.reply('I\'ve sent your mood journal to your DMs! 📬');
            } else {
                await message.reply('Sorry, I couldn\'t generate your journal right now 😕');
            }
            return;
        }

        if (message.content.toLowerCase() === '!subscribe') {
            console.log('📮 Journal subscription requested');
            journalManager.scheduleDaily(message.author.id);
            await message.reply('You\'re now subscribed to daily mood journals! Check your DMs at 8 PM daily 📔');
            return;
        }

        // Handle prediction command
        if (message.content.toLowerCase() === '!predict') {
            console.log('🔮 Mood prediction requested');
            const predictionEmbed = await moodPredictor.predictTomorrowsMood();
            
            if (predictionEmbed) {
                await message.reply({ embeds: [predictionEmbed] });
                console.log('✅ Prediction sent successfully');
            } else {
                await message.reply('Sorry, I couldn\'t generate a prediction right now 😕');
                console.log('❌ Failed to generate prediction');
            }
            return;
        }

        // Add graph command handling
        if (message.content.toLowerCase() === '!graphs') {
            console.log('📊 Generating mood graphs...');
            const graphs = await statsManager.generateGraphs();
            
            if (graphs) {
                await message.reply({
                    content: '📈 Here are your mood trends:',
                    files: [graphs.trend, graphs.distribution]
                });
                console.log('✅ Graphs sent successfully');
            } else {
                await message.reply('Sorry, I couldn\'t generate the graphs right now 😕');
                console.log('❌ Failed to generate graphs');
            }
            return;
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
        console.log(`🔘 Button pressed: ${action}_${value}`);

        // Add this section to handle next/prev buttons
        if (action === 'next' || action === 'prev') {
            const currentPage = parseInt(value);
            const newPage = action === 'next' ? currentPage + 1 : currentPage - 1;
            const rows = createMoodButtons(newPage);
            
            await interaction.update({
                content: '**Choose a mood:**',
                components: rows
            });
            return;
        }

        if (action === 'menu') {
            if (value === 'suggest') {
                console.log('🤔 Mood suggestion requested from menu');
                const suggestions = await moodSuggester.suggestMood(interaction);
                
                const rows = [];
                const buttonRow = new ActionRowBuilder();
                
                // Create buttons for each suggestion
                suggestions.forEach(mood => {
                    buttonRow.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`mood_${mood}`)
                            .setLabel(mood.charAt(0).toUpperCase() + mood.slice(1))
                            .setStyle(ButtonStyle.Primary)
                    );
                });
                
                rows.push(buttonRow);

                // Add back button
                const backRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('menu_back')
                            .setLabel('↩️ Back to Menu')
                            .setStyle(ButtonStyle.Danger)
                    );
                rows.push(backRow);

                let response = 'Based on your patterns:\n';
                const stats = statsManager.getStats();
                if (stats.lastMood) {
                    response += `Your last mood was: ${stats.lastMood}\n`;
                }
                response += 'Here are some suggestions:';

                await interaction.update({
                    content: response,
                    components: rows
                });
            } else if (value === 'back') {
                console.log('↩️ Returning to main menu');
                await interaction.update({
                    content: '**Choose an option:**',
                    components: createMainMenu()
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
                const graphs = await statsManager.generateGraphs();
                
                let response = '📊 **Mood Statistics**\n\n';
                response += `Total mood changes: ${stats.total}\n`;
                response += `Changes today: ${stats.today}\n`;
                response += `Most common mood: ${stats.mostCommon}\n`;
                
                if (graphs) {
                    await interaction.update({
                        content: response,
                        files: [graphs.trend, graphs.distribution],
                        components: [createBackRow()]
                    });
                } else {
                    await interaction.update({
                        content: response + '\n(Could not generate graphs at this time)',
                        components: [createBackRow()]
                    });
                }
            } else if (value === 'journal') {
                console.log('📔 Journal requested via button');
                const embed = await journalManager.generateDailySummary(interaction.user.id);
                
                if (embed) {
                    await interaction.user.send({ embeds: [embed] });
                    await interaction.update({
                        content: 'I\'ve sent your mood journal to your DMs! 📬\nWant to receive daily updates? Use `!subscribe`',
                        components: [createBackRow()]
                    });
                } else {
                    await interaction.update({
                        content: 'Sorry, I couldn\'t generate your journal right now 😕',
                        components: [createBackRow()]
                    });
                }
            } else if (value === 'predict') {
                console.log('🔮 Prediction requested via button');
                const predictionEmbed = await moodPredictor.predictTomorrowsMood();
                
                if (predictionEmbed) {
                    await interaction.update({
                        content: 'Here\'s my prediction for tomorrow:',
                        embeds: [predictionEmbed],
                        components: [createBackRow()]
                    });
                } else {
                    await interaction.update({
                        content: 'Sorry, I couldn\'t generate a prediction right now 😕',
                        components: [createBackRow()]
                    });
                }
            }
        } else if (action === 'mood') {
            console.log(`🎭 Mood selected: ${value}`);
            await interaction.deferUpdate();

            try {
                const updated = await profileManager.updateProfilePicture(interaction.user.id, value);
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
        }
    } catch (error) {
        console.error('❌ Error handling button interaction:', error);
        try {
            await interaction.reply({
                content: 'Sorry, I encountered an error processing your selection.',
                ephemeral: true
            });
        } catch (replyError) {
            try {
                await interaction.followUp({
                    content: 'Sorry, I encountered an error processing your selection.',
                    ephemeral: true
                });
            } catch (followUpError) {
                console.error('❌ Failed to send error message:', followUpError);
            }
        }
    }
});

function createBackRow() {
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('menu_back')
                .setLabel('↩️ Back to Menu')
                .setStyle(ButtonStyle.Danger)
        );
    return row;
}

function createSuggestionButtons(suggestions) {
    const rows = [];
    const buttonPerRow = 4;

    for (let i = 0; i < suggestions.length; i += buttonPerRow) {
        const row = new ActionRowBuilder();
        const rowButtons = suggestions.slice(i, i + buttonPerRow);

        rowButtons.forEach(suggestion => {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`suggestion_${suggestion}`)
                    .setLabel(suggestion)
                    .setStyle(ButtonStyle.Primary)
            );
        });

        rows.push(row);
    }

    return rows;
}

client.login(process.env.DISCORD_TOKEN);