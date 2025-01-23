const fs = require("fs");
const path = require("path");
const redis = require("../client/redisClient");
const { storage, bucketName } = require("../client/gcsClient");
const databaseController = require("../controllers/databaseController");

// Function to chunk and upload each extracted file in binary mode
const uploadFileInChunks = async (filePath, fileName, datasetId) => {
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
    const fileSize = fs.statSync(filePath).size;
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, fileSize);

        // Read the chunk in binary mode using fs.readSync and Buffer
        const buffer = Buffer.alloc(end - start);
        const fd = fs.openSync(filePath, 'r');
        fs.readSync(fd, buffer, 0, buffer.length, start);
        fs.closeSync(fd);

        const fileExtension = path.extname(fileName);
        const chunkPath = path.join(
            __dirname,
            '..',
            'controllers',
            'uploads',
            `${datasetId}-${path.basename(fileName, fileExtension)}-chunk-${chunkIndex}${fileExtension}`
        );

        fs.writeFileSync(chunkPath, buffer);

        await redis.chunkQueue.add({
            datasetId,
            fileName,
            chunkPath,
            chunkIndex,
        });
    }
};

// Function to upload the file without chunking
const uploadFile = async (filePath, fileName, datasetId, recordId) => {
    try {
        const fileExtension = path.extname(fileName);

        const uploadPath = path.join(
            __dirname,
            '..',
            'controllers',
            'uploads',
            `${datasetId}-${path.basename(fileName, fileExtension)}${fileExtension}`
        );

        const buffer = fs.readFileSync(filePath);

        fs.writeFileSync(uploadPath, buffer);

        await redis.fileQueue.add({
            datasetId,
            recordId,
            fileName,
            uploadPath
        });

        console.log(`File added to queue successfully: ${uploadPath}`);
    } catch (error) {
        console.error('Error adding file to queue:', error);
        throw error;
    }
};

// Function to assemble the files from chunks
const assembleChunkedFiles = async (datasetId) => {
    try {
        const tempDir = path.join(__dirname, '..', "assembled-images", datasetId);

        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const [files] = await storage.bucket(bucketName).getFiles({ prefix: `uploads/${datasetId}/` });
        const fileChunks = {};

        for (const file of files) {
            console.log("Object found:", file.name);
            const match = file.name.match(/(.+)-chunk-(\d+)\.([a-zA-Z0-9/-]+)/);
            if (match) {
                const baseName = match[1];
                const chunkIndex = parseInt(match[2]);
                const fileExtension = match[3];

                if (!fileChunks[baseName]) {
                    fileChunks[baseName] = { extension: fileExtension, chunks: [] };
                }

                fileChunks[baseName].chunks.push({ file, chunkIndex });
            }
        }

        const storageDir = path.join(__dirname, '..', "assembled-images");
        const finalFiles = [];
        for (const [baseNameWithPrefix, { extension, chunks }] of Object.entries(fileChunks)) {
            const baseName = baseNameWithPrefix.replace(/^uploads\//, '');
            chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);

            const finalFilePath = path.join(storageDir, `${baseName}.${extension}`);
            const writeStream = fs.createWriteStream(finalFilePath);

            for (const { file } of chunks) {
                const tempChunkPath = path.join(tempDir, path.basename(file.name));
                if (fs.existsSync(tempChunkPath)) {
                    console.log("Chunk already exists:", tempChunkPath);
                } else {
                    console.log("Downloading chunk:", file.name);
                    await file.download({ destination: tempChunkPath });
                }
                const chunkData = await fs.promises.readFile(tempChunkPath);

                writeStream.write(chunkData);
                fs.rmSync(tempChunkPath);
            }

            writeStream.end();
            finalFiles.push(finalFilePath);
        }

        console.log("Final files assembled:", finalFiles);
        return finalFiles;
    } catch (error) {
        console.error("Error assembling files:", error);
        throw error;
    }
};

const assembleFiles = async (datasetId, annotatorId) => {
    try {
        const tempDir = path.join(__dirname, '..', "assembled-images", datasetId);
        console.log("Temp dir:", tempDir);

        if (!fs.existsSync(tempDir)) {
            console.log("Creating temp dir:", tempDir);
            fs.mkdirSync(tempDir, { recursive: true });
        }

        console.log("Fetching files from GCS:", datasetId);
        const [files] = await storage.bucket(bucketName).getFiles({ prefix: `uploads/${datasetId}/` });
        console.log("Files found:", files.length);
        const finalFiles = [];

        if (annotatorId) {
            console.log("Fetching records for annotator:", annotatorId, datasetId);
            const records = await databaseController.getRecordsOfAnnotator(datasetId, annotatorId);
            for (const record of records) {
                const file = files.find((f) => f.name.startsWith(`uploads/${datasetId}/${record.id}`) && /\.[a-zA-Z0-9]+$/.test(f.name));
                console.log("Object found:", file?.name);
                if (file) {
                    const fileExtension = path.extname(file.name);
                    const filePath = path.join(tempDir, `${record.id}${fileExtension}`);
                    if (fs.existsSync(filePath)) {
                        console.log("File already exists:", filePath);
                    } else {
                        console.log("Downloading file:", file.name);
                        await file.download({ destination: filePath });
                    }
                    const recordItem = {
                        ...record,
                        filePath: filePath,
                    }
                    finalFiles.push(recordItem);
                }
            }
        } else {
            console.log("Fetching all records for dataset:", datasetId);
            const records = await databaseController.getRecordsOfDataset(datasetId);
            for (const file of files) {
                console.log("Object found:", file.name);
                const match = file.name.match(/^uploads\/[^/]+\/(.+)\.([a-zA-Z0-9/-]+)/);
                if (match) {
                    const baseName = match[1];
                    console.log("Base name:", baseName);
                    const fileExtension = match[2];
                    const filePath = path.join(tempDir, `${baseName}.${fileExtension}`);

                    if (fs.existsSync(filePath)) {
                        console.log("File already exists:", filePath);
                    } else {
                        console.log("Downloading file:", file.name);
                        await file.download({ destination: filePath });
                    }
                    const recordItem = records.find((r) => r.id === baseName);
                    if (recordItem) {
                        recordItem.filePath = filePath;
                        finalFiles.push(recordItem);
                    }
                }
            }
        }

        console.log("Final files assembled:", finalFiles);
        return finalFiles;
    } catch (error) {
        console.error("Error assembling files:", error);
        throw error;
    }
};

module.exports = { 
    uploadFileInChunks, 
    uploadFile, 
    assembleChunkedFiles,
    assembleFiles
 };