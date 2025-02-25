const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const InstagramManager = require('../services/InstagramManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('limits')
        .setDescription('Check your mood update limits'),

    async execute(interaction) {
        const igManager = new InstagramManager();
        const limits = await igManager.getLimitStatus(interaction.user.id);

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('📊 Mood Update Limits')
            .addFields(
                { name: 'Daily Updates', value: limits.daily, inline: true },
                { name: 'Cooldown', value: limits.cooldown, inline: true },
                { name: 'Last Update', value: limits.lastUpdate, inline: false },
                { name: 'Next Daily Reset', value: limits.nextReset, inline: false }
            );

        await interaction.reply({ embeds: [embed] });
    },
}; 