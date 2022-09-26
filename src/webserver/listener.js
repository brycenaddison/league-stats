require('dotenv').config();
const history = require('../utils/embedmatchhistory');
const { addNewMatch, getGameNumber } = require('../database/matchlist');
const { teamCodeFromCB } = require('../database/teams');
const postmatch = require('../utils/postmatch');
const matchdata = require('../database/matchdata');

module.exports = async (client, res) => {
    const matchId = `${res.region}_${res.gameId}`;
    let week = -1;
    let conf = null;
    let winningTeam = null;
    let losingTeam = null;
    let game = null;

    try {
        const data = JSON.parse(res.metaData);
        week = data.week;
        conf = data.conf;
        ({ winningTeam, losingTeam } = await Promise.all([
            teamCodeFromCB(res.winningTeam, conf),
            teamCodeFromCB(res.losingTeam, conf)
        ]).then((response) => {
            return {
                winningTeam: response[0],
                losingTeam: response[1]
            };
        }));
        if (!winningTeam) {
            console.log(
                `Match ${matchId} finished with no winner and was not added to the database.`
            );
            return;
        }
        game = await getGameNumber(winningTeam, losingTeam, week);
    } finally {
        addNewMatch(
            matchId,
            week,
            conf,
            res.startTime,
            res.shortCode,
            winningTeam,
            losingTeam,
            game
        )
            .then(() => {
                return postmatch.generate(
                    client,
                    week,
                    winningTeam,
                    losingTeam
                );
            })
            .then(() => {
                return matchdata.fetch(matchId);
            });
    }

    client.webhook.send({
        content: 'A match finished!',
        username: 'Match History',
        avatarURL: process.env.SERVER_ICON,
        embeds: [history(matchId, conf, week, winningTeam, losingTeam, game)]
    });
};
