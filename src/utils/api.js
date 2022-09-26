const axios = require('axios').default;
require('dotenv').config();

const RIOT_NA_BASE_URL = 'https://na1.api.riotgames.com';
const RIOT_API_BASE_URL = 'https://americas.api.riotgames.com';

class RiotError extends Error {
    get name() {
        return this.constructor.name;
    }

    constructor(src) {
        if (src instanceof Error) {
            super(src.message);
            this.cause = src;
        } else {
            super(String(src));
            this.cause = undefined;
        }
    }
}

class RiotHTTPError extends RiotError {
    constructor(request, response) {
        super('Riot API HTTP Error');
        this.request = request;
        this.response = response;
    }
}

class RiotHTTPClient {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.config = {
            headers: {
                'X-Riot-Token': this.apiKey
            }
        };
    }

    async get(path) {
        return this.handleRequest(
            axios.get(this.route(path, true), { ...this.config })
        );
    }

    async getNA(path) {
        return this.handleRequest(
            axios.get(this.route(path, false), { ...this.config })
        );
    }

    async post(path, data, params) {
        return this.handleRequest(
            axios.post(this.route(path, true), data, { params, ...this.config })
        );
    }

    route(path, americas) {
        let result = null;
        if (americas) {
            result = new URL(RIOT_API_BASE_URL);
        } else {
            result = new URL(RIOT_NA_BASE_URL);
        }

        // Safer to use path as the validated 'setter', so that the path is not
        // directly to the base URL. That could lead to injection to change
        // the host, port, path, and query params, of the URL.
        result.pathname = path;

        return result.toString();
    }

    async handleRequest(request) {
        try {
            const response = await request;
            if (response.status >= 400) {
                throw new RiotHTTPError(request, response);
            }

            return response;
        } catch (err) {
            if (err instanceof RiotError) {
                throw err;
            }

            throw new RiotError(err);
        }
    }
}

class RiotClient {
    constructor(apiKey, providerId, tournamentId) {
        apiKey ??= process.env.RIOTAPI;
        providerId ??= process.env.PROVIDERID;
        tournamentId ??= process.env.TOURNAMENTID;

        if (!apiKey) {
            throw new TypeError('"apiKey" could not be resolved');
        } else if (!providerId) {
            throw new TypeError('"providerId" could not be resolved');
        } else if (!tournamentId) {
            throw new TypeError('"tournamentId" could not be resolved');
        }

        this.httpClient = new RiotHTTPClient(apiKey);
        this.providerId = providerId;
        this.tournamentId = tournamentId;
    }

    async getSummonerNameFromId(puuids) {
        if (!Array.isArray(puuids)) {
            return this.httpClient
                .getNA(`/lol/summoner/v4/summoners/by-puuid/${puuids}`)
                .catch(() => {
                    console.log(`Could not find ${puuids}`);
                    return null;
                })
                .then((res) => {
                    if (!res) {
                        return null;
                    }
                    return res.data.name;
                });
        }

        return Promise.all(
            puuids.map((puuid) =>
                this.httpClient
                    .getNA(`/lol/summoner/v4/summoners/by-puuid/${puuid}`)
                    .catch(() => {
                        console.log(`Could not find ${puuid}`);
                        return null;
                    })
            )
        ).then((responses) => {
            return responses.map((res) => {
                if (!res) {
                    return null;
                }
                return res.data.name;
            });
        });
    }

    async getSummonerFromPUUID(puuids) {
        if (!Array.isArray(puuids)) {
            return this.httpClient
                .getNA(`/lol/summoner/v4/summoners/by-puuid/${puuids}`)
                .catch(() => {
                    console.log(`Could not find ${puuids}`);
                    return null;
                })
                .then((res) => {
                    if (!res) {
                        return null;
                    }
                    return res.data;
                });
        }

        return Promise.all(
            puuids.map((puuid) =>
                this.httpClient
                    .getNA(`/lol/summoner/v4/summoners/by-puuid/${puuid}`)
                    .catch(() => {
                        console.log(`Could not find ${puuid}`);
                        return null;
                    })
            )
        ).then((responses) => {
            return responses.map((res) => {
                if (!res) {
                    return null;
                }
                return res.data;
            });
        });
    }

    async getLeagueFromId(summonerId) {
        return this.httpClient
            .getNA(`/lol/league/v4/entries/by-summoner/${summonerId}`)
            .catch((e) => {
                console.log(`Could not find ${summonerId}: ${e}`);
                return null;
            })
            .then((res) => {
                if (!res) {
                    return null;
                }
                return res.data;
            });
    }

    async getIdFromSummonerName(names) {
        if (!Array.isArray(names)) {
            return this.httpClient
                .getNA(`/lol/summoner/v4/summoners/by-name/${names}`)
                .catch(() => {
                    console.log(`Could not find ${names}`);
                    return null;
                })
                .then((res) => {
                    if (!res) {
                        return null;
                    }
                    return res.data.puuid;
                });
        }

        return Promise.all(
            names.map((name) =>
                this.httpClient
                    .getNA(`/lol/summoner/v4/summoners/by-name/${name}`)
                    .catch(() => {
                        console.log(`Could not find ${name}`);
                        return null;
                    })
            )
        ).then((responses) => {
            return responses.map((res) => {
                if (!res) {
                    return null;
                }
                return res.data.puuid;
            });
        });
    }

    async getMatchData(matchId) {
        const response = await this.httpClient.get(
            `/lol/match/v5/matches/${matchId}`
        );

        return response.data;
    }

    async getMatchTimeline(matchId) {
        const response = await this.httpClient.get(
            `/lol/match/v5/matches/${matchId}/timeline`
        );

        return response.data;
    }

    async createCodes(count, metadata) {
        const data = {
            mapType: 'SUMMONERS_RIFT',
            metadata: metadata,
            pickType: 'TOURNAMENT_DRAFT',
            spectatorType: 'ALL',
            teamSize: 5
        };

        const params = {
            count: count,
            tournamentId: this.tournamentId
        };

        const response = await this.httpClient.post(
            '/lol/tournament/v4/codes',
            data,
            params
        );

        return response.data;
    }

    async createNewProvider(callbackUrl) {
        const data = {
            region: 'NA',
            url: callbackUrl
        };

        const response = await this.httpClient.post(
            '/lol/tournament/v4/providers',
            data
        );

        return response.data;
    }

    async createNewTournament(name) {
        const data = {
            name: name,
            providerId: this.providerId
        };

        const response = await this.httpClient.post(
            '/lol/tournament/v4/tournaments',
            data
        );

        return response.data;
    }
}

module.exports = {
    RiotError,
    RiotClient,
    RiotHTTPError
};
