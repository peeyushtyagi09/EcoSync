const Device = require("../models/Device");

// Standard response helper
const sendResponse = (res, status, success, message, data = null) => {
    res.status(status).json({ success, message, data });
}

// Register a new device
exports.registerDevice = async (req, res) => {
    try {
        const {
            deviceId,
            name,
            ipAddress,
            osType,
            osVersion,
            cpu,
            ram,
            disk, 
            owner,
        } = req.body;

        if(!deviceId || !name || !ipAddress)
            return sendResponse(res, 400, false, "Missing required fields")

        let device = await Device.findOne({ deviceId });
        if (device) {
            device.lastActiveAt = new Date();
            device.status = "online";
            await device.save();
            return res.status(200).json({ message: "Device reconnected", device });
        }
        const newDevice = new Device({
            deviceId,
            name, 
            ipAddress, 
            osType, 
            osVersion, 
            cpu,
            ram,
            disk,
            owner,
            status: "online",
        });
        await newDevice.save();
        res.status(201).json({message: "Device registered successfully", newDevice});
    }catch (error){
        console.error("Register Device Error:", error);
        res.status(500).json({ error: "Failed to register device", details: error.message});
    }
}
// Get all registered devices (With pagination)
exports.getDevices = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const devices = await Device.find()
            .sort({ registeredAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

            sendResponse(res, 200, true, "Devices fetched successfully", devices);
    }catch (error) {
        console.error("Get Devices Error:", error);
        sendResponse(res, 500, false, 'Failed to fetch devices', error.message);
    }
};

exports.updatesDevicesStatus = async (req, res) => {
    try{
        const { id } = req.params;
        const { status } = req.body;

        if(!["online", "offline", "inactive"].includes(status))
            return sendResponse(req, 400, false, "Invaid status value");
        const device = await Device.findByIdAndUpdate(
            id,
            { status, lastActiveAt: new Date()},
            { new: true }
        );
        if(!device) {
            return res.status(404).json({ error: 'Device not found '});
        }

        sendResponse(res, 200, true, "Status updated successfully", device);
  } catch (error) {
    console.error("Update status Error:", error);
    sendResponse(res, 500, false, "Failed to update device status", error.message);
  }
};
exports.getDeviceById = async (req, res) => {
    try {
        const { id } = req.params;
        const device = await Device.findById(id);
        if (!device) {
            return res.status(404).json({ error: "Device not found"});
        }
        sendResponse(res, 200, true, "Device fetched successfully", device);
    }catch(error) {
        console.error("Get Device by Id Error:", error);
        sendResponse(res, 500, false, "Failed to fetch device", error.message);
    }
};