const fs = require('fs');

module.exports = (client, path = './listeners') => {
    console.log('Loading listeners...');
    const listenerFiles = fs
        .readdirSync('./src' + path.substring(1))
        .filter((file) => file.endsWith('.js'));

    for (const file of listenerFiles) {
        const listener = require('.' + path + `/${file}`);
        listener(client);
        console.log(`Loaded ${file.substring(0, file.length - 3)}`);
    }
    console.log('All listeners are loaded.');
};