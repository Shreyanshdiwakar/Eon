const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows all available commands')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('Get detailed help for a specific command')
                .setRequired(false)
                .addChoices(
                    { name: 'mood', value: 'mood' },
                    { name: 'stats', value: 'stats' },
                    { name: 'limits', value: 'limits' },
                    { name: 'journal', value: 'journal' },
                    { name: 'predict', value: 'predict' }
                )),

    async execute(interaction) {
        const specificCommand = interaction.options.getString('command');

        if (specificCommand) {
            return await showCommandHelp(interaction, specificCommand);
        }

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🤖 Eon Bot Commands')
            .setDescription('Here are all available commands. Select a command to see detailed help.')
            .addFields(
                {
                    name: '😊 Mood Management',
                    value: 
                        '`/mood` - Change your mood and Instagram profile\n' +
                        '`/stats` - View your mood statistics and graphs\n' +
                        '`/limits` - Check your mood update limits'
                },
                {
                    name: '📝 Journal & Predictions',
                    value: 
                        '`/journal` - Write or view your daily mood journal\n' +
                        '`/predict` - Get mood predictions based on your history'
                },
                {
                    name: '❓ Help & Info',
                    value: '`/help [command]` - Show this help or get detailed command help'
                }
            )
            .setFooter({ text: 'Tip: Use /help <command> for detailed information about a specific command' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('help_mood')
                    .setLabel('Mood')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('help_stats')
                    .setLabel('Stats')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('help_limits')
                    .setLabel('Limits')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('help_journal')
                    .setLabel('Journal')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.reply({ embeds: [embed], components: [row] });
    },
};

async function showCommandHelp(interaction, command) {
    const helpData = {
        mood: {
            title: '😊 Mood Command Help',
            description: 'Change your mood and update your Instagram profile picture',
            usage: '`/mood`',
            fields: [
                {
                    name: '📝 How to Use',
                    value: '1. Type `/mood`\n2. Click the "Change Mood" button\n3. Select your new mood from the menu'
                },
                {
                    name: '🎭 Available Moods',
                    value: '• Normal\n• Happy\n• Working\n• Tired\n• Sleeping\n• Eating\n• Confused\n• Celebration\n• Birthday\n• With Girlfriend\n• Awkward'
                },
                {
                    name: '⚠️ Limitations',
                    value: '• Maximum 8 updates per day\n• 1 hour cooldown between updates\n• Random delay of 1-3 minutes'
                }
            ]
        },
        stats: {
            title: '📊 Stats Command Help',
            description: 'View your mood statistics and trends',
            usage: '`/stats`',
            fields: [
                {
                    name: '📝 Information Shown',
                    value: '• Total mood changes\n• Changes today\n• Most common mood\n• Mood trend graph\n• Mood distribution chart'
                }
            ]
        },
        limits: {
            title: '⚡ Limits Command Help',
            description: 'Check your current mood update limits and cooldowns',
            usage: '`/limits`',
            fields: [
                {
                    name: '📝 Information Shown',
                    value: '• Daily updates used/remaining\n• Cooldown status\n• Last update time\n• Next daily reset time'
                }
            ]
        },
        journal: {
            title: '📝 Journal Command Help',
            description: 'Write and view your daily mood journal',
            usage: '`/journal`',
            fields: [
                {
                    name: '📝 Features',
                    value: '• Write daily mood entries\n• View past entries\n• Track mood patterns\n• Add personal notes'
                }
            ]
        },
        predict: {
            title: '🔮 Predict Command Help',
            description: 'Get mood predictions based on your history',
            usage: '`/predict`',
            fields: [
                {
                    name: '📝 Features',
                    value: '• View likely next mood\n• See mood patterns\n• Get mood suggestions'
                }
            ]
        }
    };

    const data = helpData[command];
    if (!data) {
        return await interaction.reply({ 
            content: 'Command not found. Use `/help` to see all available commands.',
            ephemeral: true 
        });
    }

    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(data.title)
        .setDescription(data.description)
        .addFields(
            { name: '🔧 Usage', value: data.usage },
            ...data.fields
        );

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('help_back')
                .setLabel('Back to All Commands')
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.reply({ embeds: [embed], components: [row] });
} 