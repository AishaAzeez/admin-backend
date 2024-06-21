const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    email: {
        type: String,
    },
    userId: {
        type: String,
    },
    totalTimeSpent: {
        type: String,
    },
    loginDate: {
        type: String,
    },
    lastLoginedTime: {
        type: Date,
    },
    totalDays: {
        type: Number,
    }
    
});

const attendancedetails = mongoose.model("attendancedetails", attendanceSchema);

module.exports = attendancedetails;
