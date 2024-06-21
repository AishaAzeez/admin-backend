require('dotenv').config();
const express = require('express');
const cors = require('cors');
const router = require('./Routes/router');
const attendancedetails = require('./Models/attendanceModel');
const totaldaysWorked = require('./Models/totaldaysModel')
require('./DB/connection');
const atteServer = express();

atteServer.use(cors());
atteServer.use(express.json());
atteServer.use(router);
const PORT = 3000;

atteServer.listen(PORT, () => {
    console.log('Server started on port', PORT);
});

atteServer.get('/', (req, res) => {
    res.send("Server is running and waiting for client requests");
});

atteServer.get('/getattendanceModel', (req, res) => {
    attendancedetails.find()
        .then(attendanceModel => res.json(attendanceModel))
        .catch(err => {
            console.error('Error fetching attendance model:', err);
            res.status(500).json({ error: 'Failed to fetch attendance model' });
        });
});

atteServer.get('/gettotaldaysModel', (req, res) => {
    totaldaysWorked.find()
     .then(totaldaysModel => res.json(totaldaysModel))
     .catch(err=> res.json(err))    
})

