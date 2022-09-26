const { getMatch } = require('../database/matchlist');
const cfg = require('../cfg/config.json');
const { getTeamFromCode } = require('../database/teams');
require('dotenv').config();

async function generate(client, week, winner, loser, links) {
    const embed = await generateEmbed(week, winner, loser, links);

    if (!embed) {
        return false;
    }

    client.webhook.send({
        content: 'A series finished!',
        username: 'Match History',
        avatarURL: process.env.SERVER_ICON,
        embeds: [embed]
    });

    return true;
}

async function generateEmbed(week, winner, loser, links) {
    const matches = await getMatch(winner, loser, week);

    if (!matches) {
        return null;
    }

    if (!week) {
        week = matches[0].week;
    }

    if (!loser) {
        if (matches[0].loser == winner) {
            loser = matches[0].winner;
        } else {
            loser = matches[0].loser;
        }
    }

    let wins = 0;
    const conf = matches[0].conf;
    const bestOf = getSeriesLength(week, conf);

    matches.forEach((match) => {
        if (match.winner == winner) {
            wins++;
        }
    });

    if (wins <= bestOf / 2) {
        return null;
    }

    return seriesHistory(matches, winner, loser, week, conf, bestOf, links);
}

function getSeriesLength(week, conf) {
    const season = cfg.seasons.find((s) => s.conf == conf);
    if (!season) {
        throw `conf "${conf}" not found in config`;
    }
    if (!season.layout) {
        throw 'layout attribute not found in season config, check cfg/config.json';
    }
    if (!season.layout.length) {
        throw 'no season layouts found in config, check cfg/config.json';
    }
    let length = season.layout[0].bestOf;
    for (let i = 1; i < season.layout.length; i++) {
        if (week >= season.layout[i].startingWeek) {
            length = season.layout[i].bestOf;
        }
    }
    return length;
}

async function seriesHistory(
    matches,
    winnerCode,
    loserCode,
    week,
    conf,
    bestOf,
    links
) {
    const fields = [];
    if (links) {
        if (matches.length != links.length) {
            return -1;
        }
        fields.push({
            name: 'Draft Links',
            value: ''
        });
        links.forEach((link, index) => {
            fields[0].value += `[Game ${index + 1}](${link})\n`;
        });
    }
    fields.push({
        name: 'Match History',
        value: ''
    });

    let wWins = 0;
    let lWins = 0;

    matches.forEach((match) => {
        match.winner == winnerCode ? wWins++ : lWins++;
        const matchLink = `${process.env.BASE_URL}/match/${match.matchId}`;
        fields[
            links ? 1 : 0
        ].value += `[${winnerCode} ${wWins}-${lWins} ${loserCode}](${matchLink})\n`;
    });

    const { winner, loser } = await Promise.all([
        getTeamFromCode(winnerCode),
        getTeamFromCode(loserCode)
    ]).then((results) => {
        return {
            winner: results[0],
            loser: results[1]
        };
    });

    const embed = {
        type: 'rich',
        title: `${winner.name} vs ${loser.name}`,
        description: `${getConfName(conf)} Week ${week}, bo${bestOf}`,
        color: cfg.color,
        fields: fields,
        thumbnail: {
            url: winner.logo
        },
        footer: {
            text: 'Classic Championship Series',
            icon_url: `${process.env.BASE_URL}/logos/CCS.png`
        }
    };

    return embed;
}

function getConfName(conf) {
    const season = cfg.seasons.find((s) => s.conf == conf);
    if (!season) {
        return null;
    }
    return season.name;
}

module.exports = { generate, getSeriesLength, generateEmbed };
