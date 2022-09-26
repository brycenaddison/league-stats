require('dotenv').config();
const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const commands = [];
const commandFiles = fs
    .readdirSync('./src/commands')
    .filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`../commands/${file}`);
    if ('data' in command) {
        commands.push(command.data.toJSON());
    }
}

if (!process.env.TOKEN) {
    throw 'TOKEN is undefined in .env';
}
if (!process.env.CLIENT_ID) {
    throw 'CLIENT_ID is undefined in .env';
}
if (!process.env.GUILD_ID) {
    throw 'GUILD_ID is undefined in .env';
}

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

if (process.argv.length > 1 && process.argv[2] === '-g') {
    rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
        body: commands
    })
        .then(() =>
            console.log(
                'Successfully registered application commands GLOBALLY.'
            )
        )
        .catch(console.error);
} else {
    rest.put(
        Routes.applicationGuildCommands(
            process.env.CLIENT_ID,
            process.env.GUILD_ID
        ),
        { body: commands }
    )
        .then(() =>
            console.log('Successfully registered application commands.')
        )
        .catch(console.error);
}
