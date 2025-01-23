# Data Annotator Tool

The goal of this project was to create a platform where researchers and crowd workers can collaborate and annotate different types of datasets. The Data Annotator Tool is designed to establish a robust and user-friendly collaborative platform that streamlines the data labeling process for various stakeholders. The primary objective is to enable clients, who are the data owners, to upload volumes of unlabelled data, including images, text, and audio datasets. This platform supports the entire data annotation lifecycle, starting from the moment data is uploaded to the completion of its labeling process.


To manage these large datasets effectively, the uploaded data will be systematically divided into multiple records, each representing a manageable subset of the data. The subdivision facilitates parallel processing, allowing for the simultaneous allocation of annotation tasks to multiple annotators. Annotators, who are individuals or teams responsible for data labeling, will populate the records with relevant tags, classifications, or labels as specified by the data owners. This customization ensures that the labels align with the specific use cases and requirements of the client.


Additionally, a key goal is to provide advanced features that improve the annotation process. The platform also prioritizes data security and efficient storage solutions, ensuring that sensitive client data remains protected at all times. Furthermore, the tool promotes real-time collaboration among the annotators. Annotators and data owners can communicate seamlessly within the platform to resolve ambiguities, discuss task-related issues, or provide feedback. By integrating these features, the Data Annotator Tool aims to become a comprehensive and efficient solution for large-scale data labeling, catering to a variety of industries and use cases.




This project is a multi-container Dockerized application designed for efficient deployment and scalability. It includes backend, frontend, and worker services. These services interact with Redis and MySQL, and the backend integrates with Google Cloud Storage (GCS) for handling file uploads.

---

## Setup Requirements

### Generate Service Credentials
- Create a service account and generate `service-credentials.json` file on GCP by following [these instructions](https://developers.google.com/workspace/guides/create-credentials)..
- Store it in the `credentials/` folder under the same name in the project's root directory.

### Generate JWT Secret
Run the following command to generate a JWT secret:
```bash
node generateJWTSecret.js
```

---

## Local Setup

### Backend Configuration
Add a `.env` file inside the `backend` folder with the following variables:
```
SERVER_PORT=4000

REDIS_HOST=localhost
REDIS_PORT=6379

MYSQL_HOST=localhost
MYSQL_USER=rootuser
MYSQL_PASSWORD=rootpass123
MYSQL_DB=data_annotator_db

GOOGLE_APPLICATION_CREDENTIALS=../credentials/service-credentials.json
GCS_BUCKET_NAME="data-annotator-bucket"

BCRYPT_SALT_ROUNDS=10
JWT_SECRET=<your-JWT-secret>
JWT_EXPIRATION=1h
```

### Frontend Configuration
Add a `.env` file inside the `frontend` folder with:
```
REACT_APP_SERVER_HOST=http://localhost:4000
```

### Database Setup
Add `setup_db.sql` to the root project directory with the following:
```sql
CREATE DATABASE IF NOT EXISTS data_annotator_db;
CREATE USER IF NOT EXISTS 'rootuser'@'%' IDENTIFIED BY 'rootpass123';
GRANT ALL PRIVILEGES ON data_annotator_db.* TO 'rootuser'@'%';
FLUSH PRIVILEGES;
```
Run the script to set up the database.

---

### Redis Setup
Run the following command to set up Redis using Docker Desktop:
```bash
docker run -d --name redis -p 6379:6379 redis
```
---
## Commands to Run the Project Locally

1. Run `setup_db.sql`.
2. Navigate to the `backend` folder and start the server:
   ```bash
   cd backend
   npm start
   ```
3. Open another terminal and start the worker:
   ```bash
   cd backend/worker
   node worker.js
   ```
4. Open another terminal and start the frontend:
   ```bash
   cd frontend
   npm start
   ```
5. Access the website at: `http://localhost:3000/`

---

## Cloud Setup

### Create a VM Instance on Google Cloud
1. Navigate to the [VM Instances page](https://console.cloud.google.com/compute/instances).
2. Click **Create Instance**.
3. Select a machine type (e.g., `e2-medium`).
4. Under **Boot disk**, select Ubuntu 22.04 LTS.
5. Enable HTTP and HTTPS traffic under firewall options.
6. Create the instance.

### Install Docker and Docker Compose on the VM
```bash
# Install Docker
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```
Verify Docker Compose installation:
```bash
docker-compose --version
```

### Authenticate GCP
```bash
gcloud auth configure-docker
gcloud auth login
gcloud config get-value project
gcloud config set project <your-project-id>
```

### Clone the Repository
```bash
git clone <git-repo-url>
```

### Add Environment Variables
Add `.docker_env` inside the `backend` folder:
```
SERVER_PORT=4000

REDIS_HOST=redis
REDIS_PORT=6379

MYSQL_HOST=mysql
MYSQL_USER=rootuser
MYSQL_PASSWORD=rootpass123
MYSQL_DB=data_annotator_db
MYSQL_ROOT_PASSWORD=rootpass123

GOOGLE_APPLICATION_CREDENTIALS=/app/credentials/service-credentials.json
GCS_BUCKET_NAME=data-annotator-bucket

BCRYPT_SALT_ROUNDS=10
JWT_SECRET=<your-JWT-secret>
JWT_EXPIRATION=1h
```
Add `.docker_env` inside the `frontend` folder:
```
REACT_APP_SERVER_HOST=http://<your-instance-ip>:4000
```

---

## Deployment Commands

### Build Docker Images
```bash
make build
```

### Push Docker Images to Google Container Registry
```bash
make push
```

### Run Containers
```bash
make up
```
## Containers Started 

1. **Backend**:
   - Handles API requests, interacts with MySQL and Redis, and integrates with GCS.
   - Exposed on port 4000.

2. **Frontend**:
   - Provides the user interface for interacting with the application.
   - Exposed on port 3000.

3. **Worker**:
   - Processes background tasks like file handling and annotation distribution.

4. **Redis**:
   - In-memory data structure store used for task queues and caching.
   - Exposed on port 6379.

5. **MySQL**:
   - Relational database to store application data.
   - Exposed on port 3308 (mapped from 3306).

---

Access the website at: `http://<your-instance-ip>:3000/`

### Stop Containers
```bash
make down
```

### Clean Docker System
```bash
make clean
```

---

## Local Docker Setup with Docker Desktop
Follow the same steps as above, but use `docker-compose.yaml` instead of `docker-compose-gcp.yaml`. The `docker-compose.yaml` file is designed for local development and references local environment variables, while `docker-compose-gcp.yaml` is tailored for deployment on Google Cloud Platform and uses GCP-specific configurations like `gcr.io` image registry and GCS credentials.

---
