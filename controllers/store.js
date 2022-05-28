const User = require("../models/users");
const stores = require("../models/stores");
const shop = require("../models/shop");
var mongoose = require('mongoose');
const users = require("../models/users");

exports.makestore = async (req,res,next)=>{
    try{
        mongoose.Types.ObjectId.isValid(req.params.id);
        const result = await stores.findById(req.params.id)
        if(!result){
            res.json('User not Found');
            res.status = 404;
        }
        else{
            const name = req.body.name;
            const Address = req.body.Address;
            const long = req.body.long;                                 
            const latti = req.body.latti;
            const counter = req.body.counter;
            const ShopCounter = req.body.ShopCounter;
            newshop = new shop({
                name:name,
                Address:Address,
                long:long,
                latti:latti,
                counter:counter,
                ShopCounter:ShopCounter
            })
            await newshop.save();
            res.json("New Shop");
        }
    }
    catch(err){
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.adduser = async ( req,res,next)=>{
    try{
        const shopid = req.body.shopid;
        const userid = req.body.userid;
        result = await shop.findOne({_id:shopid});
        if(!result){
            res.json('no shop exist');
            console.log('no shop exist');
        }
        else{
            var mini = result.ShopCounter[0];
            console.log(mini);
            var counter = 0 , i;
            for(i = 0; i < result.counter ; i++){
                if(result.ShopCounter[i]<mini){
                    mini = result.ShopCounter[i];
                    counter = i;
                }
            }
            result.ShopCounter[counter]++;
            ans = await users.findById(userid);
            if(!ans){
                console.log('no user exist')
                return res.json("no user exist");
            }
            result.queue.push({_id:userid,counter});
            await result.save();
            res.json('user joined the queue');
        }
    }
    catch(err){
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}
exports.removeuser = async (req,res,next)=>{
    try{
        const shopid = req.body.shopid;
        const userid = req.body.userid;
        const counter = req.body.counter-1;
        result = await shop.findOne({_id:shopid});
        if(!result){
            res.json('no shop exist');
            console.log('no shop exist');
        }
        else{
            if(result.queue.length){
                for(var i = 0; i < result.queue.length; i++){
                    if(result.queue[i].counter == counter){
                        result.queue.pull({_id:result.queue[i]._id,counter:counter});
                        result.ShopCounter[counter]--;
                        await result.save();
                        break;
                    }
                }
            }
            res.json('user removed');
        }
    }
    catch(err){
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}