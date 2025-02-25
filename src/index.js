require('dotenv').config();
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection } = require('discord.js');
const MoodDetector = require('./services/MoodDetector');
const ProfileManager = require('./services/ProfileManager');
const TimeManager = require('./services/TimeManager');
const StatisticsManager = require('./services/StatisticsManager');
const MoodSuggester = require('./services/MoodSuggester');
const config = require('./config');
const JournalManager = require('./services/JournalManager');
const MoodPredictor = require('./services/MoodPredictor');
const fs = require('fs');
const InstagramManager = require('./services/InstagramManager');

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

// Change Map to Collection
client.commands = new Collection();

// Load commands
const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    try {
        const command = require(`./commands/${file}`);
        // Add debug logging
        console.log(`Loading command: ${command.name}`);
        client.commands.set(command.name, command);
    } catch (error) {
        console.error(`Error loading command ${file}:`, error);
    }
}

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

// Update message handler
client.on('messageCreate', async message => {
    if (message.author.bot) return;
    
    // Handle commands
    if (message.content.startsWith('!')) {
        const args = message.content.slice(1).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        console.log('Command attempted:', commandName);
        console.log('Available commands:', Array.from(client.commands.keys()));

        const command = client.commands.get(commandName);
        if (!command) {
            console.log('Command not found:', commandName);
            return;
        }

        try {
            console.log(`📝 Executing command: ${commandName}`);
            await command.execute(message, args);
        } catch (error) {
            console.error('❌ Command execution error:', error);
            await message.reply('There was an error executing that command!');
        }
    } else {
        try {
            // Detect mood from message
            const detectedMood = await moodDetector.detectMood(message.content);
            
            if (detectedMood) {
                // Get the InstagramManager instance
                const igManager = new InstagramManager();
                
                // Update the profile picture
                await igManager.updateProfilePicture(message.author.id, detectedMood);
                
                // Send a subtle confirmation with the detected mood
                await message.react('👍');
                console.log(`Updated profile picture for ${message.author.username} to ${detectedMood} mood`);
            }
        } catch (error) {
            console.error('Error in mood detection:', error);
        }
    }
});

// Handle button interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    try {
        const [command, action] = interaction.customId.split('_');
        
        if (command === 'help') {
            const helpCommand = client.commands.get('help');
            await helpCommand.handleButton(interaction);
        } else if (action === 'next' || action === 'prev') {
            const currentPage = parseInt(value);
            const newPage = action === 'next' ? currentPage + 1 : currentPage - 1;
            const rows = createMoodButtons(newPage);
            
            await interaction.update({
                content: '**Choose a mood:**',
                components: rows
            });
            return;
        } else if (action === 'menu') {
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
        console.error('Error handling button interaction:', error);
        await interaction.reply({ 
            content: 'There was an error processing your request.',
            ephemeral: true 
        });
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