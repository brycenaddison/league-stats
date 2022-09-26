const { SlashCommandBuilder } = require('@discordjs/builders');
const { commands } = require('../cfg/config.json');
const { RiotClient } = require('../utils/api.js');
const { Permissions } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('code')
        .setDescription(commands.code)
        .addIntegerOption((option) =>
            option
                .setName('count')
                .setDescription('Number of codes to generate')
                .setRequired(true)
        )
        .addIntegerOption((option) =>
            option
                .setName('week')
                .setDescription('Week number')
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('conference')
                .setDescription('Conference for these games')
                .setRequired(true)
                .addChoices(
                    { name: 'Wednesday', value: 'wed' },
                    { name: 'Thursday', value: 'thu' },
                    { name: 'Diamond', value: 'fri' }
                )
        ),
    async execute(interaction) {
        if (
            !interaction.memberPermissions.has(Permissions.FLAGS.KICK_MEMBERS)
        ) {
            return await interaction
                .followUp({
                    content:
                        'Commands are currently only supported for moderators.'
                })
                .catch(console.error);
        }

        const count = interaction.options.getInteger('count');
        const api = new RiotClient();
        const codes = await api.createCodes(
            count,
            JSON.stringify({
                week: interaction.options.getInteger('week'),
                conf: interaction.options.getString('conference')
            })
        );

        return await interaction
            .followUp(stringify(codes))
            .catch(console.error);
    }
};

function stringify(codes) {
    let output = '';

    codes.forEach((item, index) => {
        output += `Game ${index + 1}: \`${item}\`\n`;
    });

    return output.substring(0, output.length - 1);
}
