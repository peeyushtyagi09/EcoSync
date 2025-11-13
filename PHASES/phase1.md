**🧩 PHASE 1 — Core Setup (Foundation)**
**Objective:** Create the backbone system that allows devices to **connect, identify themselves, monitor system metrics, and communicate in real time.**
No green optimization, AI, or blockchain yet — just the base network and live data flow.

---

## **1. System Overview**

This phase builds the **core communication and monitoring layer** for EcoSync.
It has 4 main parts:

| Component                       | Purpose                                                 |
| ------------------------------- | ------------------------------------------------------- |
| **Frontend (React)**            | Displays live system metrics and device info            |
| **Backend (Node.js + Express)** | API and control center for device coordination          |
| **Database (MongoDB)**          | Stores registered devices and their current state       |
| **Real-Time Layer (Socket.IO)** | Enables instant data updates between devices and server |

The output of this phase:
→ A running app where multiple devices can connect, register themselves, and send live CPU/memory data visible on a dashboard.

---

## **2. Core Concepts**

### **2.1 MERN Stack Setup**

* **React (Frontend)**:
  Single-page dashboard showing connected devices, their performance stats, and live updates.
  It doesn’t send commands yet — only receives real-time metrics and displays them.

* **Node.js + Express (Backend)**:
  Acts as the **coordinator and relay** between devices and dashboard.
  Handles routes like `/register`, `/metrics`, `/devices`.
  Runs a WebSocket server (Socket.IO) for real-time updates.

* **MongoDB (Database)**:
  Used for persistent storage of:

  * Device registration info
  * Historical metric snapshots
  * Connection status

  Data Model (conceptually):

  * Device ID
  * IP/Hostname
  * CPU cores, total RAM, OS
  * Status: online/offline
  * Last active timestamp

---

## **3. Device Registration System**

### **Purpose**

Every device in the EcoSync network must have a unique identity.
This identity is used for:

* Tracking performance over time
* Coordinating future load distribution
* Linking metrics to the right device

### **Flow**

1. Device starts the agent (Node.js script).
2. Agent sends a “register” request to backend with its system info.
3. Backend stores or updates entry in MongoDB.
4. Dashboard displays this new device as an online node.

### **Data Fields**

* **Device Name**: user-given (e.g., “Laptop1”).
* **IP Address**: to identify within LAN.
* **Specs**: CPU model, cores, RAM size, OS type.
* **Status**: online/offline, updated every few seconds.
* **Timestamp**: when last updated.

### **Why It Matters**

This registration creates the **foundation for trust and coordination** — the system can’t optimize or redistribute tasks later without knowing what devices exist and their capabilities.

---

## **4. System Monitoring Module**

### **Purpose**

Continuously measure device performance and send the data live to backend.
It’s the first step in understanding device efficiency and energy use later.

### **Data Captured**

* **CPU usage (%)**
* **Memory usage (%)**
* **Disk usage (%)**
* **Network load (upload/download rate)**
* **System uptime**

*(Power usage will come in later phases — not yet.)*

### **Conceptual Flow**

1. Each device agent runs a small monitoring service.
2. Every few seconds (e.g., 5s interval), it collects metrics via system APIs.
3. It sends this data to backend via Socket.IO.
4. Backend pushes updates instantly to frontend dashboard.

### **Why**

This creates a **continuous data stream**, which is the heart of EcoSync — enabling live monitoring, energy tracking, and future optimization.

---

## **5. Real-Time Communication (Socket.IO Layer)**

### **Purpose**

Maintain **low-latency, bidirectional communication** between:

* Devices → Server (sending metrics)
* Server → Dashboard (updating visualizations)
* (Later phases: Server ↔ Devices for control commands)

### **How It Works**

* Devices connect via a WebSocket channel at startup.
* Each device gets a unique socket ID mapped to its device ID.
* When metrics arrive, backend emits them to all subscribed dashboards.
* Dashboards show data instantly without page refresh.

### **Why Socket.IO**

Unlike HTTP polling, it’s **event-driven and efficient**, ideal for distributed systems that need live updates.

---

## **6. Frontend Dashboard**

### **Purpose**

Visualize all connected devices and their performance metrics in real time.
Acts as the **human interface** of the EcoSync Network.

### **Main Sections**

1. **Device List Panel**

   * Shows connected devices with basic info (name, status, uptime).
   * Updates dynamically as devices join/leave.

2. **Live Metrics Panel**

   * For selected device, show CPU %, Memory %, Network usage.
   * Use Recharts or D3.js for live updating graphs.

3. **Connection Map (simple)**

   * Basic layout showing each device as a node (will evolve into 3D map later).
   * Node turns green when active, gray when offline.

4. **Historical Graphs (optional for this phase)**

   * Simple line charts for CPU/memory over last 5 minutes.
   * Data pulled from MongoDB history.

### **Why**

The dashboard gives users instant visibility into their computing network and forms the **visual backbone** for later sustainability and gamification layers.

---

## **7. Data Flow Summary**

```
Device Agent (Node.js)
   ↓
Collects CPU/RAM data
   ↓
Sends via Socket.IO
   ↓
Backend (Express + MongoDB)
   ↓
Stores + emits updates
   ↓
Frontend Dashboard (React)
   ↓
Displays live metrics
```

**Result:** A live-connected network of devices sending and displaying performance data.

---

## **8. What Not to Build Yet**

Skip these for now — they come later:

* Energy or carbon footprint calculations
* AI optimization or scheduling
* Blockchain rewards
* Peer-to-peer task sharing
* OS-level control (pause, thermal, etc.)

Focus only on:

* Connection
* Registration
* Real-time data monitoring
* Live visualization

---

## **9. End Result of Phase 1**

After completion of this phase, you’ll have:
✅ A **device agent** that registers and streams metrics.
✅ A **backend** that manages connections and stores data.
✅ A **frontend** that visualizes multiple devices’ performance in real time.

This becomes the **foundation for all intelligent and green features** in later phases — a stable, connected ecosystem of devices ready for optimization.
