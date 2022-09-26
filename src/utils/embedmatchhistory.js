require('dotenv').config();

module.exports = (matchId, conf, week, winner, loser, game) => {
    let title = `Match ${matchId}`;
    const dict = {
        wed: 'Wednesday Platinum',
        thu: 'Thursday Platinum',
        fri: 'Diamond'
    };
    if (winner && loser) {
        title = `${winner} vs. ${loser}`;
    }
    if (conf) {
        title += ' ' + dict[conf];
    }
    if (week) {
        title += ' Week ' + week;
    }
    if (game) {
        title += ' Game ' + game;
    }
    const link = `${process.env.BASE_URL}/match/${matchId}`;
    return {
        title: title,
        url: link
    };
};
