const express = require('express');
const path = require('path');
const matchdata = require('../database/matchdata');
const teams = require('../database/teams');
const cfg = require('../cfg/config.json');
const performance = require('../database/performance');

module.exports = async (client, port, listener) => {
    console.log('Initializing API...');
    const app = express();
    app.use(express.json());
    app.use(express.static(__dirname + '/static'));

    app.post('/', function (req, res) {
        try {
            listener(client, req.body);
            res.sendStatus(200);
        } catch (e) {
            res.sendStatus(400);
            console.log(e);
        }
    });

    app.get('/', function (req, res) {
        res.send('Welcome to CCS Stats');
    });

    app.get('/m/:matchId', async function (req, res) {
        const matchData = await matchdata.get(req.params.matchId);
        res.json(matchData);
    });

    app.get('/match/*', async function (req, res) {
        res.sendFile(__dirname + '/static/matchviewer.html');
    });

    // app.get('/data', async function (req, res) {
    //     res.json(await matchdata.all());
    // });

    app.get('/teams', async function (req, res) {
        res.json(await teams.getTeams());
    });

    app.get('/teams/:q', async function (req, res) {
        const teamList = await teams.getTeamList();
        const confList = cfg.seasons.map((o) => o.conf);
        if (teamList.includes(req.params.q)) {
            return res.json(await teams.getTeamFromCode(req.params.q));
        }
        if (confList.includes(req.params.q)) {
            return res.json(await teams.getTeams(req.params.q));
        }
        if (req.params.q in cfg.groups) {
            const results = [];
            for (const conf of cfg.groups[req.params.q]) {
                await teams
                    .getTeams(conf)
                    .then((teamlist) =>
                        teamlist.forEach((team) => results.push(team))
                    );
            }
            return res.json(results);
        }
        return res
            .status(400)
            .send(`"${req.params.q}" is not a valid team, conf, or group code`);
    });

    app.get('/performances', async function (req, res) {
        res.json(await performance.get());
    });

    app.get('/performances/:q', async function (req, res) {
        const confList = cfg.seasons.map((o) => o.conf);
        if (confList.includes(req.params.q)) {
            return res.json(await performance.get(req.params.q));
        }
        if (req.params.q in cfg.groups) {
            const results = [];
            for (const conf of cfg.groups[req.params.q]) {
                await performance
                    .get(conf)
                    .then((list) => list.forEach((item) => results.push(item)));
            }
            return res.json(results);
        }
        return res
            .status(400)
            .send(`"${req.params.q}" is not a valid conf, or group code`);
    });

    app.get('/teamperformances', async function (req, res) {
        res.json(await performance.teams());
    });

    app.get('/teamperformances/:q', async function (req, res) {
        const confList = cfg.seasons.map((o) => o.conf);
        if (confList.includes(req.params.q)) {
            return res.json(await performance.teams(req.params.q));
        }
        if (req.params.q in cfg.groups) {
            const results = [];
            for (const conf of cfg.groups[req.params.q]) {
                await performance
                    .teams(conf)
                    .then((list) => list.forEach((item) => results.push(item)));
            }
            return res.json(results);
        }
        return res
            .status(400)
            .send(`"${req.params.q}" is not a valid conf, or group code`);
    });

    app.get('*', function (req, res) {
        res.status(404).send('Endpoint not found');
    });

    app.use('/logos', express.static(path.join(__dirname, 'static/logos')));

    app.listen(port, () => {
        console.log(`API Online on port ${port}`);
    });
};
