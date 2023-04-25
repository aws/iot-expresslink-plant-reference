import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { IoTDataPlaneClient, UpdateThingShadowCommand } = require("@aws-sdk/client-iot-data-plane");

export const handler = async (event) => {
  const client = new IoTDataPlaneClient({});
  const shadowUpdateCommand = new UpdateThingShadowCommand({
    payload: JSON.stringify({
      "state": {
        "desired": {
          "water": "on"
        }
      }
    }),
    shadowName: "PlantShadow",
    thingName: process.env.thingName
  });
  const shadowResponse = await client.send(shadowUpdateCommand);
  if (shadowResponse.status >= 300) {
    throw Error(shadowResponse.statusText);
  }
};