#!/usr/bin/env node
import { App } from "aws-cdk-lib";
import { CardiganPlatformStack } from "../lib/cardigan-platform-stack";

const app = new App();

new CardiganPlatformStack(app, "CardiganPlatformStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? "us-east-1",
  },
});
