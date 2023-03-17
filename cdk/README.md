
# Welcome to your CDK project! 

This section contains all the CDK code written in Typescript to create cloudwatch resources. The cdk template will create CloudWatch metrics, alarms, and a dashboard to display the current measurements collected by the peripherals.

## Configure Plant Demo

To configure the plant demo edit the `config-params.ts` file with the calibrated values for your device peripherals. To receive notifications when the plant is in the alarm state add your email to the email field.

## Running Plant Demo

To run the plant example, execute the following:

```
$ npm install -g aws-cdk
$ cd cdk
$ npm install
$ cdk deploy
```

Then, to dispose of the stack/s afterwards

```
$ cdk destroy
```

## Useful commands

 * `cdk ls`          list all stacks in the app
 * `cdk synth`       emits the synthesized CloudFormation template
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk docs`        open CDK documentation

## CDK documentation

*[CDK Developer Guide](https://docs.aws.amazon.com/cdk/latest/guide/work-with-cdk-typescript.html)
*[Amazon CloudWatch Documentation](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html)
