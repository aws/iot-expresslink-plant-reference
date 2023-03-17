#include <STM32LowPower.h>
#include <HardwareSerial.h>
#include <Wire.h>
#include <SparkFunTMP102.h>

// FILL THIS IN IF RECONFIGURING EXPRESSLINK
#define MY_AWS_IOT_ENDPOINT ""
#define MY_SSID ""
#define MY_PASSPHRASE ""

#define EXPRESSLINK_SERIAL_RX_PIN 0
#define EXPRESSLINK_SERIAL_TX_PIN 1

HardwareSerial expresslink_serial(EXPRESSLINK_SERIAL_RX_PIN, EXPRESSLINK_SERIAL_TX_PIN);
TMP102 tempSensor;

// Sensor pins
#define waterSensorPin A0
#define lightSensorPin A1
#define powerPin D7

uint32_t sendInterval = 300000; // number of ms to wait between MQTT messages
uint32_t timeout_ms = 20000;    // number of ms to wait for ExpressLink response
int waterLevel = 0;
int light = 0;
int temperature = 0;
char MQTTMessage[70];

void setup()
{
  Serial.begin(115200);
  expresslink_serial.begin(115200);
  Wire.begin(); // Join I2C Bus
  LowPower.begin();
  tempSensor.begin();

  pinMode(powerPin, OUTPUT);   // configure D7 pin as an OUTPUT
  digitalWrite(powerPin, LOW); // turn the sensor OFF

  pinMode(LED_BUILTIN, OUTPUT);

  do
  {
    expresslinkExecuteCommand("AT+RESET");
    expresslinkExecuteCommand("AT+CONF Topic1=PlantData");
    // UNCOMMENT THE LINE BELOW IF RECONFIGURING EXPRESSLINK
    // expresslinkInit();
  } while (expresslinkExecuteCommand("AT+CONNECT").startsWith("OK") == false);
}

void loop()
{
  // get and send data every 5 min
  getData();
  sendData();
  delay(5);
  LowPower.sleep(sendInterval);
}

void getData()
{
  digitalWrite(powerPin, HIGH); // turn water sensor and photocell on

  // read temperature data
  tempSensor.wakeup();
  temperature = tempSensor.readTempF();
  tempSensor.sleep();

  // read water level in tank
  waterLevel = analogRead(waterSensorPin);

  // read light data
  light = analogRead(lightSensorPin);

  digitalWrite(powerPin, LOW); // turn water sensor and photocell off
}

void sendData()
{
  digitalWrite(LED_BUILTIN, HIGH); // Blink stat LED

  sprintf(MQTTMessage,
          "AT+SEND1 { \"temperature\": %i, \"waterLevel\": %i, \"light\": %i }",
          temperature,
          waterLevel,
          light);

  // send the json payload over MQTT
  expresslinkExecuteCommand(MQTTMessage);

  digitalWrite(LED_BUILTIN, LOW); // Turn off stat LED
}

void expresslinkInit()
{
  if (MY_AWS_IOT_ENDPOINT == "" || MY_SSID == "" || MY_PASSPHRASE == "")
  {
    Serial.println("Need to define IoT Endpoint and WIFI");
    exit(1);
  }
  expresslinkExecuteCommand("AT+CONF Endpoint=" MY_AWS_IOT_ENDPOINT "");
  expresslinkExecuteCommand("AT+CONF SSID=" MY_SSID "");
  expresslinkExecuteCommand("AT+CONF Passphrase=" MY_PASSPHRASE "");
}

String expresslinkExecuteCommand(char *command)
{
  Serial.println(command);
  expresslink_serial.println(command);
  expresslink_serial.setTimeout(timeout_ms);
  String s = expresslink_serial.readStringUntil('\n');
  Serial.println(s);
  return s;
}