const { WebhookClient } = require('discord.js');

module.exports = (client, url, name) => {
    console.log(`Loading webhook ${name}`);
    client.webhook = new WebhookClient({ url: url });
    console.log('Loaded webhook.');
};
