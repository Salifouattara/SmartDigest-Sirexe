import json
import os
import random
import time
from datetime import datetime

import paho.mqtt.client as mqtt

BROKER_HOST = os.getenv("MQTT_BROKER_HOST", "localhost")
BROKER_PORT = int(os.getenv("MQTT_BROKER_PORT", "1883"))
TOPIC = os.getenv("MQTT_TOPIC", "biogas/plant/esp32-01/telemetry")


def generate_payload() -> dict:
    phase = time.time() / 20.0
    ch4 = 63.0 + 6.0 * (0.5 + 0.5 * __import__("math").sin(phase)) + random.uniform(-2.0, 2.5)
    h2s = 135.0 + 65.0 * (0.5 + 0.5 * __import__("math").cos(phase * 1.3)) + random.uniform(-15.0, 20.0)
    temperature = 38.4 + 1.8 * __import__("math").sin(phase * 0.9) + random.uniform(-0.4, 0.4)
    pressure = 18.5 + 3.1 * __import__("math").sin(phase * 0.7) + random.uniform(-0.8, 0.8)
    ph = 7.35 + 0.2 * __import__("math").sin(phase * 0.5) + random.uniform(-0.05, 0.05)
    flow = 49.0 + 8.0 * __import__("math").sin(phase * 1.1) + random.uniform(-2.0, 2.0)

    status = "NORMAL"
    if ch4 < 50 or h2s > 350 or pressure > 28 or ph < 6.7 or temperature < 35 or temperature > 42:
        status = "ALERT"

    return {
        "device_id": "esp32-01",
        "timestamp": int(datetime.utcnow().timestamp()),
        "ch4_percent": round(max(40.0, min(75.0, ch4)), 2),
        "h2s_ppm": round(max(60.0, min(500.0, h2s)), 1),
        "temperature_celsius": round(temperature, 2),
        "pressure_mbar": round(max(10.0, min(32.0, pressure)), 2),
        "ph": round(ph, 2),
        "flow_rate_m3_h": round(max(25.0, min(70.0, flow)), 1),
        "vfa_tic_ratio": round(0.22 + random.uniform(-0.04, 0.04), 3),
        "status": status,
    }


def on_connect(client, userdata, flags, rc):
    print(f"[MQTT] connected to broker {BROKER_HOST}:{BROKER_PORT} with code {rc}")


client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
client.on_connect = on_connect
client.connect(BROKER_HOST, BROKER_PORT, 60)
client.loop_start()

print(f"[MQTT] publishing to topic: {TOPIC}")

try:
    while True:
        payload = generate_payload()
        client.publish(TOPIC, json.dumps(payload), qos=1)
        print(f"[MQTT] {payload['status']} -> {payload}")
        time.sleep(3)
except KeyboardInterrupt:
    print("[MQTT] simulation stopped")
finally:
    client.loop_stop()
    client.disconnect()
