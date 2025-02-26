module.exports = {
    name: 'interactionCreate',
    once: false,
    async execute(interaction, client) {
        // Handle button interactions
        if (interaction.isButton()) {
            // Get the button ID
            const buttonId = interaction.customId;
            
            // Handle different button presses
            if (buttonId.startsWith('help_')) {
                await handleHelpButtons(interaction, client);
                return;
            }
        }
    }
};

async function handleHelpButtons(interaction, client) {
    const { MessageEmbed } = require('discord.js');
    
    // Create embed based on button pressed
    let responseEmbed = new MessageEmbed();
    
    switch(interaction.customId) {
        case 'help_mood_stats':
            responseEmbed
                .setColor('#00ff00')
                .setTitle('Mood Stats Help')
                .setDescription('Here you can track and view your mood statistics.')
                .addFields(
                    { name: '!mood [rating]', value: 'Log your current mood (1-10)' },
                    { name: '!stats', value: 'View your mood statistics' }
                );
            break;
            
        case 'help_limits':
            responseEmbed
                .setColor('#ff9900')
                .setTitle('Limits Help')
                .setDescription('Set and manage your personal limits.')
                .addFields(
                    { name: '!setlimit [type] [value]', value: 'Set a new limit' },
                    { name: '!limits', value: 'View your current limits' }
                );
            break;
            
        case 'help_journal':
            responseEmbed
                .setColor('#9900ff')
                .setTitle('Journal Help')
                .setDescription('Manage your personal journal entries.')
                .addFields(
                    { name: '!journal add [entry]', value: 'Add a new journal entry' },
                    { name: '!journal view', value: 'View your recent journal entries' }
                );
            break;
            
        default:
            responseEmbed
                .setColor('#ff0000')
                .setTitle('Error')
                .setDescription('Invalid button selection.');
    }
    
    // Respond to the interaction
    await interaction.reply({ embeds: [responseEmbed], ephemeral: true });
}
