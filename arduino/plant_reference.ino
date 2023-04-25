#include "plant_reference.h"

void setup()
{
  Serial.begin(115200);
  expresslink_serial.begin(115200);
  Wire.begin(); // Join I2C Bus
  LowPower.begin();
  tempSensor.begin();
  soilSensor.begin(0x36); //0x36 is the soil sensors I2C address

  pinMode(powerPin, OUTPUT);   // configure D7 pin as an OUTPUT
  digitalWrite(powerPin, LOW); // turn the sensors OFF

  pinMode(waterPin, OUTPUT);   // configure D6 pin as an OUTPUT
  digitalWrite(waterPin, LOW); // turn the water pump OFF  

  pinMode(LED_BUILTIN, OUTPUT);

  do
  {
    // UNCOMMENT THE LINE BELOW IF RECONFIGURING EXPRESSLINK
    // expresslinkInit();
    expresslinkExecuteCommand("AT+RESET\n");
    expresslinkExecuteCommand("AT+CONF Topic1=PlantData\n");
    expresslinkExecuteCommand("AT+CONF EnableShadow=1\n");
    expresslinkExecuteCommand("AT+CONF Shadow1=PlantShadow\n");
    expresslinkExecuteCommand("AT+CONNECT\n");
  } while (!startsWith(expresslinkResponse, "OK", 2));

  sendShadowCommandSeq("AT+SHADOW1 INIT\n", "AT+Event?\n", "OK 20", "OK 21");
  sendShadowCommandSeq("AT+SHADOW1 UPDATE {\"state\":{\"desired\":{\"water\": \"off\" } } }\n",
                       "AT+SHADOW1 GET UPDATE\n",
                       "OK 1",
                       "OK 0");
  sendShadowCommandSeq("AT+SHADOW1 SUBSCRIBE\n", "AT+Event?\n", "OK 26", "OK 27");
}

void loop()
{
  do {
    expresslinkExecuteCommand("AT+Event?\n");
    
    if (startsWith(expresslinkResponse, "OK 3", 4)) {
      expresslinkExecuteCommand("AT+CONNECT\n");
      while (!startsWith(expresslinkResponse, "OK", 2)) {
        Serial.println(F("Attempting to reconnect"));
        expresslinkExecuteCommand("AT+CONNECT\n");
      }
    } else if (startsWith(expresslinkResponse, "OK 24", 5)) {
      updateShadow();
    }
  } while (startsWith(expresslinkResponse, "OK ", 3));
  
  // get and send data every 5 min
  if (millis()-lastDataSend >= sendInterval) {
    lastDataSend = millis();
    getData();
    sendData();
  }

  if (waterOn) {
    if (millis()-pumpStart >= pumpDuration) {
      sendShadowCommandSeq("AT+SHADOW1 UPDATE {\"state\":{\"desired\":{\"water\": \"off\" } } }\n",
                           "AT+SHADOW1 GET UPDATE\n",
                           "OK 1",
                           "OK 0");
    } else {
      delay(pumpDuration);
    }
  } else {
    delay(sendInterval-(millis()-lastDataSend)); //adjust sleep to ensure data sent every sendInterval
  }
}

void getData()
{
  digitalWrite(powerPin, HIGH); // turn water sensor and photocell on

  // read temperature data
  tempSensor.wakeup();
  temperature = tempSensor.readTempF();
  tempSensor.sleep();

  soilMoisture = soilSensor.touchRead(0);

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
          "AT+SEND1 { \"temperature\": %i, \"waterLevel\": %i, \"light\": %i, \"soilMoisture\":%i }\n",
          temperature,
          waterLevel,
          light,
          soilMoisture);

  // send the json payload over MQTT
  expresslinkExecuteCommand(MQTTMessage);

  digitalWrite(LED_BUILTIN, LOW); // Turn off stat LED
}

void expresslinkInit()
{
  if (MY_AWS_IOT_ENDPOINT == "" || MY_SSID == "" || MY_PASSPHRASE == "")
  {
    Serial.println(F("Need to define IoT Endpoint and WIFI"));
    exit(1);
  }
  expresslinkExecuteCommand("AT+CONF? ThingName");
  expresslinkExecuteCommand("AT+CONF? Certificate pem");
  expresslinkExecuteCommand("AT+CONF Endpoint=" MY_AWS_IOT_ENDPOINT "\n");
  expresslinkExecuteCommand("AT+CONF SSID=" MY_SSID "\n");
  expresslinkExecuteCommand("AT+CONF Passphrase=" MY_PASSPHRASE "\n");
}

void expresslinkExecuteCommand(char *command)
{
  Serial.printf(command);
  expresslink_serial.printf(command);
  expresslink_serial.setTimeout(timeout_ms);
  String response = expresslink_serial.readStringUntil('\n');
  int responseLen = response.length() + 1; 
  response.toCharArray(expresslinkResponse, responseLen);
  Serial.println(F(expresslinkResponse));
}

void updateShadow(){
  expresslinkExecuteCommand("AT+SHADOW1 GET DELTA\n");
  JsonObject& delta = jsonBuffer.parseObject(String(expresslinkResponse).substring(3));
  const char* updateMes = delta["state"]["water"];
  waterOn = strcmp(updateMes, "on") == 0;

  if (waterOn) {
    pumpStart = millis();
    Serial.println("WATER PUMP ON");
    digitalWrite(waterPin, HIGH);
  } else {
    Serial.println("WATER PUMP OFF");
    digitalWrite(waterPin, LOW);
  }
}

bool startsWith(char* response, char *str, int len) {
  char subbuff[len+1];
  memcpy( subbuff, &response[0], len);
  subbuff[len] = '\0';
  return strcmp(subbuff, str) == 0;
}

void sendShadowCommandSeq(char* command, char* checkRes, char* success, char* fail) {
  do {
    expresslinkExecuteCommand(command);
    retries = 0;
    do {
      delay(2000);
      expresslinkExecuteCommand(checkRes);
      retries++;
    } while (retries<5
             && !startsWith(expresslinkResponse, fail, strlen(fail))
             && !startsWith(expresslinkResponse, success, strlen(success)));
  } while (!startsWith(expresslinkResponse, fail, strlen(fail)));
}