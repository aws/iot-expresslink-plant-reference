import { Stack , StackProps, RemovalPolicy, Duration }  from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Dashboard, PeriodOverride, GraphWidget, Alarm, ComparisonOperator, AlarmWidget } from 'aws-cdk-lib/aws-cloudwatch';
import { SnsAction } from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Role, ServicePrincipal, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam'
import { LogGroup, MetricFilter, FilterPattern } from "aws-cdk-lib/aws-logs";
import { CfnTopicRule } from "aws-cdk-lib/aws-iot";
import { Topic } from "aws-cdk-lib/aws-sns";
import { EmailSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import { ConfigParams } from '../config-params';

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

    const dashboard = new Dashboard(this, `${ConfigParams.appName}--Dashboard`, {
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
  }
}