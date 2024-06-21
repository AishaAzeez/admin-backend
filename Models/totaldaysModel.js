const mongoose = require('mongoose');

const totaldaysSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    daysworked: {
        type: Number,
    }
});


const totaldaysWorked = mongoose.model("totaldaysWorked", totaldaysSchema);

module.exports = totaldaysWorked;
