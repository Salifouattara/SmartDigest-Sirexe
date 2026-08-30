#include <Arduino.h>
#include <DHT.h>

#define DHT_PIN 4
#define DHT_TYPE DHT22
#define OK_LED 2
#define ALERT_LED 15

DHT dht(DHT_PIN, DHT_TYPE);

float clamp(float value, float minValue, float maxValue) {
  return max(minValue, min(value, maxValue));
}

void setup() {
  Serial.begin(115200);
  pinMode(OK_LED, OUTPUT);
  pinMode(ALERT_LED, OUTPUT);

  dht.begin();
  digitalWrite(OK_LED, HIGH);
  digitalWrite(ALERT_LED, LOW);

  Serial.println("[ESP32] BioGaz+ / SmartDigest booting...");
  Serial.println("[ESP32] Monitoring digester: CH4 / H2S / Temp / Pressure");
}

void loop() {
  float temp = dht.readTemperature();
  if (isnan(temp)) {
    temp = 38.4;
  }

  float t = millis() / 1000.0f;
  float ch4 = 62.0f + sin(t * 0.7f) * 7.0f + random(-8, 9) / 10.0f;
  float h2s = 170.0f + cos(t * 0.8f) * 110.0f + random(0, 80);
  float pressure = 18.5f + sin(t * 0.9f) * 6.8f;
  float flow = 44.0f + (ch4 - 55.0f) * 1.1f;

  ch4 = clamp(ch4, 45.0f, 72.0f);
  h2s = clamp(h2s, 80.0f, 500.0f);
  pressure = clamp(pressure, 12.0f, 30.0f);
  flow = clamp(flow, 30.0f, 70.0f);

  bool critical = (ch4 < 50.0f) || (h2s > 400.0f) || (temp < 35.0f) || (temp > 42.0f) || (pressure > 28.0f);

  digitalWrite(OK_LED, critical ? LOW : HIGH);
  digitalWrite(ALERT_LED, critical ? HIGH : LOW);

  Serial.printf(
    "[ESP32] T=%.1fC CH4=%.1f%% H2S=%.0fppm P=%.1fmbar Flow=%.1fm3/h Status=%s\n",
    temp,
    ch4,
    h2s,
    pressure,
    flow,
    critical ? "ALERT" : "NORMAL"
  );

  delay(3000);
}
