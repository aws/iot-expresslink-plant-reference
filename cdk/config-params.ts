export const ConfigParams = {
    appName: "Plant-Environment",
    // change env if there is a specific account and region you want to deploy to
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
        endpoint: "", // found in IoTCore Settings
        thingName: "", // output by arduino code setup
    },
    logGroupName: "iot_to_cloudwatch_log_group",
    email: '',
    waterAlarm: {
        threshold: 100,
        evaluationPeriods: 3,
        datapointsToAlarm: 2,
    },
    dashboard: {
        widgetWidth: 9,
        widgetHeight:5,
    },
    sensors: ["waterLevel", "light", "temperature", "soilMoisture"],
    wateringFrequency: 7, //number of days bewtween plant watering
}