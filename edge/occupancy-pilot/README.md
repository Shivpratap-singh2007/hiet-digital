# HIET Digital Campus — Edge Occupancy Pilot (Raspberry Pi / Jetson)
Himachal Institute of Engineering & Technology, Shahpur (H.P.)

## Overview
This edge service runs on a local gateway (e.g. Raspberry Pi 4/5, Jetson Nano, or x86 Mini-PC) at pilot campus locations (Central Library, Canteen, C-LAB-1) to compute aggregate headcounts.

### Strict Privacy Guarantee
1. **Zero Face Recognition**: The vision pipeline detects ONLY the general COCO object class `person` (bounding box detection). No facial features, face meshes, or biometric signatures are ever analyzed or stored.
2. **Zero Video Retention**: Raw video frames are processed in volatile memory and destroyed immediately (`del frame`) after headcount evaluation. No images or videos are saved to SD card/disk or sent to the cloud.
3. **Aggregate Counts Only**: Only anonymous integer counts (`personCount`), calculated occupancy percentages, and crowd severity levels (`low`, `medium`, `high`, `critical`) are transmitted to the Supabase Edge Function over HTTPS.
4. **Device Credential Authentication**: Ingestion requests use a hardware device secret stored in environment variables, completely decoupled from student sessions.

---

## Hardware Requirements
- **Hardware**: Raspberry Pi 4 (4GB+) or Jetson Nano / Orin Nano / Mini-PC.
- **Camera**: Standard USB UVC webcam (e.g. Logitech C270/C920) or RTSP IP Camera stream.
- **OS**: Raspberry Pi OS (64-bit Debian Bookworm) / Ubuntu 22.04 LTS.

---

## Installation & Deployment

1. **Clone or copy the directory to the device**:
   ```bash
   cd ~/hiet-campus/edge/occupancy-pilot
   ```

2. **Create Python virtual environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables (`.env`)**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   ```ini
   DEVICE_CODE=LIB-CAM-01
   DEVICE_SECRET=your_registered_device_secret
   ZONE_CODE=LIBRARY
   ZONE_CAPACITY=50
   INFERENCE_INTERVAL_SEC=30
   INGEST_URL=https://<your-project>.supabase.co/functions/v1/ingest-occupancy-event
   CAMERA_INDEX=0
   ```

4. **Run the Pilot**:
   ```bash
   python3 main.py
   ```

5. **Run as a systemd service (Production)**:
   Create `/etc/systemd/system/hiet-occupancy.service`:
   ```ini
   [Unit]
   Description=HIET Campus Edge Occupancy Service
   After=network.target

   [Service]
   User=pi
   WorkingDirectory=/home/pi/hiet-campus/edge/occupancy-pilot
   ExecStart=/home/pi/hiet-campus/edge/occupancy-pilot/venv/bin/python3 main.py
   Restart=always
   RestartSec=10
   EnvironmentFile=/home/pi/hiet-campus/edge/occupancy-pilot/.env

   [Install]
   WantedBy=multi-user.target
   ```
   Enable and start:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable hiet-occupancy
   sudo systemctl start hiet-occupancy
   ```
