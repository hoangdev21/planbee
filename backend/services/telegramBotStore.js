let botInstance = null;

module.exports = {
    setBot: (bot) => { botInstance = bot; },
    getBot: () => botInstance
};
