const mongoose = require('mongoose')
 const connectionString = process.env.CONNECTION_STRING
mongoose.connect(connectionString).then(()=>{
    console.log("Connected successfully");
}).catch((reason)=>{
    console.log(reason);
    console.log("Connection failed");
})         