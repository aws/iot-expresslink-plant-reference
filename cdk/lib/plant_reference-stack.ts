import { Stack, StackProps, RemovalPolicy, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  Dashboard as CloudWatchDashboard, PeriodOverride,
  GraphWidget, Alarm, ComparisonOperator, AlarmWidget
} from 'aws-cdk-lib/aws-cloudwatch';
import { SnsAction } from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Role, ServicePrincipal, PolicyStatement, Effect, CfnRole, Policy } from 'aws-cdk-lib/aws-iam'
import { LogGroup, MetricFilter, FilterPattern } from "aws-cdk-lib/aws-logs";
import { CfnTopicRule } from "aws-cdk-lib/aws-iot";
import { Topic } from "aws-cdk-lib/aws-sns";
import { EmailSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import { ConfigParams } from '../config-params';
import { CfnWorkspace } from 'aws-cdk-lib/aws-grafana';
import { Runtime, Code, LayerVersion } from 'aws-cdk-lib/aws-lambda';
import { TriggerFunction } from 'aws-cdk-lib/triggers';

export class PlantReferenceStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const IoTLogGroup = new LogGroup(this,
      ConfigParams.logGroupName,
      {
        logGroupName: ConfigParams.logGroupName,
        removalPolicy: RemovalPolicy.DESTROY
      })

    const loggingRole = new Role(
      this,
      'Logging',
      {
        roleName: 'RoleForIoTCoreLogging',
        assumedBy: new ServicePrincipal('iot.amazonaws.com')
      });

    // policy to allow logging in CloudWatch
    loggingRole.addToPolicy(new PolicyStatement(
      {
        effect: Effect.ALLOW,
        actions: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:PutMetricFilter",
          "logs:PutRetentionPolicy",
          "logs:GetLoggingOptions",
          "logs:SetLoggingOptions",
          "logs:SetV2LoggingOptions",
          "logs:GetV2LoggingOptions",
          "logs:SetV2LoggingLevels",
          "logs:ListV2LoggingLevels",
          "logs:DeleteV2LoggingLevels"
        ],
        resources: [IoTLogGroup.logGroupArn]
      }));

    loggingRole.node.addDependency(IoTLogGroup);
    loggingRole.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // IAM role to enable Lambda functions, Grafana and allow CloudWatch datasource to Grafana
    const grafanaRole = new CfnRole(this, `${ConfigParams.appName}--Grafana-Role`, {
      assumeRolePolicyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Sid: "",
            Principal: {
              Service: ["grafana.amazonaws.com", "lambda.amazonaws.com"]
            }
          }
        ]
      },
      policies: [{
        policyName: "GrafanaRole",
        policyDocument: {
          Version: "2012-10-17",
          Statement: [{
            Sid: "AllowReadingMetricsFromCloudWatch",
            Effect: "Allow",
            Action: [
              "cloudwatch:DescribeAlarmsForMetric",
              "cloudwatch:DescribeAlarmHistory",
              "cloudwatch:DescribeAlarms",
              "cloudwatch:ListMetrics",
              "cloudwatch:GetMetricStatistics",
              "cloudwatch:GetMetricData"
            ],
            Resource: "*"
          },
          {
            Sid: "AllowReadingLogsFromCloudWatch",
            Effect: "Allow",
            Action: [
              "logs:DescribeLogGroups",
              "logs:GetLogGroupFields",
              "logs:StartQuery",
              "logs:StopQuery",
              "logs:GetQueryResults",
              "logs:GetLogEvents"
            ],
            Resource: "*"
          },
          {
            Sid: "AllowReadingTagsInstancesRegionsFromEC2",
            Effect: "Allow",
            Action: [
              "ec2:DescribeTags",
              "ec2:DescribeInstances",
              "ec2:DescribeRegions"
            ],
            Resource: "*"
          },
          {
            Sid: "AllowReadingResourcesForTags",
            Effect: "Allow",
            Action: "tag:GetResources",
            Resource: "*"
          },
          {
            Sid: "AllowLoggingForLambdaFunctions",
            Effect: "Allow",
            Action: [
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents"
            ],
            Resource: "*"
          },
          {
            Sid: "AWSGrafanaOrganizationAdmin",
            Effect: "Allow",
            Action: ["iam:ListRoles"],
            Resource: "*"
          },
          {
            Sid: "GrafanaIAMGetRolePermission",
            Effect: "Allow",
            Action: "iam:GetRole",
            Resource: "arn:aws:iam::*:role/*"
          },
          {
            Sid: "AWSGrafanaPermissions",
            Effect: "Allow",
            Action: [
              "grafana:CreateWorkspace",
              "grafana:CreateWorkspaceApiKey",
              "grafana:DeleteWorkspace",
              "grafana:DeleteWorkspaceApiKey",
              "grafana:UpdateWorkspace"
            ],
            Resource: "*"
          },
          {
            Sid: "GrafanaIAMPassRolePermission",
            Effect: "Allow",
            Action: "iam:PassRole",
            Resource: "arn:aws:iam::*:role/*",
            Condition: {
              StringLike: {
                "iam:PassedToService": "grafana.amazonaws.com"
              }
            }
          }]
        }
      }]
    });
    grafanaRole.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // filter 'PlantData' MQTT messages to Cloudwatch logs
    const topic_rule = new CfnTopicRule(this, "iot_to_cloudwatch_topic_rule", {
      topicRulePayload: {
        actions: [{
          cloudwatchLogs: {
            logGroupName: IoTLogGroup.logGroupName,
            roleArn: loggingRole.roleArn,
            batchMode: false,
          }
        }],
        sql: "SELECT * FROM 'PlantData'"
      }
    });
    topic_rule.node.addDependency(loggingRole);
    topic_rule.node.addDependency(IoTLogGroup);
    topic_rule.applyRemovalPolicy(RemovalPolicy.DESTROY);

    const dashboard = new CloudWatchDashboard(this, `${ConfigParams.appName}--Dashboard`, {
      dashboardName: `${ConfigParams.appName}--Dashboard`,
      periodOverride: PeriodOverride.AUTO,
      widgets: [[]],
    });

    const snsTopic = new Topic(this, `${ConfigParams.appName}--SnsTopic`, {
      displayName: `${ConfigParams.appName}--SnsTopic`,
      fifo: false
    });

    snsTopic.addSubscription(new EmailSubscription(ConfigParams.email));

    for (var sensor of ConfigParams.sensors) {
      const metricFilter = new MetricFilter(this, `${ConfigParams.appName}--${sensor}MetricFilter`, {
        logGroup: IoTLogGroup,
        metricNamespace: `${ConfigParams.appName}--Metrics`,
        metricName: `${sensor}Metric`,
        filterPattern: FilterPattern.exists(`$.${sensor}`),
        metricValue: `$.${sensor}`,
      });

      const metric = metricFilter.metric({ statistic: "minimum", period: Duration.minutes(5) });

      const metricWidget = new GraphWidget({
        height: ConfigParams.dashboard.widgetHeight,
        width: ConfigParams.dashboard.widgetWidth,
      });
      metricWidget.addLeftMetric(metric);
      dashboard.addWidgets(metricWidget);

      if (sensor == "waterLevel") {
        const waterLevelAlarm = new Alarm(this, `${ConfigParams.appName}--WaterLevelAlarm`, {
          metric,
          comparisonOperator: ComparisonOperator.LESS_THAN_THRESHOLD,
          threshold: ConfigParams.waterAlarm.threshold,
          datapointsToAlarm: ConfigParams.waterAlarm.datapointsToAlarm,
          evaluationPeriods: ConfigParams.waterAlarm.evaluationPeriods
        });

        waterLevelAlarm.addAlarmAction(new SnsAction(snsTopic));

        const alarmWidget = new AlarmWidget({
          height: ConfigParams.dashboard.widgetHeight,
          width: ConfigParams.dashboard.widgetWidth,
          alarm: waterLevelAlarm,
          title: "waterLevelAlarm"
        });
        dashboard.addWidgets(alarmWidget);
      }
    }

    const grafanaWorkspace = new CfnWorkspace(this, `${ConfigParams.appName}--GrafanaWorkspace`, {
      accountAccessType: 'CURRENT_ACCOUNT',
      authenticationProviders: ['AWS_SSO'],
      dataSources: ['CLOUDWATCH'],
      description: 'Amazon Grafana Workspace for Plant Environment',
      name: `${ConfigParams.appName}--GrafanaWorkspace`,
      permissionType: 'SERVICE_MANAGED',
      roleArn: grafanaRole.attrArn,
    });
    grafanaWorkspace.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // lambda function triggered on deployment for grafana API calls
    const grafanaLambda = new TriggerFunction(this, `${ConfigParams.appName}--GrafanaLambda`, {
      runtime: Runtime.NODEJS_18_X,
      code: Code.fromAsset('lib'),
      handler: 'plant_reference.handler',
      environment: {
        'workspaceId': grafanaWorkspace.attrId,
        'url': `https://${grafanaWorkspace.attrId}.grafana-workspace.${ConfigParams.env.region}.amazonaws.com`,
        'region': `${ConfigParams.env.region}`
     },
      role: Role.fromRoleArn(this, "LambdaRole", grafanaRole.attrArn),
      timeout: Duration.seconds(30)
    });
    grafanaLambda.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // add node-fetch as lambda layer
    grafanaLambda.addLayers(new LayerVersion(this, `${ConfigParams.appName}--GrafanaLambdaLayer`, {
      code: Code.fromAsset("lib/node-fetch.zip"),
      compatibleRuntimes: [Runtime.NODEJS_18_X]
    }));
  }
}