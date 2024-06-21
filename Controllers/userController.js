const mongoose = require('mongoose');
const userdetails = require('../Models/userModel');
const attendancedetails = require('../Models/attendanceModel');
const admindetails = require('../Models/adminModel');
const totaldaysWorked = require('../Models/totaldaysModel');

const formattedTodaysDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; 
    const day = today.getDate();
    return `${day < 10 ? '0' : ''}${day}-${month < 10 ? '0' : ''}${month}-${year}`;
};

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
        const admin = await admindetails.findOne({ email, password });
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

        const currentLoginDate = formattedTodaysDate();
        const existingAttendance = await attendancedetails.findOne({ email: email, loginDate: currentLoginDate });

        let attendanceId;
        if (!existingAttendance) {
            const newAttendance = new attendancedetails({ email: email, loginDate: currentLoginDate, totalDays: 0 });
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
            { $set: { totalTimeSpent: formatTime(updatedTotalTimeSpent), totalDays: totalDays } }
        );

        console.log('Attendance updated');

        // Call getTotalDaysWorked to update the daysworked field in totaldaysWorked
        await getTotalDaysWorked({ body: { email: TodaysAttendance.email } }, res);

        return res.status(200).json({ message: `Data has been received in the backend. You worked ${formatTime(updatedTotalTimeSpent)} today`, totalDays: totalDays });
    } catch (error) {
        console.error('Error updating attendance:', error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const getTotalDaysWorked = async (req, res) => {
    const { email } = req.body;

    try {
        // Fetch all attendance records for the user
        const attendanceRecords = await attendancedetails.find({ email: email });

        // Get today's date in DD-MM-YYYY format
        const today = formattedTodaysDate();

        // Find the totaldaysWorked document for the user
        let existingTotalDaysRecord = await totaldaysWorked.findOne({ email: email });

        // Initialize totalDaysToday to 0
        let totalDaysToday = 0;

        // Check if the user has already been counted for today
        let alreadyCountedToday = false;

        if (existingTotalDaysRecord) {
            // Check if there is a record for today
            alreadyCountedToday = existingTotalDaysRecord.lastUpdated === today;
        }

        // If not already counted today, check today's attendance records
        if (!alreadyCountedToday) {
            attendanceRecords.forEach(record => {
                if (record.loginDate === today && record.totalDays === 1) {
                    totalDaysToday = 1;
                }
            });

            if (totalDaysToday === 1) {
                if (existingTotalDaysRecord) {
                    // Update the existing record
                    existingTotalDaysRecord.daysworked += totalDaysToday;
                    existingTotalDaysRecord.lastUpdated = today; // Add or update this field to track the last update date
                    await existingTotalDaysRecord.save();
                } else {
                    // Create a new record if it doesn't exist
                    const newTotalDaysRecord = new totaldaysWorked({ email: email, daysworked: totalDaysToday, lastUpdated: today });
                    await newTotalDaysRecord.save();
                }
            }
        }

        return res.status(200).json({ message: "Total days worked updated successfully", daysworked: existingTotalDaysRecord ? existingTotalDaysRecord.daysworked : totalDaysToday });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
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

module.exports = { register, login, logouti, adminlogin, getTotalDaysWorked };











// const mongoose = require('mongoose');
// const userdetails = require('../Models/userModel');
// const attendancedetails = require('../Models/attendanceModel');
// const admindetails = require('../Models/adminModel');
// const totaldaysWorked = require('../Models/totaldaysModel');

// function formattedTodaysDate() {
//     const today = new Date();
//     const year = today.getFullYear();
//     const month = today.getMonth() + 1; 
//     const day = today.getDate();
//     return `${day < 10 ? '0' : ''}${day}-${month < 10 ? '0' : ''}${month}-${year}`;
// }

// const register = async (req, res) => {
//     const { email, region, shift, password } = req.body;

//     try {
//         const existingUser = await userdetails.findOne({ email: email });
//         if (existingUser) {
//             return res.status(406).json({ message: "User already exists" });
//         }

//         const newUser = new userdetails({ email, password, region, shift });
//         await newUser.save();

//         return res.status(200).json({ message: "User created" });
//     } catch (err) {
//         console.error(err);
//         return res.status(500).json({ message: "Internal server error" });
//     }
// };

// const adminlogin = async (req, res) => {
//     const { email, password } = req.body;
  
//     try {
//         const admin = await admindetails.findOne({ email, password });
//         if (!admin) {
//             return res.status(406).json({ message: "Invalid Email Id or Password" });
//         }
//         return res.status(200).json({ message: "Admin Logged in Successfully" });
//     } catch (err) {
//         console.error(err);
//         return res.status(500).json({ message: "Internal server error" });
//     }
// };

// const login = async (req, res) => {
//     const { email, password } = req.body;

//     try {
//         const existingUser = await userdetails.findOne({ email: email, password: password });
//         if (!existingUser) {
//             return res.status(406).json({ message: "Invalid Email Id or Password" });
//         }

//         const currentLoginDate = formattedTodaysDate();
//         const existingAttendance = await attendancedetails.findOne({ email: email, loginDate: currentLoginDate });

//         let attendanceId;
//         if (!existingAttendance) {
//             const newAttendance = new attendancedetails({ email: email, loginDate: currentLoginDate, lastLoginedTime: new Date(), totalDays: 0 });
//             const savedAttendance = await newAttendance.save();
//             attendanceId = savedAttendance._id;
//         } else {
//             await attendancedetails.updateOne({ _id: existingAttendance._id }, { $set: { lastLoginedTime: new Date() } });
//             attendanceId = existingAttendance._id;
//         }

//         return res.status(200).json({ message: "User Logined Successfully", attendanceId });
//     } catch (err) {
//         console.error(err);
//         return res.status(500).json({ message: "Internal server error" });
//     }
// };

// const logouti = async (req, res) => {
//     const { attendanceId, totalTimeSpent } = req.body;

//     console.log(`Received logout request for attendanceId: ${attendanceId} with totalTimeSpent: ${totalTimeSpent}`);

//     try {
//         const TodaysAttendance = await attendancedetails.findOne({ _id: attendanceId });
//         if (!TodaysAttendance) {
//             console.log('Attendance record not found');
//             return res.status(404).json({ message: "Attendance record not found" });
//         }

//         // Calculate the new total time spent
//         const previousTotalTimeSpent = TodaysAttendance.totalTimeSpent ? parseTimeString(TodaysAttendance.totalTimeSpent) : 0;
//         const newTimeSpent = parseTimeString(totalTimeSpent);
//         const updatedTotalTimeSpent = previousTotalTimeSpent + newTimeSpent;

//         // Calculate totalDays based on totalTimeSpent
//         const totalDays = updatedTotalTimeSpent > 60 ? 1 : 0;

//         await attendancedetails.updateOne(
//             { _id: attendanceId },
//             { $set: { totalTimeSpent: formatTime(updatedTotalTimeSpent), lastLoginedTime: new Date(), totalDays: totalDays } }
//         );

//         if (totalDays === 1) {
//             await getTotalDaysWorked(TodaysAttendance.email);
//         }

//         return res.status(200).json({ message: `Data has been received in the backend. You worked ${formatTime(updatedTotalTimeSpent)} today`, totalDays: totalDays });
//     } catch (error) {
//         console.error('Error updating attendance:', error);
//         return res.status(500).json({ message: "Internal Server Error" });
//     }
// };

// const totaldaysWork = async (email) => {
//     try {
//         const userTotalDays = await totaldaysWorked.findOne({ email });

//         if (userTotalDays) {
//             // User already has a record, update the totaldaysWorked field
//             await totaldaysWorked.updateOne(
//                 { email },
//                 { $inc: { totaldaysWorked: 1 } }
//             );
//         } else {
//             // User does not have a record, create a new entry
//             const newTotalDays = new totaldaysWork({ email, totaldaysWork: 1 });
//             await newTotalDays.save();
//         }

//     } catch (error) {
//         console.error('Error updating totaldaysWorked:', error);
//     }
// };

// // Helper function to parse time string (HH:MM:SS) to seconds
// function parseTimeString(timeString) {
//     const parts = timeString.split(':');
//     const hours = parseInt(parts[0], 10);
//     const minutes = parseInt(parts[1], 10);
//     const seconds = parseInt(parts[2], 10);
//     return (hours * 3600) + (minutes * 60) + seconds;
// }

// // Helper function to format time in seconds to HH:MM:SS
// function formatTime(seconds) {
//     const hours = Math.floor(seconds / 3600);
//     const minutes = Math.floor((seconds % 3600) / 60);
//     const secs = seconds % 60;
//     return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
// }

// module.exports = { register, login, logouti, adminlogin ,totaldaysWork};
