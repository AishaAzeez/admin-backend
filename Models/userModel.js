

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    region: {
        type: String
    },
    shift: {
        type: String
    },
    password:{
        type: String
    },
    createdDate: {
        type: Date,
        default: Date.now 
    }
    
});

const userdetails = mongoose.model("userdetails", userSchema);








module.exports = userdetails;
