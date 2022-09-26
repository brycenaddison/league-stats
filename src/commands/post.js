const { SlashCommandBuilder } = require('@discordjs/builders');
const { commands } = require('../cfg/config.json');
const { getTeams } = require('../database/teams');
const { generateEmbed } = require('../utils/postmatch');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('post')
        .setDescription(commands.post)
        .addStringOption((option) =>
            option
                .setName('team')
                .setDescription('Winning team name')
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('drafts')
                .setDescription(
                    'Draftlol links for each game, separated by spaces'
                )
                .setRequired(true)
        )
        .addIntegerOption((option) =>
            option
                .setName('week')
                .setDescription('Week of the match')
                .setRequired(false)
        ),
    async execute(interaction) {
        const links = interaction.options.getString('drafts').split(' ');
        const week = interaction.options.getInteger('week');
        const teamcode = interaction.options.getString('team');
        const teams = await getTeams();

        if (!teams.map((x) => x.code).includes(teamcode)) {
            return await interaction
                .followUp({
                    content:
                        'Make sure your team code is entered exactly as it appears in the list.',
                    embeds: [await teamCodesEmbed(teams)]
                })
                .catch(console.error);
        }

        for (const link of links) {
            if (!isValidDraftlol(link)) {
                return await interaction
                    .followUp(
                        `One or more of your DraftLoL links were invalid: \`${link}\``
                    )
                    .catch(console.error);
            }
        }

        const embed = await generateEmbed(week, teamcode, null, links);

        if (!embed) {
            return await interaction
                .followUp({
                    content:
                        'The system has not detected this match as complete. If it has, contact an admin.'
                })
                .catch(console.error);
        }

        if (embed === -1) {
            return await interaction
                .followUp(
                    'Make sure the number of draft links is equal to the number of games played. If it is, contact an admin.'
                )
                .catch(console.error);
        }

        return await interaction
            .followUp({ embeds: [embed] })
            .catch(console.error);
    }
};

function isValidDraftlol(urlString) {
    const expression =
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
    const urlPattern = new RegExp(expression);
    return !!urlPattern.test(urlString);
}

async function teamCodesEmbed(teams) {
    let value = '';
    let value2 = '';
    teams.forEach((team) => {
        if (value.length > 950) {
            value2 += `**${team.code.padEnd(6)}** ${team.name}\n`;
        } else {
            value += `**${team.code.padEnd(6)}** ${team.name}\n`;
        }
    });
    const fields = [
        {
            name: '\u200B',
            value: value
        }
    ];
    if (value2.length) {
        fields.push({
            name: '\u200B',
            value: value2
        });
    }
    return {
        type: 'rich',
        title: 'List of CCS Team Codes',
        description: '',
        color: 0x00ffff,
        fields: fields,
        thumbnail: {
            url: `${process.env.BASE_URL}/logos/CCS.png`
        },
        footer: {
            text: 'Created by gl4cial',
            icon_url: `${process.env.BASE_URL}/logos/pfp.png`
        }
    };
}
