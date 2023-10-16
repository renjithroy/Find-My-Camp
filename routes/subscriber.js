const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");

const subscriber = require("../controllers/subscriber");

router.route("/subscribe")
    .post(subscriber.submitSubscriber)

module.exports = router;