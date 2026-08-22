const { RekognitionClient, DetectLabelsCommand } = require("@aws-sdk/client-rekognition");
const client = new RekognitionClient({});

exports.handler = async (event) => {
  // Input from Step Function: { "bucket": "...", "key": "..." }
  const { bucket, key } = event;
  
  const command = new DetectLabelsCommand({
    Image: { S3Object: { Bucket: bucket, Name: key } },
    MaxLabels: 10,
    MinConfidence: 70
  });
  
  try {
    const response = await client.send(command);
    return { status: "success", labels: response.Labels, bucket, key };
  } catch (err) {
    console.error("Rekognition error:", err);
    throw err;
  }
};