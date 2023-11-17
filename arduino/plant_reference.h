#include <STM32LowPower.h>
#include <HardwareSerial.h>
#include <Wire.h>
#include <SparkFunTMP102.h>
#include <ArduinoJson.h>
#include <Adafruit_seesaw.h>

/* FILL THIS IN IF RECONFIGURING EXPRESSLINK */
#define MY_AWS_IOT_ENDPOINT    ""
#define MY_SSID                ""
#define MY_PASSPHRASE          ""

/* Configure pump duration and send interval */
uint32_t sendInterval = 300000; /* number of ms to wait between MQTT messages */
uint32_t pumpDuration = 60000;  /* duration to keep water pump on in ms */
uint32_t timeout_ms = 20000;    /* number of ms to wait for ExpressLink response */

/* Configure Sensor pins */
#define waterSensorPin               A0
#define lightSensorPin               A1
#define powerPin                     D7
#define waterPin                     D8

#define EXPRESSLINK_SERIAL_RX_PIN    0
#define EXPRESSLINK_SERIAL_TX_PIN    1

HardwareSerial expresslink_serial( EXPRESSLINK_SERIAL_RX_PIN,
                                   EXPRESSLINK_SERIAL_TX_PIN );
DynamicJsonBuffer jsonBuffer;
TMP102 tempSensor;
Adafruit_seesaw soilSensor;

long lastDataSend = -sendInterval;
long pumpStart;

/* Sensor readings */
int waterLevel = 0;
int light = 0;
int temperature = 0;
int soilMoisture = 0;

bool waterOn = false;
int retries = 0;

enum OTAStates
{
    NO_OTA, DOWNLOADING, DOWNLOAD_OTA, OTA_UPDATE
};
OTAStates state = NO_OTA;
bool awaitingOTAResponse = true;
bool otaInProgress = false;

char expresslinkResponse[ 1500 ];
char MQTTMessage[ 70 ];
