const Device = require('../models/Device');
const si = require("systeminformation");

// Store active socket connections
let connectedDevices = {};

const initSocket = (io) => {
  // Triggered when a device connects
  io.on("connection", (socket) => {
    console.log("🔗 Device connected:", socket.id);

    // When a device registers itself
    socket.on("register-device", async (deviceData) => {
      try {
        const { name, ip, specs } = deviceData;

        // Save or update device in MongoDB
        let device = await Device.findOneAndUpdate(
          { ip },
          { name, specs, socketId: socket.id, status: "online" },
          { new: true, upsert: true }
        );

        connectedDevices[socket.id] = device;
        console.log(`✅ Registered device: ${device.name}`);

        // Notify all dashboards
        io.emit("device-list-update", await Device.find());
      } catch (error) {
        console.error("Error registering device:", error);
      }
    });

    // When a device sends live metrics
    socket.on("send-metrics", async (data) => {
      const { cpu, memory, uptime } = data;

      // Identify which device sent this data
      const device = connectedDevices[socket.id];
      if (!device) return;

      // Update MongoDB with current metrics
      await Device.findByIdAndUpdate(device._id, {
        lastMetrics: { cpu, memory, uptime },
        lastActive: Date.now(),
      });

      // Broadcast updated metrics to all dashboards
      io.emit("metrics-update", { id: device._id, cpu, memory, uptime });
    });

    // Handle device disconnect
    socket.on("disconnect", async () => {
      console.log("❌ Device disconnected:", socket.id);
      const device = connectedDevices[socket.id];
      if (device) {
        await Device.findByIdAndUpdate(device._id, { status: "offline" });
        delete connectedDevices[socket.id];
        io.emit("device-list-update", await Device.find());
      }
    });
  });
};

module.exports = initSocket;
