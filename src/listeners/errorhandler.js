module.exports = (client) => {
    client.on('shardError', (error) => {
        console.error('A websocket connection encountered an error:', error);
    });

    process.on('unhandledRejection', (error) => {
        console.error('Unhandled promise rejection:', error);
    });

    client.on('error', console.warn);

    process.on('SIGINT', () => {
        console.log('Closing ccs-bot...');
        client.destroy();
        process.exit();
    });
};
