const router = require("express").Router();
const controller = require("../controllers/meetingController");

router.post("/join-or-create", controller.joinOrCreateMeeting);

module.exports = router;
