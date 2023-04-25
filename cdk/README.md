
# Welcome to your CDK project! 

This section contains all the CDK code written in Typescript to create cloudwatch resources. The cdk template will create CloudWatch metrics, alarms, and a dashboard to display the current measurements collected by the peripherals.

## Configure Plant Demo

### CDK configuration
To configure the plant demo edit the `config-params.ts` file with the calibrated values for your device peripherals. To receive notifications when the plant is in the alarm state add your email to the email field.

### AWS account

Within you AWS account navigate to the IAM Identity Center and Enable in the "Enable IAM Identity Center" box. On the left navigate to User and click "Add User." Follow the steps to set the username, email, password, and name for the user. There is no need to add the user to a group. You may need to wait a few minutes to receive an email to set up the password for the user.

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

## Useful CDK commands

 * `cdk ls`          list all stacks in the app
 * `cdk synth`       emits the synthesized CloudFormation template
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk docs`        open CDK documentation

## [Accessing the Grafana Workspace](https://docs.aws.amazon.com/grafana/latest/userguide/AMG-working-with-Grafana-workspace.html)

After deploying the CDK template navigate to Amazon Grafana in your AWS account. Click on "All Workspaces" in the menu on the left side to find the Grafana Workspace that was created. Within the Authentication section, add the user that was created in the IAM Identity Center configuration. After doing this you should be able to login as this user to the grafana workspace.

To find the dashboard in the Grafana Workspace, click on "General/Home" in the upper left corner. From there you should find the dashboard listed.

## CDK documentation

* [CDK Developer Guide](https://docs.aws.amazon.com/cdk/latest/guide/work-with-cdk-typescript.html)  
* [Amazon CloudWatch Documentation](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html)