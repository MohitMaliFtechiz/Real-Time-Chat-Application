var moment = require('moment');

var createMessage = (from, room, text) => {
    return {
        from,
        room,
        text,
        createdDate: moment().valueOf()
    }
};

module.exports = {createMessage};