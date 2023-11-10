'use strict';

const { RekognitionClient, DetectModerationLabelsCommand } = require('@aws-sdk/client-rekognition');
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const bucket = process.env.BUCKET;
const region = process.env.REGION;

const rekognition = new RekognitionClient({
    region,
    credentials: process.env.ACCESS_KEY_ID ? {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
        sessionToken: process.env.SESSION_TOKEN
    } : null,
});

const s3 = new S3Client({
    region,
    credentials: process.env.ACCESS_KEY_ID ? {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
        sessionToken: process.env.SESSION_TOKEN
    } : null,
});

module.exports.handler = async (event, context) => {
    console.log('Inside content moderator function');

    for (let record of event.Records) {
        const { objectKey } = JSON.parse(record.body);
        try {
            await moderateContent(objectKey);
        } catch (err) {
            console.log(err);
            return context.fail(`Error moderating image ${objectKey}`);
        }
    }

    return context.succeed(`Moderated ${event.Records.length} image(s) successfully`);
};

async function moderateContent(objectKey) {
    const command = new DetectModerationLabelsCommand({
        Image: {
            S3Object: {
                Bucket: bucket,
                Name: objectKey,
            }
        },
        MinConfidence: 60,
    });

    const response = await rekognition.send(command);
    const labels = extractLabels(response);
    console.log(labels);

    if (labels.length > 0) {
        const deleteObjectCommand = new DeleteObjectCommand({
            Bucket: bucket,
            Key: objectKey,
        });

        await s3.send(deleteObjectCommand);

        console.log(`Object met gedetecteerde labels verwijderd uit de S3-bucket.`);
        return { success: false };
    }
    return { success: true };
}

function extractLabels(response) {
    return response.ModerationLabels.map(label => label.Name);
}