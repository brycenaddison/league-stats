const { query } = require('./rds');

async function upload(data) {
    let success = false;
    try {
        const result = await query(
            `INSERT INTO matchlist("matchId", "week", "conf", "startTime", "shortCode", "winner", "loser", "game")
             VALUES ($1, $2, $3, to_timestamp($4::double precision/1000) AT TIME ZONE 'US/Eastern', $5, $6, $7, $8) RETURNING *`,
            [
                data.matchId,
                data.week,
                data.conf,
                data.startTime,
                data.shortCode,
                data.winningTeam,
                data.losingTeam,
                data.game
            ]
        );

        if (result.length) {
            success = true;
        }
    } catch (e) {
        console.log(`Upload error: ${e}`);
    }
    return success;
}

async function addNewMatch(
    matchId,
    week,
    conf,
    startTime,
    shortCode,
    winningTeam,
    losingTeam,
    game
) {
    if ((await getMatchIds()).includes(matchId)) {
        return false;
    }

    // otherwise the match is added
    const data = {
        matchId: matchId,
        week: week,
        conf: conf || null,
        startTime: startTime || null,
        shortCode: shortCode || null,
        winningTeam: winningTeam || null,
        losingTeam: losingTeam || null,
        game: game || null
    };

    // the remote database is also updated
    if (await upload(data)) {
        console.log(`Uploaded ${matchId} to RDS.`);
    } else {
        console.log(`Failed uploading ${matchId} to RDS.`);
    }

    return true;
}

async function getMatchIds() {
    const rows = await query('SELECT "matchId" FROM matchlist').catch((e) =>
        console.error(e)
    );
    if (!rows || rows.length == 0) {
        return null;
    }
    return rows.map((x) => x.matchId);
}

async function getConf(matchId) {
    const rows = await query(
        'SELECT "conf" FROM matchlist WHERE "matchId" = $1',
        [matchId]
    ).catch((e) => console.error(e));
    if (!rows || rows.length == 0) {
        return null;
    }
    return rows[0].conf;
}

async function getMatch(team1, team2, week) {
    if (!team2) {
        if (!week) {
            const rows = await query(
                'SELECT * FROM matchlist WHERE (("winner" = $1 OR "loser" = $1) AND ("week" = (SELECT MAX(week) FROM matchlist))) ORDER BY "game"',
                [team1]
            ).catch((e) => console.error(e));
            if (!rows || rows.length == 0) {
                return null;
            }
            return rows;
        }
        const rows = await query(
            'SELECT * FROM matchlist WHERE (("winner" = $1 OR "loser" = $1) AND ("week" = $2)) ORDER BY "game"',
            [team1, week]
        ).catch((e) => console.error(e));
        if (!rows || rows.length == 0) {
            return null;
        }
        return rows;
    }
    if (!week) {
        const rows = await query(
            'SELECT * FROM matchlist WHERE (("winner" = $1 OR "loser" = $1) AND ("winner" = $2 OR "loser" = $2) AND ("week" = (SELECT MAX(week) FROM matchlist))) ORDER BY "game"',
            [team1, team2]
        ).catch((e) => console.error(e));
        if (!rows || rows.length == 0) {
            return null;
        }
        return rows;
    }
    const rows = await query(
        'SELECT * FROM matchlist WHERE (("winner" = $1 OR "loser" = $1) AND ("winner" = $2 OR "loser" = $2) AND ("week" = $3)) ORDER BY "game"',
        [team1, team2, week]
    ).catch((e) => console.error(e));
    if (!rows || rows.length == 0) {
        return null;
    }
    return rows;
}

async function getGameNumber(team1, team2, week) {
    const rows = await query(
        'SELECT "matchId" FROM matchlist WHERE (("winner" = $1 OR "loser" = $1) AND ("winner" = $2 OR "loser" = $2) AND ("week" = $3))',
        [team1, team2, week]
    ).catch((e) => console.error(e));
    if (!rows || rows.length == 0) {
        return 1;
    }
    return rows.length + 1;
}

async function getOpponent(team, week) {
    const match = await getMatch(team, week);
    if (!match) {
        return null;
    }
    const teams = [match[0].winner, match[0].loser];
    teams.splice(teams.indexOf(team), 1);
    return teams[0];
}

async function getMatchList() {
    const rows = await query('SELECT * FROM matches').catch((e) =>
        console.error(e)
    );
    if (!rows || rows.length == 0) {
        return null;
    }
    return rows;
}

async function get(matchId) {
    const rows = await query('SELECT * FROM matchlist WHERE "matchId" = $1', [
        matchId
    ]).catch((e) => console.error(e));
    if (!rows || rows.length == 0) {
        return null;
    }
    return rows[0];
}

module.exports = {
    addNewMatch,
    getMatchIds,
    getConf,
    getMatch,
    getOpponent,
    getGameNumber,
    getMatchList,
    get
};
