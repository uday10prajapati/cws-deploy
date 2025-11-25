const express = require("express");
const router = express.Router();
const { updateLocation, getAssignedJobs } = require("../controllers/riderController");
const auth = require("../middleware/authMiddleware");

router.post("/location", auth, updateLocation);
router.get("/jobs", auth, getAssignedJobs);

module.exports = router;
