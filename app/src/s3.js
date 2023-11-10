const { S3Client, GetObjectCommand, PutObjectCommand, SendMessageCommand } = require('@aws-sdk/client-s3');
const { readFileSync } = require('fs');

const { SQSClient, SendMessageCommand: SQSSendMessageCommand } = require('@aws-sdk/client-sqs');

const bucket = process.env.BUCKET;
const region = process.env.REGION;
const resizeQueueUrl = process.env.RESIZE_QUEUE_URL;
const moderationQueueUrl = process.env.MODERATION_QUEUE_URL;

const s3 = new S3Client({
  region,
  credentials: process.env.ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
        sessionToken: process.env.SESSION_TOKEN,
      }
    : null,
});

const resizeSQS = new SQSClient({
  region,
  credentials: process.env.ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
        sessionToken: process.env.SESSION_TOKEN,
      }
    : null,
});

const moderationSQS = new SQSClient({
  region,
  credentials: process.env.ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
        sessionToken: process.env.SESSION_TOKEN,
      }
    : null,
});

console.log(bucket);
console.log(region);
console.log('ACCESS_KEY_ID:', process.env.ACCESS_KEY_ID);
console.log('SECRET_ACCESS_KEY:', process.env.SECRET_ACCESS_KEY);
console.log('SESSION_TOKEN:', process.env.SESSION_TOKEN);

async function uploadToS3(filePath, key) {
  const putObjectCommand = new PutObjectCommand({
    Body: readFileSync(filePath),
    Bucket: bucket,
    ContentType: 'image/jpeg',
    Key: key,
  });
  console.log('Object naar S3 uploaden', bucket, key, filePath);
  await s3.send(putObjectCommand);

  const moderationMessage = {
    "objectKey": key,
  };
  console.log(moderationQueueUrl);
  const moderationSendMessageCommand = new SQSSendMessageCommand({
    QueueUrl: moderationQueueUrl,
    MessageBody: JSON.stringify(moderationMessage),
  });

  console.log('Bericht naar content-moderation SQS verzenden', JSON.stringify(moderationMessage));
  await moderationSQS.send(moderationSendMessageCommand);

  await new Promise((resolve) => setTimeout(resolve, 2000));

  const getObjectCommand = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  try {
    // Controleer of de objectkey al bestaat in de S3-bucket
    await s3.send(getObjectCommand);
    console.log('Object is in S3-bucket', bucket, key);
    const resizeMessage = {
      "objectKey": key,
      "sizes": "small,200x200",
      "quality": 85,
    };
    console.log(resizeQueueUrl);
    const resizeSendMessageCommand = new SQSSendMessageCommand({
      QueueUrl: resizeQueueUrl,
      MessageBody: JSON.stringify(resizeMessage),
    });
  
    console.log('Bericht naar image-resize SQS verzenden', JSON.stringify(resizeMessage));
    await resizeSQS.send(resizeSendMessageCommand);
  } catch (error) {
    if (error.name === 'NoSuchKey') {
      console.log('Object bestaat niet (meer) in S3-bucket', bucket, key);
    }
  }
}

async function downloadFromS3(key) {
  const getObjectCommand = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  console.log('Object ophalen van S3', bucket, key);

  try {
    const { Body } = await s3.send(getObjectCommand);
    return Body;
  } catch (error) {
    if (error.name === 'NoSuchKey') {
      console.log('Fout bij het ophalen van object uit S3: De opgegeven sleutel bestaat niet.', error);
    } else {
      console.log('Fout bij het ophalen van object uit S3:', error);
    }
    throw error;
  }
}


module.exports = {
  uploadToS3,
  downloadFromS3,
};
