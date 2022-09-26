const fs = require('fs');
const { Collection } = require('discord.js');

module.exports = (client, path = './commands') => {
    console.log('Loading commands...');
    client.commands = new Collection();
    const commandFiles = fs
        .readdirSync('./src' + path.substring(1))
        .filter((file) => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require('.' + path + `/${file}`);
        client.commands.set(command.data.name, command);
        console.log(`Loaded ${command.data.name}`);
    }
    console.log('All commands are loaded.');
};
