const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'help',
    description: 'Shows all available commands',
    async execute(message, args) {
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🤖 Eon Bot Commands')
            .setDescription('Here are all available commands. Click the buttons below for detailed help.')
            .addFields(
                {
                    name: '😊 Mood Management',
                    value: 
                        '`!mood` - Change your mood and Instagram profile\n' +
                        '`!stats` - View your mood statistics and graphs\n' +
                        '`!limits` - Check your mood update limits'
                },
                {
                    name: '📝 Journal & Predictions',
                    value: 
                        '`!journal` - Write or view your daily mood journal\n' +
                        '`!predict` - Get mood predictions based on your history'
                },
                {
                    name: '❓ Help & Info',
                    value: '`!help [command]` - Show this help or get detailed command help'
                }
            )
            .setFooter({ text: 'Click the buttons below for detailed command help' });

        const row1 = new ActionRowBuilder()
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
                    .setStyle(ButtonStyle.Primary)
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('help_journal')
                    .setLabel('Journal')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('help_predict')
                    .setLabel('Predict')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('help_notsure')
                    .setLabel('Not Sure?')
                    .setStyle(ButtonStyle.Success)
            );

        await message.reply({ embeds: [embed], components: [row1, row2] });
    },

    async handleButton(interaction) {
        try {
            console.log('Handling button:', interaction.customId);
            
            const embed = new EmbedBuilder()
                .setColor('#0099ff');

            switch (interaction.customId) {
                case 'help_mood':
                    embed
                        .setTitle('😊 Mood Command Help')
                        .setDescription('Change your mood and update your Instagram profile picture')
                        .addFields(
                            { name: '📝 Usage', value: '`!mood` or just express your mood in chat' },
                            { name: '🎭 Available Moods', value: '• Normal\n• Happy\n• Working\n• Tired\n• Sleeping\n• Eating\n• Confused\n• Celebration\n• Birthday\n• With Girlfriend\n• Awkward' },
                            { name: '⚠️ Limitations', value: '• Maximum 8 updates per day\n• 1 hour cooldown between updates\n• Random delay of 1-3 minutes' },
                            { name: '💡 Natural Language', value: 'You can also just chat normally!\nExample: "I\'m so happy today!" will update your mood to happy' }
                        );
                    break;

                case 'help_stats':
                    embed
                        .setTitle('📊 Stats Command Help')
                        .setDescription('View your mood statistics and trends')
                        .addFields(
                            { name: '📝 Usage', value: '`!stats`' },
                            { name: '📊 Information Shown', value: '• Total mood changes\n• Changes today\n• Most common mood\n• Mood trend graph\n• Mood distribution chart' }
                        );
                    break;

                case 'help_predict':
                    embed
                        .setTitle('🔮 Predict Command Help')
                        .setDescription('Get AI predictions about your future moods')
                        .addFields(
                            { name: '📝 Usage', value: '`!predict`' },
                            { name: '✨ Features', value: '• Predict your next likely mood\n• See mood patterns\n• Get personalized suggestions\n• AI-powered analysis' }
                        );
                    break;

                case 'help_notsure':
                    embed
                        .setTitle('🤔 Not Sure What to Do?')
                        .setDescription('Here are some suggestions to get started:')
                        .addFields(
                            { name: '1️⃣ Express Yourself', value: 'Just chat normally! The bot will detect your mood.' },
                            { name: '2️⃣ Check Your Stats', value: 'Use `!stats` to see your mood patterns' },
                            { name: '3️⃣ Get Predictions', value: 'Try `!predict` to see what mood might come next' },
                            { name: '4️⃣ Write in Journal', value: 'Use `!journal` to keep track of your thoughts' }
                        );
                    break;

                case 'help_back':
                    // Return to main help menu
                    return await this.execute(interaction);
            }

            const backRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('help_back')
                        .setLabel('Back to All Commands')
                        .setStyle(ButtonStyle.Secondary)
                );

            await interaction.update({ embeds: [embed], components: [backRow] });
        } catch (error) {
            console.error('Help button error:', error);
            await interaction.reply({ 
                content: 'There was an error showing the help information.',
                ephemeral: true 
            });
        }
    }
};

async function showCommandHelp(message, command) {
    const helpData = {
        mood: {
            title: '😊 Mood Command Help',
            description: 'Change your mood and update your Instagram profile picture',
            usage: '`!mood`',
            fields: [
                {
                    name: '📝 How to Use',
                    value: '1. Type `!mood`\n2. Click the "Change Mood" button\n3. Select your new mood from the menu'
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
            usage: '`!stats`',
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
            usage: '`!limits`',
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
            usage: '`!journal`',
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
            usage: '`!predict`',
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
        return await message.reply({ 
            content: 'Command not found. Use `!help` to see all available commands.',
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

    await message.reply({ embeds: [embed], components: [row] });
} 