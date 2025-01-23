PROJECT_ID = dcsc-435117
DOCKER_REGISTRY = gcr.io
IMAGE_TAG = latest
COMPOSE_FILE = docker-compose-gcp.yaml

build-backend:
	docker build -t $(DOCKER_REGISTRY)/$(PROJECT_ID)/backend:$(IMAGE_TAG) ./backend

build-frontend:
	docker build -t $(DOCKER_REGISTRY)/$(PROJECT_ID)/frontend:$(IMAGE_TAG) ./frontend

build-worker:
	docker build -t $(DOCKER_REGISTRY)/$(PROJECT_ID)/worker:$(IMAGE_TAG) ./backend

push-backend:
	docker push $(DOCKER_REGISTRY)/$(PROJECT_ID)/backend:$(IMAGE_TAG)

push-frontend:
	docker push $(DOCKER_REGISTRY)/$(PROJECT_ID)/frontend:$(IMAGE_TAG)

push-worker:
	docker push $(DOCKER_REGISTRY)/$(PROJECT_ID)/worker:$(IMAGE_TAG)

build:
	make build-backend
	make build-frontend
	make build-worker

push:
	make push-backend
	make push-frontend
	make push-worker

up:
	docker-compose -f $(COMPOSE_FILE) up

down:
	docker-compose -f $(COMPOSE_FILE) down

delete-volumes:
	docker-compose -f $(COMPOSE_FILE) down -v

clean:
	docker system prune -f