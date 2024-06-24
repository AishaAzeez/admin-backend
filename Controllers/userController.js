const mongoose = require('mongoose');
const userdetails = require('../Models/userModel');
const attendancedetails = require('../Models/attendanceModel');
const admindetails = require('../Models/adminModel')


const register = async (req, res) => {
    const { email, region, shift, password } = req.body;

    try {
        const existingUser = await userdetails.findOne({ email: email });
        if (existingUser) {
            return res.status(406).json({ message: "User already exists" });
        }

        const newUser = new userdetails({ email, password, region, shift });
        await newUser.save();

        return res.status(200).json({ message: "User created" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};


const adminlogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await admindetails.findOne({ email: email, password: password });
        if (!admin) {
            return res.status(406).json({ message: "Invalid Email Id or Password" });
        }

        return res.status(200).json({ message: "Admin Logged in Successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const existingUser = await userdetails.findOne({ email: email, password: password });
        if (!existingUser) {
            return res.status(406).json({ message: "Invalid Email Id or Password" });
        }

        const currentDate = new Date();
        const day = String(currentDate.getDate()).padStart(2, '0');
        const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // getMonth() returns 0-based month
        const year = currentDate.getFullYear();
        const currentLoginDate = `${day} ${month} ${year}`;
        console.log(currentLoginDate);
                const existingAttendance = await attendancedetails.findOne({ email: email, loginDate: currentLoginDate });

        let attendanceId;
        if (!existingAttendance) {
            const newAttendance = new attendancedetails({ email: email, loginDate: currentLoginDate, lastLoginedTime: new Date(), totalDays: 0 });
            const savedAttendance = await newAttendance.save();
            attendanceId = savedAttendance._id;
        } else {
            await attendancedetails.updateOne({ _id: existingAttendance._id }, { $set: { lastLoginedTime: new Date() } });
            attendanceId = existingAttendance._id;
        }

        return res.status(200).json({ message: "User Logined Successfully", attendanceId });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};


const logouti = async (req, res) => {
    const { attendanceId, totalTimeSpent } = req.body;

    console.log(`Received logout request for attendanceId: ${attendanceId} with totalTimeSpent: ${totalTimeSpent}`);

    try {
        const TodaysAttendance = await attendancedetails.findOne({ _id: attendanceId });
        if (!TodaysAttendance) {
            console.log('Attendance record not found');
            return res.status(404).json({ message: "Attendance record not found" });
        }

        // Calculate the new total time spent
        const previousTotalTimeSpent = TodaysAttendance.totalTimeSpent ? parseTimeString(TodaysAttendance.totalTimeSpent) : 0;
        const newTimeSpent = parseTimeString(totalTimeSpent);
        const updatedTotalTimeSpent = previousTotalTimeSpent + newTimeSpent;

        // Calculate totalDays based on totalTimeSpent
        const totalDays = updatedTotalTimeSpent > 60 ? 1 : 0;

        await attendancedetails.updateOne(
            { _id: attendanceId },
            { $set: { totalTimeSpent: formatTime(updatedTotalTimeSpent), lastLoginedTime: new Date(), totalDays: totalDays } }
        );

        // const result = await markAttendance(TodaysAttendance.email, updatedTotalTimeSpent);

        console.log('Update result:', result);

        return res.status(200).json({ message: `Data has been received in the backend. You worked ${formatTime(updatedTotalTimeSpent)} today`, totalDays: totalDays });
    } catch (error) {
        console.error('Error updating attendance:', error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const deleteUsers = async (req, res) => {
    const { ids } = req.body;

    try {
        console.log(`Delete request received for user IDs: ${ids}`); // Log message for received delete request
        res.status(200).json({ message: "Delete request received. Processing..." });

        await userdetails.deleteMany({ _id: { $in: ids } });
        await attendancedetails.deleteMany({ email: { $in: ids } });

        // console.log(`Users with IDs: ${ids} have been deleted successfully.`); // Log message for successful deletion
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
};





// Helper function to parse time string (HH:MM:SS) to seconds
function parseTimeString(timeString) {
    const parts = timeString.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2], 10);
    return (hours * 3600) + (minutes * 60) + seconds;
}

// Helper function to format time in seconds to HH:MM:SS
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}


module.exports = { register, login, logouti ,adminlogin, deleteUsers};
