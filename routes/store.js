const express = require("express");
const router = express.Router();


const storeController = require("../controllers/store");


router.post('/makestore/:id',storeController.makestore);
router.post('/adduser',storeController.adduser);
router.post('/removeuser',storeController.removeuser);
router.post('/nearby',storeController.nearby);
router.get("/details/:id",storeController.details);

module.exports=router; 