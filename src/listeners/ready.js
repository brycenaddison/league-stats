module.exports = (client) => {
    client.once('ready', () => {
        client.user.setActivity('CCS | /help', { type: 'WATCHING' });
        console.log(`ccs-bot version ${process.env.npm_package_version} loaded`);
    });
};
