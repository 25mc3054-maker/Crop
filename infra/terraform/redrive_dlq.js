const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require("@aws-sdk/client-sqs");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const sqs = new SQSClient({});
const sns = new SNSClient({});

exports.handler = async (event) => {
  const queueUrl = process.env.DLQ_URL;
  const topicArn = process.env.TOPIC_ARN;

  // Poll loop to process multiple messages (limit to avoid timeout)
  const maxLoops = 10; 
  let loops = 0;

  while (loops < maxLoops) {
    const { Messages } = await sqs.send(new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 2
    }));

    if (!Messages || Messages.length === 0) {
      console.log("DLQ is empty.");
      break;
    }

    for (const msg of Messages) {
      try {
        let content = msg.Body;
        // Attempt to unwrap SNS envelope if present
        try {
          const parsed = JSON.parse(msg.Body);
          if (parsed.Type === 'Notification' && parsed.Message) {
            content = parsed.Message;
          }
        } catch (e) { /* Not JSON or not SNS envelope */ }

        await sns.send(new PublishCommand({ TopicArn: topicArn, Message: content }));
        await sqs.send(new DeleteMessageCommand({ QueueUrl: queueUrl, ReceiptHandle: msg.ReceiptHandle }));
        console.log(`Redrived message ${msg.MessageId}`);
      } catch (err) {
        console.error(`Failed to redrive message ${msg.MessageId}`, err);
      }
    }
    loops++;
  }
  return { status: "Redrive cycle complete" };
};