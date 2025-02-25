const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const StatsManager = require('../services/StatisticsManager');

module.exports = {
    async execute(interaction) {
        try {
            const statsManager = new StatsManager();
            const stats = await statsManager.getUserStats(interaction.user.id);
            const graphs = await statsManager.generateGraphs(interaction.user.id);

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('📊 Mood Statistics')
                .addFields(
                    { name: 'Total mood changes', value: `${stats.totalChanges}`, inline: true },
                    { name: 'Changes today', value: `${stats.todayChanges}`, inline: true },
                    { name: 'Most common mood', value: `${stats.mostCommonMood}`, inline: true }
                );

            // If graphs were generated successfully, add them to the embed
            if (graphs && graphs.trend && graphs.distribution) {
                embed.setImage(graphs.trend);
                // Add distribution graph as thumbnail or in description
                embed.setThumbnail(graphs.distribution);
            }

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('menu_back')
                        .setLabel('Back to Menu')
                        .setStyle(ButtonStyle.Danger)
                );

            await interaction.reply({
                embeds: [embed],
                components: [row]
            });

        } catch (error) {
            console.error('Error in stats command:', error);
            await interaction.reply({
                content: 'There was an error generating your statistics. Please try again later.',
                ephemeral: true
            });
        }
    }
}; 