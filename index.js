const express = require("express");
const mongoose = require("mongoose"); 
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth");
const storeroutes = require('./routes/store');


dotenv.config();
const app = express();

app.use(express.json());

app.use(express.urlencoded({extended:true}));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods","GET, POST, PUT, PATCH, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  next();
});



app.get("/",(req,res)=>{res.send('hello')})

app.use("/auth",authRoutes);
app.use("/store",storeroutes);


app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});


mongoose
  .connect(
    process.env.CONNECT_TO_DB
  )
  .then(result => {
    app.listen(process.env.PORT);
    console.log("connected");
  })
  .catch(err => console.log("error",err));
  