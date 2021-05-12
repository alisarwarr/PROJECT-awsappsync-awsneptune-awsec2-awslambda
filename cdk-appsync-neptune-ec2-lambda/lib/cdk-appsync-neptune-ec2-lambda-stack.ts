import * as cdk from '@aws-cdk/core';
import * as appsync from '@aws-cdk/aws-appsync';
import * as lambda from '@aws-cdk/aws-lambda';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as neptune from '@aws-cdk/aws-neptune';


export class CdkAppsyncNeptuneEc2LambdaStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);



    //APPSYNC's API gives you a graphqlApi with apiKey ( for deploying APPSYNC )
    const api = new appsync.GraphqlApi(this, 'graphlApi', {
      name: 'netuneapp-api',
      schema: appsync.Schema.fromAsset('graphql/schema.gql'),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY
        }
      }
    });



    //creating VirtualPrivateCloud
    const appVpc = new ec2.Vpc(this, 'appVpc');



    //creating lambdafunction
    const appLambda = new lambda.Function(this, 'appLambda', {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'index.handler',
      //giving VPC
      vpc: appVpc
    });



    //setting lambdafunction ( as a datasource of endpoint )
    const lambda_datasource = api.addLambdaDataSource('LamdaDataSource', appLambda);



    //describing resolver for datasource
    lambda_datasource.createResolver({
      typeName: "Mutation",
      fieldName: "createPost"
    });
    lambda_datasource.createResolver({
      typeName: "Query",
      fieldName: "listPosts"
    });



//**************************NEPTUNE**************************/
    //creating NEPTUNE database cluster
    const cluster = new neptune.DatabaseCluster(this, 'Database', {
      vpc: appVpc,
      instanceType: neptune.InstanceType.R5_LARGE
    });


    //to control who can access the cluster
    //( any conection in this VPC can access NEPTUNE database cluster, so lambdafunction in VPC can use it )
    cluster.connections.allowDefaultPortFromAnyIpv4('Open to the world');
  

    //endpoints for write access NEPTUNE database cluster 
    const writeAddress = cluster.clusterEndpoint.socketAddress;
    //endpoints for read access NEPTUNE database cluster 
    const readAddress = cluster.clusterReadEndpoint.socketAddress;
//**************************NEPTUNE**************************/



    //adding env to lambdafunction
    appLambda.addEnvironment('WRITE_ADDRESS', writeAddress);
    appLambda.addEnvironment('READ_ADDRESS', readAddress);



    //print on console after deploy
    new cdk.CfnOutput(this, 'writeAddress', {
      value: writeAddress
    });
    new cdk.CfnOutput(this, 'readAddress', {
      value: readAddress
    });
  }
}
