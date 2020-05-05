var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var messageSchema = new Schema({
    name: String, 
    msg: String,
    created: {type: Date, default: Date.now}
});
module.exports = mongoose.model('Message', messageSchema);