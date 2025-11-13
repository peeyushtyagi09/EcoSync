import React, { useEffect, useState } from "react";
import api from "../api/api";

const Devices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch devices from backend
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await api.get("/devices/registerDevice"); // hitting backend route
        setDevices(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load devices");
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  if (loading) return <p>Loading devices...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Connected Devices</h2>
      {devices.length === 0 ? (
        <p>No devices found.</p>
      ) : (
        <table className="w-full border-collapse border border-gray-700">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="border border-gray-700 p-2">Name</th>
              <th className="border border-gray-700 p-2">IP Address</th>
              <th className="border border-gray-700 p-2">MAC Address</th>
              <th className="border border-gray-700 p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => (
              <tr key={device._id} className="text-center bg-gray-100">
                <td className="border border-gray-700 p-2">{device.name}</td>
                <td className="border border-gray-700 p-2">{device.ip}</td>
                <td className="border border-gray-700 p-2">{device.mac}</td>
                <td className="border border-gray-700 p-2">
                  {device.isOnline ? "Online" : "Offline"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Devices;
