const { RiotClient } = require('../utils/api');
const matchlist = require('./matchlist');
const performance = require('./performance');
const { query } = require('./rds');

async function ids() {
    const rows = await query('SELECT "matchId" FROM matchdata').catch((e) =>
        console.error(e)
    );
    if (!rows || rows.length == 0) {
        return null;
    }
    return rows.map((x) => x.matchId);
}

async function getMatchData(matchId) {
    const rows = await query(
        'SELECT data FROM matchdata WHERE "matchId" = $1',
        [matchId]
    ).catch((e) => console.error(e));
    if (!rows || rows.length == 0) {
        return null;
    }
    return rows[0].data;
}

async function get(matchId) {
    const matchIds = await ids();
    if (matchIds.includes(matchId)) {
        return getMatchData(matchId);
    }
    const matches = await matchlist.getMatchIds();
    if (matches.includes(matchId)) {
        return fetch(matchId);
    }
    return null;
}

async function upload(matchId, matchData) {
    let success = false;
    try {
        const result = await query(
            'INSERT INTO matchdata("matchId", "data") VALUES ($1, $2) RETURNING *',
            [matchId, matchData]
        );

        if (result.length) {
            success = true;
        }
    } catch (e) {
        console.log(`Upload error: ${e}`);
    }
    return success;
}

async function fetch(matchId) {
    const api = new RiotClient();

    const { matchData, timelineData } = await Promise.all([
        api.getMatchData(matchId),
        api.getMatchTimeline(matchId)
    ]).then((values) => {
        return {
            matchData: values[0],
            timelineData: values[1]
        };
    });

    if (!matchData || !timelineData) {
        return null;
    }

    upload(matchId, matchData).catch((e) => console.error(e));
    performance
        .addGame(matchId, matchData, timelineData)
        .catch((e) => console.error(e));
    return matchData;
}

async function all() {
    const rows = await query('SELECT * FROM matchdata').catch((e) =>
        console.error(e)
    );
    if (!rows || rows.length == 0) {
        return null;
    }
    return rows.reduce((o, row) => ({ ...o, [row.matchId]: row.data }), {});
}

module.exports = {
    ids,
    get,
    all,
    fetch
};
