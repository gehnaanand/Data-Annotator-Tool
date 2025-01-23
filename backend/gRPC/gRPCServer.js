const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const fs = require('fs');
const path = require('path');

const PROTO_PATH = path.join(__dirname, 'upload.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const uploaderProto = grpc.loadPackageDefinition(packageDefinition).uploader;

const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);


const uploadZipFile = (call, callback) => {
  const filePath = path.join(UPLOAD_DIR, call.metadata.get('filename')[0]);
  const writeStream = fs.createWriteStream(filePath);

  call.on('data', (chunk) => {
    writeStream.write(chunk.file_chunk);
  });

  call.on('end', () => {
    writeStream.end();
    callback(null, { message: 'File uploaded successfully!' });
  });

  call.on('error', (err) => {
    console.error('Upload failed:', err);
    callback(err);
  });
};

const server = new grpc.Server();
server.addService(uploaderProto.FileUploader.service, { UploadZipFile: uploadZipFile });

const PORT = 50051;
server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
  if (err) {
    console.error('Failed to start server:', err);
    return;
  }
  console.log(`gRPC server running on port ${port}`);
  server.start();
});