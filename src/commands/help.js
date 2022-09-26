const { SlashCommandBuilder } = require('@discordjs/builders');
const { color, commands } = require('../cfg/config.json');
const { MessageEmbed } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription(commands.help),
    async execute(interaction) {
        const menu = new MessageEmbed()
            .setColor(color)
            .setTitle('Commands List')
            .setDescription(
                'Classic Championship Series Bot | version ' +
                    process.env.npm_package_version
            );

        for (const command in commands) {
            menu.addField(`/${command}`, commands[command]);
        }

        return await interaction
            .followUp({ embeds: [menu] })
            .catch(console.error);
    }
};
