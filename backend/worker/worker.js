require('dotenv').config();
const fsExtra = require("fs-extra");
const path = require("path");
const redis = require("../client/redisClient");
const { storage, bucketName } = require("../client/gcsClient");

redis.chunkQueue.process(async (job) => {
  const { datasetId, fileName, chunkPath, chunkIndex } = job.data;

  try {
    console.log(`Processing chunk ${chunkIndex} of ${fileName}`);
    const fileExtension = path.extname(fileName);

    const chunkFileName = `${datasetId}/${path.basename(fileName, fileExtension)}-chunk-${chunkIndex}${fileExtension}`;

    await storage.bucket(bucketName).upload(chunkPath, {
      destination: `uploads/${chunkFileName}`,
    });
    console.log(`Uploaded chunk ${chunkIndex} of ${fileName}`);
    fsExtra.removeSync(chunkPath);
  } catch (err) {
    console.error(`Failed to process chunk ${chunkIndex}:`, err);
    throw err;
  }
});

redis.fileQueue.process(async (job) => {
  const { datasetId, recordId, fileName, uploadPath } = job.data;

  try {
    console.log(`Processing file ${fileName} - ${recordId} - ${uploadPath}`);
    const fileExtension = path.extname(fileName);
    console.log("fileExtension:", fileExtension);
    const uploadedFileName = `${datasetId}/${recordId}${fileExtension}`;

    await storage.bucket(bucketName).upload(uploadPath, {
      destination: `uploads/${uploadedFileName}`,
    });
    console.log(`Uploaded file  ${fileName} - ${recordId}`);
    fsExtra.removeSync(uploadPath);
  } catch (err) {
    console.error(`Failed to process file ${fileName} - ${recordId} - ${uploadPath}:`, err);
    throw err;
  }
});
