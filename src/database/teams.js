const { query } = require('./rds');
const _ = require('lodash');
const { RiotClient } = require('../utils/api');

async function uploadTeam(team) {
    let success = false;
    try {
        const result = await query(
            `INSERT INTO teams
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
             RETURNING *`,
            [
                team.code,
                team.name,
                team.logo,
                team.conf,
                team.top,
                team.jg,
                team.mid,
                team.bot,
                team.sup,
                team.subs
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

async function createTeam(code, name, logo, conf, starters, subs) {
    if (!subs) {
        subs = [];
    }
    if (starters.length != 5 || subs.length > 5) {
        return null;
    }
    const names = [...starters, ...subs];
    const api = new RiotClient();
    console.log(`Fetching summoner names for ${name}`);
    const ids = await api.getIdFromSummonerName(names).then((res) => {
        console.log(`Fetched summoner names for ${name}`);
        return res;
    });
    const dict = _.zipObject(names, ids);
    return {
        code: code,
        name: name,
        logo: logo || null,
        conf: conf || null,
        top: dict[starters[0]] || null,
        jg: dict[starters[1]] || null,
        mid: dict[starters[2]] || null,
        bot: dict[starters[3]] || null,
        sup: dict[starters[4]] || null,
        subs: subs.map((x) => dict[x]) || null
    };
}

async function getTeamList() {
    const rows = await query('SELECT code FROM teams').catch((e) =>
        console.error(e)
    );
    return rows.map((x) => x.code);
}

async function getPlayerTeam(puuid, conf) {
    let rows = null;
    if (!conf) {
        rows = await query(
            `SELECT code, conf FROM teams
            WHERE (top = $1 OR jg = $1 OR mid = $1 OR bot = $1 OR sup = $1
            OR $1=ANY(subs))`,
            [puuid]
        );
    } else {
        rows = await query(
            `SELECT code FROM teams
         WHERE conf = $2
         AND (top = $1 OR jg = $1 OR mid = $1 OR bot = $1 OR sup = $1
            OR $1=ANY(subs))`,
            [puuid, conf]
        );
    }
    if (!rows || rows.length == 0) {
        return null;
    }
    return rows[0];
}

async function getTeam(puuids, conf) {
    const teams = [];
    const teams2 = [];
    for (const puuid of puuids) {
        const team = await getPlayerTeam(puuid, conf);
        if (!team) {
            continue;
        }
        if (teams2.includes(team)) {
            return team;
        }
        if (teams.includes(team)) {
            teams2.push(team);
        }
        teams.push(team);
    }
    if (teams2.length != 0) {
        return teams2[0];
    }
    if (teams.length != 0) {
        return teams[0];
    }
    return null;
}

async function teamCodeFromCB(cbNames, conf) {
    if (!cbNames || cbNames.length == 0) {
        return null;
    }
    const summonerNames = cbNames.map((x) => x.summonerName);
    const api = new RiotClient();
    const puuids = await api.getIdFromSummonerName(summonerNames);
    const team = await getTeam(puuids, conf);
    return team.code;
}

function teamsFromMatchData(match, conf) {
    let winners = [];
    let losers = [];

    match.info.participants.forEach((participant) => {
        if (participant.win) {
            winners.push(participant.puuid);
        } else {
            losers.push(participant.puuid);
        }
    });

    if (winners.length == 0 && losers.length == 10) {
        winners = losers.slice(0, 4);
        losers = losers.slice(5, 9);
    }

    return Promise.all([getTeam(winners, conf), getTeam(losers, conf)]).then(
        (values) => {
            return {
                winner: values[0] ? values[0].code : null,
                winnerConf: values[0] ? values[0].conf : null,
                loser: values[1] ? values[1].code : null,
                loserConf: values[1] ? values[1].conf : null
            };
        }
    );
}

async function teamsFromMatchId(matchId, conf) {
    const api = new RiotClient();
    const match = await api.getMatchData(matchId);
    const teams = await teamsFromMatchData(match, conf);
    return teams;
}

async function getTeamFromCode(teamcode) {
    const rows = await query('SELECT * FROM teams WHERE code = $1', [teamcode]);
    if (!rows || rows.length == 0) {
        return null;
    }
    return rows[0];
}

async function getTeams(conf) {
    if (!conf) {
        const rows = await query('SELECT * FROM teams ORDER BY code');
        if (!rows || rows.length == 0) {
            return null;
        }
        return rows;
    }
    const rows = await query(
        'SELECT * FROM teams WHERE conf = $1 ORDER BY code',
        [conf]
    );
    if (!rows || rows.length == 0) {
        return null;
    }
    return rows;
}

module.exports = {
    createTeam,
    uploadTeam,
    getTeamList,
    teamCodeFromCB,
    teamsFromMatchData,
    teamsFromMatchId,
    getTeam,
    getTeamFromCode,
    getTeams
};
