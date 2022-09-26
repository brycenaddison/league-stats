const matchlist = require('./matchlist');
const { query } = require('./rds');

async function uploadPerformance(d) {
    let success = false;
    try {
        const result = await query(
            `INSERT INTO performance(
                "puuid",
                "team",
                "role",
                "matchId",
                "win",
                "time",
                "k",
                "d",
                "a",
                "cs",
                "gold",
                "xp",
                "dmg",
                "vs",
                "w",
                "cw",
                "wc",
                "solokills",
                "fb",
                "fbv",
                "doubles",
                "triples",
                "quadras",
                "pentas",
                "gold8",
                "xp8",
                "cs8",
                "gold14",
                "xp14",
                "cs14",
                "gd8",
                "xpd8",
                "csd8",
                "gd14",
                "xpd14",
                "csd14",
                "k15",
                "a15",
                "d15",
                "k25",
                "a25",
                "d25",
                "jgmins",
                "champid"
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44) RETURNING *`,
            [
                d.puuid,
                d.team,
                d.role,
                d.matchId,
                d.win,
                d.time,
                d.k,
                d.d,
                d.a,
                d.cs,
                d.gold,
                d.xp,
                d.dmg,
                d.vs,
                d.w,
                d.cw,
                d.wc,
                d.solokills,
                d.fb,
                d.fbv,
                d.doubles,
                d.triples,
                d.quadras,
                d.pentas,
                d.gold8,
                d.xp8,
                d.cs8,
                d.gold14,
                d.xp14,
                d.cs14,
                d.gd8,
                d.xpd8,
                d.csd8,
                d.gd14,
                d.xpd14,
                d.csd14,
                d.k15,
                d.a15,
                d.d15,
                d.k25,
                d.a25,
                d.d25,
                d.jgmins,
                d.champid
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

async function uploadTeamPerformance(teamPerformance) {
    let success = false;
    try {
        const result = await query(
            `INSERT INTO teamperformance(
                "team",
                "matchId",
                "opponent",
                "bans",
                "win",
                "time",
                "k",
                "d",
                "a",
                "cs",
                "gold",
                "xp",
                "dmg",
                "vs",
                "w",
                "cw",
                "wc",
                "ow",
                "fb",
                "bFirst",
                "bKills",
                "bGiven",
                "dFirst",
                "dKills",
                "dGiven",
                "hFirst",
                "hKills",
                "hGiven",
                "tFirst",
                "tKills",
                "tGiven",
                "gd14",
                "xpd14",
                "csd14",
                "k15",
                "a15",
                "d15",
                "k25",
                "a25",
                "d25",
                "blueside"
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41) RETURNING *`,
            [
                teamPerformance.team,
                teamPerformance.matchId,
                teamPerformance.opponent,
                teamPerformance.bans.map((x) => JSON.stringify(x)),
                teamPerformance.win,
                teamPerformance.time,
                teamPerformance.k,
                teamPerformance.d,
                teamPerformance.a,
                teamPerformance.cs,
                teamPerformance.gold,
                teamPerformance.xp,
                teamPerformance.dmg,
                teamPerformance.vs,
                teamPerformance.w,
                teamPerformance.cw,
                teamPerformance.wc,
                teamPerformance.ow,
                teamPerformance.fb,
                teamPerformance.bFirst,
                teamPerformance.bKills,
                teamPerformance.bGiven,
                teamPerformance.dFirst,
                teamPerformance.dKills,
                teamPerformance.dGiven,
                teamPerformance.hFirst,
                teamPerformance.hKills,
                teamPerformance.hGiven,
                teamPerformance.tFirst,
                teamPerformance.tKills,
                teamPerformance.tGiven,
                teamPerformance.gd14,
                teamPerformance.xpd14,
                teamPerformance.csd14,
                teamPerformance.k15,
                teamPerformance.a15,
                teamPerformance.d15,
                teamPerformance.k25,
                teamPerformance.a25,
                teamPerformance.d25,
                teamPerformance.blueside
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

async function addGame(matchId, matchData, timelineData) {
    const matchIds = await ids();
    if (matchIds && matchIds.includes(matchId)) {
        return false;
    }

    const match = await matchlist.get(matchId);
    const performances = matchData.metadata.participants.map((puuid) => {
        return createPerformance(
            puuid,
            match.winner,
            match.loser,
            matchData,
            timelineData
        );
    });

    calcPositionals(match, timelineData, performances, [8, 14]);

    const winningTeam = createTeamPerformance(
        match.winner,
        match.loser,
        true,
        performances,
        matchData
    );
    const losingTeam = createTeamPerformance(
        match.loser,
        match.winner,
        false,
        performances,
        matchData
    );

    await Promise.all([
        ...performances.map((data) => {
            return uploadPerformance(data);
        }),
        uploadTeamPerformance(winningTeam),
        uploadTeamPerformance(losingTeam)
    ]);

    return true;
}

function createTeamPerformance(team, opponent, win, performances, matchData) {
    const teamData = matchData.info.teams.find((o) => o.win == win);
    if (!teamData) {
        throw `${matchData.metadata.matchId} has no winner`;
    }
    const opponentTeamData = matchData.info.teams.find((o) => o.win != win);
    const teamPerformance = {
        matchId: matchData.metadata.matchId,
        team: team,
        opponent: opponent,
        bans: teamData.bans,
        win: win,
        blueside: teamData.teamId == 100,
        time: performances[0].time,
        k: 0,
        d: 0,
        a: 0,
        cs: 0,
        gold: 0,
        xp: 0,
        dmg: 0,
        vs: 0,
        w: 0,
        cw: 0,
        wc: 0,
        k15: 0,
        d15: 0,
        a15: 0,
        k25: 0,
        d25: 0,
        a25: 0,
        xpd14: 0,
        csd14: 0,
        gd14: 0,
        ow: 0,
        fb: teamData.objectives.champion.first,
        bFirst: teamData.objectives.baron.first,
        bKills: teamData.objectives.baron.kills,
        bGiven: opponentTeamData.objectives.baron.kills,
        dFirst: teamData.objectives.dragon.first,
        dKills: teamData.objectives.dragon.kills,
        dGiven: opponentTeamData.objectives.dragon.kills,
        hFirst: teamData.objectives.riftHerald.first,
        hKills: teamData.objectives.riftHerald.kills,
        hGiven: opponentTeamData.objectives.riftHerald.kills,
        tFirst: teamData.objectives.tower.first,
        tKills: teamData.objectives.tower.kills,
        tGiven: opponentTeamData.objectives.tower.kills
    };
    performances.forEach((p) => {
        if (p.win == win) {
            teamPerformance.k += p.k;
            teamPerformance.d += p.d;
            teamPerformance.a += p.a;
            teamPerformance.cs += p.cs;
            teamPerformance.gold += p.gold;
            teamPerformance.xp += p.xp;
            teamPerformance.dmg += p.dmg;
            teamPerformance.vs += p.vs;
            teamPerformance.w += p.w;
            teamPerformance.cw += p.cw;
            teamPerformance.wc += p.wc;
            teamPerformance.k15 += p.k15;
            teamPerformance.d15 += p.d15;
            teamPerformance.a15 += p.a15;
            teamPerformance.k25 += p.k25;
            teamPerformance.d25 += p.d25;
            teamPerformance.a25 += p.a25;
            teamPerformance.xpd14 += p.xpd14;
            teamPerformance.csd14 += p.csd14;
            teamPerformance.gd14 += p.gd14;
        } else {
            teamPerformance.ow += p.cw + p.w;
        }
    });
    return teamPerformance;
}

function calcPositionals(match, timeline, performances, timestamps) {
    for (const p of performances) {
        const opp = performances.find(
            (o) => o.team != p.team && o.role == p.role
        );
        const jg = performances.find(
            (o) => o.team == p.team && o.role == 'JUNGLE'
        );
        if (!opp) {
            console.log(performances);
            throw `Positional error in match ${match.matchId}: can't find opponent for ${p.team} ${p.role}`;
        }
        if (!jg) {
            throw `Positional error in match ${match.matchId}: can't find jungler for ${p.team}`;
        }
        // TODO: add null check in case games are <14 mins
        for (const t of timestamps) {
            p[`gd${t}`] = p[`gold${t}`] - opp[`gold${t}`];
            p[`xpd${t}`] = p[`xp${t}`] - opp[`xp${t}`];
            p[`csd${t}`] = p[`cs${t}`] - opp[`cs${t}`];
        }
        if (p != jg) {
            p.jgmins = getJP(p.puuid, jg.puuid, timeline);
        }
    }
}

async function ids() {
    const rows = await query('SELECT "matchId" FROM performance').catch((e) =>
        console.error(e)
    );
    if (!rows || rows.length == 0) {
        return null;
    }
    return rows.map((x) => x.matchId);
}

async function get(conf) {
    if (!conf) {
        const rows = await query(
            `SELECT *
             FROM stats`
        ).catch((e) => console.error(e));
        if (!rows || rows.length == 0) {
            return null;
        }
        return rows;
    }
    const rows = await query(
        `SELECT *
         FROM stats
         WHERE conf = $1`,
        [conf]
    ).catch((e) => console.error(e));
    if (!rows || rows.length == 0) {
        return null;
    }
    return rows;
}

async function teams(conf) {
    if (!conf) {
        const rows = await query(
            `SELECT *
             FROM teamperformance
             INNER JOIN matchlist
             ON teamperformance."matchId" = matchlist."matchId"`
        ).catch((e) => console.error(e));
        if (!rows || rows.length == 0) {
            return null;
        }
        return rows;
    }
    const rows = await query(
        `SELECT *
         FROM teamperformance
         INNER JOIN matchlist
         ON teamperformance."matchId" = matchlist."matchId"
         WHERE conf = $1`,
        [conf]
    ).catch((e) => console.error(e));
    if (!rows || rows.length == 0) {
        return null;
    }
    return rows;
}

function createPerformance(
    puuid,
    winningTeam,
    losingTeam,
    matchData,
    timelineData
) {
    const p = matchData.info.participants.find((obj) => obj.puuid == puuid);
    const fbv = wasFBVictim(puuid, timelineData);
    const t = timestampStats(puuid, timelineData, [8, 14]);
    const ka15 = getKDAatTime(puuid, timelineData, 15);
    const ka25 = getKDAatTime(puuid, timelineData, 25);
    const performance = {
        puuid: puuid,
        team: p.win ? winningTeam : losingTeam,
        role: p.teamPosition,
        matchId: matchData.metadata.matchId,
        win: p.win,
        time: p.timePlayed,
        k: p.kills,
        d: p.deaths,
        a: p.assists,
        cs: p.neutralMinionsKilled + p.totalMinionsKilled,
        gold: p.goldEarned,
        xp: p.champExperience,
        dmg: p.totalDamageDealtToChampions,
        vs: p.visionScore,
        w: p.wardsPlaced,
        cw: p.visionWardsBoughtInGame,
        wc: p.wardsKilled,
        solokills: p.challenges.soloKills,
        fb: p.firstBloodAssist || p.firstBloodKill,
        fbv: fbv,
        doubles: p.doubleKills,
        triples: p.tripleKills,
        quadras: p.quadraKills,
        pentas: p.pentaKills,
        ...t,
        k15: ka15.kills,
        a15: ka15.assists,
        d15: ka15.deaths,
        k25: ka25.kills,
        a25: ka25.assists,
        d25: ka25.deaths,
        jgmins: null,
        champid: p.championId
    };
    return performance;
}

function timestampStats(puuid, timeline, timestamps) {
    const results = {};
    const id = timeline.metadata.participants.indexOf(puuid) + 1;
    if (!id) {
        throw 'PUUID not found in match timeline';
    }
    timestamps.forEach((timestamp) => {
        results[`gd${timestamp}`] = null;
        results[`xpd${timestamp}`] = null;
        results[`csd${timestamp}`] = null;
        if (timestamp in timeline.info.frames === false) {
            results[`gold${timestamp}`] = null;
            results[`xp${timestamp}`] = null;
            results[`cs${timestamp}`] = null;
        }
        const champ = timeline.info.frames[timestamp].participantFrames[id];
        results[`gold${timestamp}`] = champ.totalGold;
        results[`xp${timestamp}`] = champ.xp;
        results[`cs${timestamp}`] =
            champ.minionsKilled + champ.jungleMinionsKilled;
    });
    return results;
}

function getKDAatTime(puuid, timeline, timestamp) {
    const results = {
        kills: 0,
        deaths: 0,
        assists: 0
    };
    const id = timeline.info.participants.find(
        (o) => o.puuid == puuid
    ).participantId;
    for (let m = 0; m <= timestamp; m++) {
        const frame = timeline.info.frames[m];
        if (!frame) {
            break;
        }
        frame.events.forEach((event) => {
            if (event.type == 'CHAMPION_KILL') {
                if (event.killerId == id) {
                    results.kills++;
                } else if (event.victimId == id) {
                    results.deaths++;
                } else if (
                    'assistingParticipantIds' in event &&
                    event.assistingParticipantIds.indexOf(id) != -1
                ) {
                    results.assists++;
                }
            }
        });
    }
    return results;
}

function getJP(puuid, jgPuuid, timeline) {
    const id = getId(puuid, timeline);
    const jid = getId(jgPuuid, timeline);
    let total = 0;
    for (let m = 3; m <= 15; m++) {
        const frame = timeline.info.frames[m];
        const pos = frame.participantFrames[id].position;
        const jgpos = frame.participantFrames[jid].position;
        if (getDistance(pos, jgpos) < 2000) {
            total++;
        }
    }
    return total;
}

function getDistance(pos1, pos2) {
    return Math.sqrt(
        Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2)
    );
}
function getId(puuid, timeline) {
    return timeline.info.participants.find((o) => o.puuid == puuid)
        .participantId;
}
function wasFBVictim(puuid, timelineData) {
    for (const frame of timelineData.info.frames) {
        for (const event of frame.events) {
            if (
                event.type == 'CHAMPION_SPECIAL_KILL' &&
                event.killType == 'KILL_FIRST_BLOOD'
            ) {
                const victimId = frame.events.find(
                    (other) =>
                        other.type == 'CHAMPION_KILL' &&
                        other.timestamp == event.timestamp
                ).victimId;
                return (
                    timelineData.metadata.participants[victimId - 1] == puuid
                );
            }
        }
    }
    return false;
}

async function getParticipants(matchId) {
    const rows = await query(
        `SELECT *
         FROM performance
         WHERE "matchId" = $1`,
        [matchId]
    ).catch((e) => console.error(e));
    if (!rows || rows.length == 0) {
        return null;
    }
    return rows;
}

module.exports = {
    addGame,
    get,
    ids,
    teams,
    getParticipants
};
