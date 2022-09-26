module.exports = (client) => {
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isCommand()) return;

        const command = client.commands.get(interaction.commandName);

        if (!command) return;

        try {
            await interaction.deferReply();
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction
                .followUp({
                    content: 'There was an error while executing this command.',
                    ephemeral: true
                })
                .catch(console.error);
        }
    });
};
