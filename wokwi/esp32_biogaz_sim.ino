const int STATUS_LED = 2;

float clamp(float value, float minValue, float maxValue) {
  if (value < minValue) return minValue;
  if (value > maxValue) return maxValue;
  return value;
}

void sendTelemetry() {
  unsigned long t = millis();

  float temp = 38.2 + sin(t / 6500.0f) * 1.8f + ((float)random(-10, 11)) / 10.0f;
  float ch4 = 63.5 + sin(t / 8200.0f) * 6.0f + ((float)random(-20, 21)) / 10.0f;
  float h2s = 138.0f + sin(t / 4700.0f) * 52.0f + ((float)random(-20, 21));
  float pressure = 19.2 + sin(t / 6900.0f) * 2.4f + ((float)random(-10, 11)) / 10.0f;
  float ph = 7.32 + sin(t / 10500.0f) * 0.18f + ((float)random(-5, 6)) / 100.0f;
  float flow = 49.6 + sin(t / 3900.0f) * 7.0f + ((float)random(-14, 15)) / 10.0f;

  temp = clamp(temp, 33.0f, 46.0f);
  ch4 = clamp(ch4, 42.0f, 74.0f);
  h2s = clamp(h2s, 80.0f, 520.0f);
  pressure = clamp(pressure, 10.0f, 32.0f);
  ph = clamp(ph, 6.4f, 8.0f);
  flow = clamp(flow, 28.0f, 68.0f);

  String status = "NORMAL";
  if (ch4 < 50.0f || h2s > 350.0f || pressure > 28.0f || ph < 6.7f || temp < 35.0f || temp > 42.0f) {
    status = "ALERT";
  }

  digitalWrite(STATUS_LED, status == "NORMAL" ? HIGH : LOW);

  Serial.printf(
    "{\"device\":\"esp32_biogaz\",\"status\":\"%s\",\"temperature_c\":%.2f,\"ch4_percent\":%.2f,\"h2s_ppm\":%.1f,\"pressure_mbar\":%.2f,\"ph\":%.2f,\"flow_m3_h\":%.2f}\n",
    status.c_str(),
    temp,
    ch4,
    h2s,
    pressure,
    ph,
    flow
  );
}

void setup() {
  pinMode(STATUS_LED, OUTPUT);
  digitalWrite(STATUS_LED, LOW);

  Serial.begin(115200);
  randomSeed(analogRead(0));

  Serial.println("BioGaz+ Sensor Node booting...");
  Serial.println("ESP32 virtual telemetry active");
  delay(1000);
}

void loop() {
  sendTelemetry();
  delay(2000);
}
