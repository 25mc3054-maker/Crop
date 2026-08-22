const { DynamoDBClient, CreateTableCommand, ListTablesCommand } = require('@aws-sdk/client-dynamodb');

async function createTables() {
  // Only run if DYNAMODB_ENDPOINT is set (typically for local dev)
  if (!process.env.DYNAMODB_ENDPOINT) {
    return;
  }

  const dynamodb = new DynamoDBClient({
    endpoint: process.env.DYNAMODB_ENDPOINT,
    region: process.env.AWS_REGION || 'us-east-1',
  });

  const tables = [
    {
      TableName: process.env.USERS_TABLE || 'Users',
      KeySchema: [{ AttributeName: 'phone', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'phone', AttributeType: 'S' }],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
    },
    {
      TableName: process.env.ORDERS_TABLE || 'Orders',
      KeySchema: [{ AttributeName: 'orderId', KeyType: 'HASH' }],
      AttributeDefinitions: [
        { AttributeName: 'orderId', AttributeType: 'S' },
        { AttributeName: 'phone', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: process.env.ORDERS_PHONE_INDEX || 'PhoneIndex',
          KeySchema: [{ AttributeName: 'phone', KeyType: 'HASH' }],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
        }
      ],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
    },
    {
      TableName: process.env.FORUM_TABLE || 'Forum',
      KeySchema: [{ AttributeName: 'postId', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'postId', AttributeType: 'S' }],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
    },
    {
      TableName: process.env.NOTIFICATIONS_TABLE || 'Notifications',
      KeySchema: [
        { AttributeName: 'phone', KeyType: 'HASH' },
        { AttributeName: 'timestamp', KeyType: 'RANGE' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'phone', AttributeType: 'S' },
        { AttributeName: 'timestamp', AttributeType: 'S' }
      ],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
    }
    ,
    {
      TableName: process.env.APPLICATIONS_TABLE || 'Applications',
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }, { AttributeName: 'schemeId', AttributeType: 'S' }],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
    }
  ];

  console.log('Waiting for DynamoDB Local to be ready...');
  let retries = 10;
  while (retries > 0) {
    try {
      await dynamodb.send(new ListTablesCommand({}));
      break;
    } catch (err) {
      console.log(`DynamoDB not ready yet, retrying... (${retries})`);
      retries--;
      await new Promise(res => setTimeout(res, 2000));
    }
  }

  for (const table of tables) {
    try {
      await dynamodb.send(new CreateTableCommand(table));
      console.log(`Table ${table.TableName} created.`);
    } catch (err) {
      if (err.name === 'ResourceInUseException') {
        console.log(`Table ${table.TableName} already exists.`);
      } else {
        console.error(`Error creating table ${table.TableName}:`, err.message);
      }
    }
  }
}

module.exports = createTables;