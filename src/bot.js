require('dotenv').config();
const { Client, Intents } = require('discord.js');
const startWebserver = require('./webserver/index.js');
const listener = require('./webserver/listener.js');
const loadCommands = require('./utils/commandloader.js');
const loadListeners = require('./utils/listenerloader.js');
const loadWebhook = require('./utils/webhookloader.js');

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.GUILD_WEBHOOKS,
        Intents.FLAGS.GUILD_INTEGRATIONS
    ]
});

startWebserver(client, process.env.PORT, listener);

loadCommands(client, './commands');

loadListeners(client, './listeners');

loadWebhook(client, process.env.WEBHOOK_URL, process.env.WEBHOOK_NAME);

console.log('Logging in...');
client.login(process.env.TOKEN);
console.log('Logged in.');
