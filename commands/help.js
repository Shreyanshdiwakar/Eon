const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');

module.exports = {
    name: 'help',
    description: 'Displays help menu',
    async execute(message, args, client) {
        try {
            // Create main help embed
            const helpEmbed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle('Bot Help Menu')
                .setDescription('Welcome to the help menu. Click a button below to see more information.')
                .setFooter({ text: 'Use the buttons below to navigate' });
            
            // Create buttons with unique custom IDs
            const row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('help_mood_stats')
                        .setLabel('Mood Stats')
                        .setStyle('PRIMARY'),
                    new MessageButton()
                        .setCustomId('help_limits')
                        .setLabel('Limits')
                        .setStyle('PRIMARY'),
                    new MessageButton()
                        .setCustomId('help_journal')
                        .setLabel('Journal')
                        .setStyle('PRIMARY')
                );
            
            await message.reply({ embeds: [helpEmbed], components: [row] });
        } catch (error) {
            console.error('Error executing help command:', error);
            message.reply('There was an error displaying the help menu.');
        }
    }
};
