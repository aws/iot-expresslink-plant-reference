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
        DisplayName: "Plant-Enviornment--SnsTopic",
        FifoTopic: false
    });
  });

test('CloudWatch Dashboard Created', () => {
  const app = new cdk.App();
  const stack = new PlantReference.PlantReferenceStack(app, 'TestStack');
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
    DashboardName: "Plant-Enviornment--Dashboard"
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
        Namespace: "Plant-Enviornment--Metrics",
        Statistic: "Minimum",
        Threshold: ConfigParams.waterAlarm.threshold
    });
  });
