import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as PlantReference from '../lib/plant_reference-stack';
import { ConfigParams } from '../config-params';

test('IoT Topic Rule Created', () => {
  const app = new cdk.App();
  const stack = new PlantReference.PlantReferenceStack(app, 'TestStack');
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::IoT::TopicRule', {
    TopicRulePayload: {
      Sql: "SELECT * FROM 'PlantData'"
    }
  });
});

test('SNS Topic Created', () => {
  const app = new cdk.App();
  const stack = new PlantReference.PlantReferenceStack(app, 'TestStack');
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::SNS::Topic', {
    DisplayName: `${ConfigParams.appName}--SnsTopic`,
    FifoTopic: false
  });
});

test('CloudWatch Dashboard Created', () => {
  const app = new cdk.App();
  const stack = new PlantReference.PlantReferenceStack(app, 'TestStack');
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
    DashboardName: `${ConfigParams.appName}--Dashboard`
  });
});

test('WaterLevel Alarm Created', () => {
  const app = new cdk.App();
  const stack = new PlantReference.PlantReferenceStack(app, 'TestStack');
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::CloudWatch::Alarm', {
    ComparisonOperator: "LessThanThreshold",
    EvaluationPeriods: ConfigParams.waterAlarm.evaluationPeriods,
    DatapointsToAlarm: ConfigParams.waterAlarm.datapointsToAlarm,
    MetricName: "waterLevelMetric",
    Namespace: `${ConfigParams.appName}--Metrics`,
    Statistic: "Minimum",
    Threshold: ConfigParams.waterAlarm.threshold
  });
});

test('Grafana Workspace Created', () => {
  const app = new cdk.App();
  const stack = new PlantReference.PlantReferenceStack(app, 'TestStack');
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::Grafana::Workspace', {
    AccountAccessType: 'CURRENT_ACCOUNT',
    AuthenticationProviders: ['AWS_SSO'],
    DataSources: ['CLOUDWATCH'],
    Description: 'Amazon Grafana Workspace for Plant Environment',
    Name: `${ConfigParams.appName}--GrafanaWorkspace`,
    PermissionType: 'SERVICE_MANAGED'
  });
});
