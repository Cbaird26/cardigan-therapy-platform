import {
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  type StackProps,
  aws_cloudtrail as cloudtrail,
  aws_cognito as cognito,
  aws_ec2 as ec2,
  aws_kms as kms,
  aws_logs as logs,
  aws_rds as rds,
  aws_s3 as s3,
} from "aws-cdk-lib";
import { Construct } from "constructs";

export class CardiganPlatformStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const phiKey = new kms.Key(this, "PhiKey", {
      enableKeyRotation: true,
      alias: "alias/cardigan-phi",
      description: "KMS key for Cardigan platform PHI data stores.",
    });

    const auditLogGroup = new logs.LogGroup(this, "AuditLogGroup", {
      encryptionKey: phiKey,
      retention: logs.RetentionDays.SIX_YEARS,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const documentsBucket = new s3.Bucket(this, "DocumentsBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      bucketKeyEnabled: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: phiKey,
      enforceSSL: true,
      versioned: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const vpc = new ec2.Vpc(this, "Vpc", {
      maxAzs: 2,
      natGateways: 1,
    });

    const database = new rds.DatabaseCluster(this, "Database", {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_16_6,
      }),
      credentials: rds.Credentials.fromGeneratedSecret("cardigan_admin"),
      defaultDatabaseName: "cardigan",
      deletionProtection: true,
      storageEncrypted: true,
      storageEncryptionKey: phiKey,
      backup: {
        retention: Duration.days(35),
      },
      writer: rds.ClusterInstance.serverlessV2("Writer"),
      readers: [rds.ClusterInstance.serverlessV2("Reader", { scaleWithWriter: true })],
      vpc,
    });

    const userPool = new cognito.UserPool(this, "UserPool", {
      selfSignUpEnabled: false,
      signInAliases: { email: true },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      deletionProtection: true,
      passwordPolicy: {
        minLength: 14,
        requireDigits: true,
        requireLowercase: true,
        requireUppercase: true,
        requireSymbols: true,
      },
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: false,
        otp: true,
      },
    });

    userPool.addClient("WebAppClient", {
      authFlows: {
        userSrp: true,
      },
      preventUserExistenceErrors: true,
    });

    const trail = new cloudtrail.Trail(this, "CloudTrail", {
      sendToCloudWatchLogs: true,
      cloudWatchLogGroup: auditLogGroup,
      encryptionKey: phiKey,
    });
    trail.addS3EventSelector([
      {
        bucket: documentsBucket,
      },
    ]);

    new CfnOutput(this, "DocumentsBucketName", { value: documentsBucket.bucketName });
    new CfnOutput(this, "DatabaseSecretArn", {
      value: database.secret?.secretArn ?? "database-secret-unavailable",
    });
    new CfnOutput(this, "UserPoolId", { value: userPool.userPoolId });
  }
}
