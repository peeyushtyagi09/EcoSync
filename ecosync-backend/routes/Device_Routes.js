const express = require("express");
const router = express.Router();
const {
    registerDevice,
    getDevices,
    updatesDevicesStatus,
    getDeviceById,
} = require("../controllers/Devices_controller");

router.post("/register", registerDevice);
router.get("/", getDevices);
router.get("/:id", getDeviceById);
router.post("/updateStatus/:id", updatesDevicesStatus);

module.exports = router;