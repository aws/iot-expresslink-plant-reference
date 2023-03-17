export const ConfigParams = {
    appName: "Plant-Enviornment",
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
    sensors: ["waterLevel", "light", "temperature"],

}