const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const dotenv = require("dotenv");
const otpGenerator = require("otp-generator");
const jwt = require("jsonwebtoken");

dotenv.config();

const User = require("../models/users");
const Store = require("../models/stores");
const Otp = require("../models/otp");
const mail = require("../utils/sendemail");
const Token = require("../models/token");
const { use } = require("passport");

var emailregex = /^[-!#$%&'*+\/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/
exports.otp = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ Error: "Validation Failed" });
    }

    const { email } = req.body;

    var validemail = emailregex.test(email);

    if (!validemail) {
      const error = new Error('Please enter a valid email');
      error.statusCode = 422;
      throw error;
    }

    const user = await User.findOne({ email: email });
    if (user) {
      const error = new Error("User already exists !!");
      error.statusCode = 400;
      throw error;
    }

    const otp = otpGenerator.generate(4, {
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false
    });

    const result = await Otp.findOne({ email: email });
    if (result === null) {
      const newOtp = new Otp({ email: email, otp: otp });
      await newOtp.save();
    }
    else
      await Otp.updateOne({ email: email }, { $set: { otp: otp } });
    mail.sendEmail(email, otp);
    return res.status(201).json({ message: 'Otp sent' });
  }
  catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
}
exports.details = async (req,res , next)=>{
  try{
    const {email , password , fullname  , mobileno , gender , role } = req.body;
    const IsUser = await User.find({email:email});
    const IsStore = await Store.find({email:email});
    console.log(IsStore);
    console.log(IsUser);
    if(role){
      if(IsUser.length) return res.status(301).json("already exist")
    } 
    else{
      if(IsStore.length) return res.status(301).json("already exist")
    }
    const hashedPassword = await bcrypt.hash(password, 12);
      let newUser;
      if (role == false)
      {
          newUser = new Store({
              email: email,
              password: hashedPassword,
              fullname:fullname,
              mobileno:mobileno,
              gender:gender
            })
            await newUser.save();
    }
    else
    {
      newUser = new User({
        email: email,
        password: hashedPassword,
        fullname:fullname,
        mobileno:mobileno,
        gender:gender
    });
  }
    await newUser.save();
    return res.status(201).json(newUser);
  }
  catch(err){
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
}
exports.otpVerification = async (req, res, next) => {
  try {
    const { email, otp, password, confirmPass} = req.body;
    const userInDb = await User.findOne({email:email });
    const storeInDb = await Store.findOne({ email:email });
    console.log(email)

    if (userInDb||storeInDb)
      return res.status(401).send('Already registered.');

    const newotp = await Otp.findOne({ email: email });
    if (!newotp) {
      const err = new Error('Otp is expired');
      err.statusCode = 422;
      throw err;
    }
    if (newotp.otp !== otp) {
      const err = new Error("Wrong Otp");
      err.statusCode = 420;
      throw err;
    }

      
  // }
  //   const accesstoken = jwt.sign({ email: email, userId: newUser._id }, process.env.ACCESS_TOKEN_KEY, { expiresIn: '1h' });
  //   const refreshtoken = jwt.sign({ email: email, userId: newUser._id }, process.env.REFRESH_TOKEN_KEY, { expiresIn: "30d" });
  //   const token = new Token({
  //     email: email,
  //     token: refreshtoken
  //   })
  //   await token.save();
  //   return res.status(200).json({ message: "successfully registered", access_token: accesstoken, refresh_token: refreshtoken });
  await newotp.remove();
  return res.status(200).json('otp verified');
}
  catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
}

exports.login = async (req, res, next) => {
  try {
    const { email, password,isStore } = req.body;
    let user;
    if(isStore){
      user = await User.findOne({ email: email });

      if (!user) {
        const error = new Error("User is not registered !!");
        error.statusCode = 400;
        throw error;
      }
      const result = await bcrypt.compare(password, user.password);
      if (!result) {
        const error = new Error('Incorrect Password');
        error.statusCode = 403;
        throw error;
      }
      return res.status(201).json(user);
    }
    else{
      user = await Store.findOne({ email: email });

      if (!user) {
        const error = new Error("Store is not registered !!");
        error.statusCode = 400;
        throw error;
      }
      const result = await bcrypt.compare(password, user.password);
      if (!result) {
        const error = new Error('Incorrect Password');
        error.statusCode = 403;
        throw error;
      }
      return res.status(201).json(user);
    }

  }
  catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
}

exports.generateAccessToken = async (req, res, next) => {
  try {
    const { refreshtoken } = req.body;
    if (!refreshtoken) {
      const err = new Error('token missing');
      err.statusCode = 401;
      throw err;
    }
    const tokenInDb = await Token.findOne({ token: refreshtoken });
    if (!tokenInDb) {
      const error = new Error('login again');
      error.statusCode = 402;
      throw error;
    }
    const payload = jwt.verify(tokenInDb.token, process.env.REFRESH_TOKEN_KEY);
    const accessToken = jwt.sign({ id: payload._id, email: payload.email }, process.env.ACCESS_TOKEN_KEY, { expiresIn: "1h" });
    return res.status(200).json({ access_token: accessToken });
  }
  catch (err) {
    if (!err.statusCode)
      err.statusCode = 500;
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const tokenInDb = await Token.findOne({ token: refreshToken });

    if (tokenInDb) {
      await tokenInDb.remove();
      return res.status(200).json({ message: 'logged out' });
    }
    else {
      const err = new Error('error logging out');
      err.statusCode = 400;
      throw err;
    }
  }
  catch (err) {
    if (!err.statusCode)
      err.statusCode = 500;
    next(err);
  }
};