import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { GrafanaClient, CreateWorkspaceApiKeyCommand } = require("@aws-sdk/client-grafana");

export const handler = async (event) => {
  const client = new GrafanaClient({});
  const apiCommand = new CreateWorkspaceApiKeyCommand({
    keyName: "GrafanaAPIKey",
    keyRole: "ADMIN",
    workspaceId: process.env.workspaceId,
    secondsToLive: 240
  });
  const apiResponse = await client.send(apiCommand);
  const apiKey = apiResponse.key;
  console.log(apiKey);

  // TODO: CDK or SDK L2 constructs for Grafana
  // Grafana resources currently have to be created using HTTP APIs
  // https://docs.aws.amazon.com/grafana/latest/userguide/Using-Grafana-APIs.html
  const datasourceResponse = await fetch(`${process.env.url}/api/datasources`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      "name": "Plant-Environment--CloudwatchDatasource",
      "type": "cloudwatch",
      "access": "proxy",
      "jsonData": {
        "defaultRegion": process.env.region,
        "namespace": "Plant-Environment--Metrics"
      }
    })
  });
  if (datasourceResponse.status >= 300) {
    throw Error(datasourceResponse.statusText);
  }
  const datasourceData = await datasourceResponse.json();
  console.log(datasourceData);
  const datasourceUid = datasourceData.datasource.uid;

  const dashboardResponse = await fetch(`${process.env.url}/api/dashboards/db`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      "dashboard": {
        "annotations": {
          "list": [
            {
              "builtIn": 1,
              "datasource": "-- Grafana --",
              "enable": true,
              "hide": true,
              "iconColor": "rgba(0, 211, 255, 1)",
              "name": "Annotations & Alerts",
              "target": {
                "limit": 100,
                "matchAny": false,
                "tags": [],
                "type": "dashboard"
              },
              "type": "dashboard"
            }
          ]
        },
        "editable": true,
        "fiscalYearStartMonth": 0,
        "graphTooltip": 0,
        "id": null,
        "links": [],
        "liveNow": true,
        "panels": [
          {
            "datasource": {
              "type": "cloudwatch",
              "uid": `${datasourceUid}`
            },
            "fieldConfig": {
              "defaults": {
                "color": {
                  "mode": "palette-classic"
                },
                "custom": {
                  "axisLabel": "",
                  "axisPlacement": "auto",
                  "barAlignment": 0,
                  "drawStyle": "line",
                  "fillOpacity": 0,
                  "gradientMode": "none",
                  "hideFrom": {
                    "legend": false,
                    "tooltip": false,
                    "viz": false
                  },
                  "lineInterpolation": "linear",
                  "lineWidth": 1,
                  "pointSize": 5,
                  "scaleDistribution": {
                    "type": "linear"
                  },
                  "showPoints": "always",
                  "spanNulls": false,
                  "stacking": {
                    "group": "A",
                    "mode": "none"
                  },
                  "thresholdsStyle": {
                    "mode": "off"
                  }
                },
                "mappings": [],
                "thresholds": {
                  "mode": "absolute",
                  "steps": [
                    {
                      "color": "green",
                      "value": null
                    },
                    {
                      "color": "red",
                      "value": 80
                    }
                  ]
                }
              },
              "overrides": []
            },
            "gridPos": {
              "h": 8,
              "w": 12,
              "x": 0,
              "y": 0
            },
            "id": 6,
            "options": {
              "legend": {
                "calcs": [],
                "displayMode": "hidden",
                "placement": "bottom"
              },
              "tooltip": {
                "mode": "single",
                "sort": "none"
              }
            },
            "targets": [
              {
                "alias": "",
                "datasource": {
                  "type": "cloudwatch",
                  "uid": `${datasourceUid}`
                },
                "dimensions": {},
                "expression": "",
                "id": "",
                "matchExact": true,
                "metricEditorMode": 0,
                "metricName": "temperatureMetric",
                "metricQueryType": 0,
                "namespace": "Plant-Environment--Metrics",
                "period": "",
                "queryMode": "Metrics",
                "refId": "A",
                "region": "default",
                "sqlExpression": "",
                "statistic": "Minimum"
              }
            ],
            "title": "Temperature",
            "type": "timeseries"
          },
          {
            "alert": {
              "alertRuleTags": {},
              "conditions": [
                {
                  "evaluator": {
                    "params": [
                      100
                    ],
                    "type": "lt"
                  },
                  "operator": {
                    "type": "and"
                  },
                  "query": {
                    "params": [
                      "A",
                      "1m",
                      "now"
                    ]
                  },
                  "reducer": {
                    "params": [],
                    "type": "avg"
                  },
                  "type": "query"
                }
              ],
              "executionErrorState": "alerting",
              "for": "3m",
              "frequency": "1m",
              "handler": 1,
              "name": "Water Level alert",
              "noDataState": "no_data",
              "notifications": []
            },
            "datasource": {
              "type": "cloudwatch",
              "uid": `${datasourceUid}`
            },
            "fieldConfig": {
              "defaults": {
                "color": {
                  "mode": "palette-classic"
                },
                "custom": {
                  "axisLabel": "",
                  "axisPlacement": "auto",
                  "barAlignment": 0,
                  "drawStyle": "line",
                  "fillOpacity": 0,
                  "gradientMode": "none",
                  "hideFrom": {
                    "legend": false,
                    "tooltip": false,
                    "viz": false
                  },
                  "lineInterpolation": "linear",
                  "lineStyle": {
                    "fill": "solid"
                  },
                  "lineWidth": 1,
                  "pointSize": 5,
                  "scaleDistribution": {
                    "type": "linear"
                  },
                  "showPoints": "always",
                  "spanNulls": false,
                  "stacking": {
                    "group": "A",
                    "mode": "none"
                  },
                  "thresholdsStyle": {
                    "mode": "line"
                  }
                },
                "mappings": [],
                "thresholds": {
                  "mode": "absolute",
                  "steps": [
                    {
                      "color": "green",
                      "value": null
                    },
                    {
                      "color": "red",
                      "value": 100
                    }
                  ]
                }
              },
              "overrides": []
            },
            "gridPos": {
              "h": 8,
              "w": 12,
              "x": 12,
              "y": 0
            },
            "id": 2,
            "options": {
              "legend": {
                "calcs": [],
                "displayMode": "hidden",
                "placement": "bottom"
              },
              "tooltip": {
                "mode": "single",
                "sort": "none"
              }
            },
            "targets": [
              {
                "alias": "",
                "datasource": {
                  "type": "cloudwatch",
                  "uid": `${datasourceUid}`
                },
                "dimensions": {},
                "expression": "",
                "id": "",
                "matchExact": true,
                "metricEditorMode": 0,
                "metricName": "waterLevelMetric",
                "metricQueryType": 0,
                "namespace": "Plant-Environment--Metrics",
                "period": "",
                "queryMode": "Metrics",
                "refId": "A",
                "region": "default",
                "sqlExpression": "",
                "statistic": "Minimum"
              }
            ],
            "thresholds": [
              {
                "colorMode": "critical",
                "op": "lt",
                "value": 100,
                "visible": true
              }
            ],
            "title": "Water Level",
            "type": "timeseries"
          },
          {
            "datasource": {
              "type": "cloudwatch",
              "uid": `${datasourceUid}`
            },
            "fieldConfig": {
              "defaults": {
                "color": {
                  "mode": "palette-classic"
                },
                "custom": {
                  "axisLabel": "",
                  "axisPlacement": "auto",
                  "barAlignment": 0,
                  "drawStyle": "line",
                  "fillOpacity": 2,
                  "gradientMode": "none",
                  "hideFrom": {
                    "legend": false,
                    "tooltip": false,
                    "viz": false
                  },
                  "lineInterpolation": "linear",
                  "lineWidth": 2,
                  "pointSize": 5,
                  "scaleDistribution": {
                    "type": "linear"
                  },
                  "showPoints": "always",
                  "spanNulls": false,
                  "stacking": {
                    "group": "A",
                    "mode": "none"
                  },
                  "thresholdsStyle": {
                    "mode": "off"
                  }
                },
                "mappings": [],
                "thresholds": {
                  "mode": "absolute",
                  "steps": [
                    {
                      "color": "green",
                      "value": null
                    },
                    {
                      "color": "red",
                      "value": 80
                    }
                  ]
                }
              },
              "overrides": []
            },
            "gridPos": {
              "h": 8,
              "w": 12,
              "x": 0,
              "y": 8
            },
            "id": 4,
            "options": {
              "legend": {
                "calcs": [],
                "displayMode": "hidden",
                "placement": "bottom"
              },
              "tooltip": {
                "mode": "single",
                "sort": "none"
              }
            },
            "targets": [
              {
                "alias": "",
                "datasource": {
                  "type": "cloudwatch",
                  "uid": `${datasourceUid}`
                },
                "dimensions": {},
                "expression": "",
                "id": "",
                "matchExact": true,
                "metricEditorMode": 0,
                "metricName": "lightMetric",
                "metricQueryType": 0,
                "namespace": "Plant-Environment--Metrics",
                "period": "",
                "queryMode": "Metrics",
                "refId": "A",
                "region": "default",
                "sqlExpression": "",
                "statistic": "Minimum"
              }
            ],
            "title": "Light",
            "type": "timeseries"
          },
          {
            "datasource": {
              "type": "cloudwatch",
              "uid": `${datasourceUid}`
            },
            "gridPos": {
              "h": 8,
              "w": 12,
              "x": 12,
              "y": 8
            },
            "id": 8,
            "options": {
              "alertName": "",
              "dashboardAlerts": true,
              "dashboardTitle": "",
              "maxItems": 10,
              "showOptions": "current",
              "sortOrder": 1,
              "stateFilter": {
                "alerting": true,
                "execution_error": false,
                "no_data": true,
                "ok": true,
                "paused": false,
                "pending": true
              },
              "tags": []
            },
            "pluginVersion": "8.4.7",
            "targets": [
              {
                "alias": "",
                "datasource": {
                  "type": "cloudwatch",
                  "uid": `${datasourceUid}`
                },
                "dimensions": {},
                "expression": "",
                "id": "",
                "matchExact": true,
                "metricEditorMode": 0,
                "metricName": "",
                "metricQueryType": 0,
                "namespace": "",
                "period": "",
                "queryMode": "Metrics",
                "refId": "A",
                "region": "default",
                "sqlExpression": "",
                "statistic": "Average"
              }
            ],
            "title": "Plant Environment Alerts",
            "type": "alertlist"
          }
        ],
        "schemaVersion": 35,
        "style": "dark",
        "tags": [],
        "templating": {
          "list": []
        },
        "time": {
          "from": "now-3h",
          "to": "now"
        },
        "timepicker": {},
        "timezone": "",
        "title": "Plant Environment",
        "version": 0,
        "weekStart": ""
      },
      "folderId": 0,
      "message": "Create Grafana Dashboard",
      "overwrite": true
    })
  });
  if (dashboardResponse.status >= 300) {
    throw Error(dashboardResponse.statusText);
  }
  const dashboardData = await dashboardResponse.json();
  console.log(dashboardData);
};