#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { KrishiStack } from '../lib/krishi-stack';

const app = new cdk.App();
new KrishiStack(app, 'KrishiNetStack', {
  /* Pass props like env if desired */
});
