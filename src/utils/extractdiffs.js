module.exports = {
    extractDiffs(match, timeline, timestamps) {
        // Return completed diffs (prone to error due to incorrect positions,
        // fix at some point)
        const summoners = {};
        const roles = {
            TOP: [],
            JUNGLE: [],
            MIDDLE: [],
            BOTTOM: [],
            UTILITY: []
        };
        match.info.participants.forEach((participant) => {
            summoners[participant.participantId] = {
                puuid: participant.puuid
            };
            // another weird catchall
            try {
                roles[participant.teamPosition].push(participant.participantId);
            } catch {
                console.log(participant);
            }
        });
        timestamps.forEach((timestamp) => {
            if (timestamp in timeline.info.frames === false) {
                return;
            }
            for (const [id, champ] of Object.entries(
                timeline.info.frames[timestamp].participantFrames
            )) {
                summoners[id][timestamp] = {
                    gold: champ.totalGold,
                    xp: champ.xp,
                    cs: champ.minionsKilled + champ.jungleMinionsKilled
                };
            }
        });
        const p = {};
        // catch all bad here but I'm too lazy to fix
        try {
            for (const ids of Object.values(roles)) {
                const p1 = {};
                const p2 = {};
                timestamps.forEach((timestamp) => {
                    if (timestamp in summoners[ids[0]] === false) {
                        p1[`gd${timestamp}`] = 'N/A';
                        p2[`gd${timestamp}`] = 'N/A';
                        p1[`xpd${timestamp}`] = 'N/A';
                        p2[`xpd${timestamp}`] = 'N/A';
                        p1[`csd${timestamp}`] = 'N/A';
                        p2[`csd${timestamp}`] = 'N/A';
                    } else {
                        const d1 = summoners[ids[0]][timestamp];
                        const d2 = summoners[ids[1]][timestamp];
                        p1[`gd${timestamp}`] = d1.gold - d2.gold;
                        p2[`gd${timestamp}`] = d2.gold - d1.gold;
                        p1[`xpd${timestamp}`] = d1.xp - d2.xp;
                        p2[`xpd${timestamp}`] = d2.xp - d1.xp;
                        p1[`csd${timestamp}`] = d1.cs - d2.cs;
                        p2[`csd${timestamp}`] = d2.cs - d1.cs;
                    }
                });
                p[summoners[ids[0]].puuid] = p1;
                p[summoners[ids[1]].puuid] = p2;
            }
        } catch (e) {
            match.info.participants.forEach((participant) => {
                const px = {};
                timestamps.forEach((timestamp) => {
                    px[`gd${timestamp}`] = 'MANUAL';
                    px[`xpd${timestamp}`] = 'MANUAL';
                    px[`csd${timestamp}`] = 'MANUAL';
                });
                p[participant.puuid] = px;
            });
        }
        return p;
    }
};
