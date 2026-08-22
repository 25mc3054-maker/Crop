const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  // Only run on actual confirmation
  if (event.triggerSource === "PostConfirmation_ConfirmSignUp") {
    const tableName = process.env.USERS_TABLE;
    const { userAttributes } = event.request;
    
    const item = {
      phone: userAttributes.phone_number,
      name: userAttributes.name || "",
      village: "",
      language: "hi", // Default language
      createdAt: new Date().toISOString()
    };

    try {
      await docClient.send(new PutCommand({ TableName: tableName, Item: item }));
      console.log(`User ${item.phone} added to DynamoDB`);
    } catch (err) {
      console.error("Error adding user to DynamoDB", err);
    }
  }
  return event;
};