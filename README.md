# Qufei Search Engine — Final Project

This is a distributed, cloud-native search engine that supports file upload, inverted index construction, keyword search, and Top-N term frequency analytics.

### Technologies Used
- Google Kubernetes Engine (GKE)
- Kafka (Bitnami Helm Chart)
- Node.js + Express backend
- HTML/CSS/JavaScript frontend (static site)
- Docker
- Terraform (Infrastructure as Code)
- KafkaJS (Node client for Kafka)

---

## How to Run the Application

> Requirements before starting:
> - A Google Cloud account with billing enabled
> - `gcloud`, `kubectl`, `docker`, `terraform` installed
> - Enable GKE, Artifact Registry, and IAM APIs

---

## 1️ Clone the Repository

```bash
git clone https://github.com/your-username/qufei-search-engine.git
cd qufei-search-engine
```

---

## 2️ Set Your GCP Project & Region

Edit the `terraform/variables.tf` or export environment variables:

```bash
export GOOGLE_PROJECT_ID="your-gcp-project-id"
export GOOGLE_REGION="us-central1"
```

---

## 3️ Build & Push Backend Docker Image

```bash
cd backend
docker buildx build --platform linux/amd64 -t kafka-backend .
docker tag kafka-backend us-central1-docker.pkg.dev/YOUR_PROJECT_ID/kafka-backend-repo/kafka-backend:latest
gcloud auth configure-docker us-central1-docker.pkg.dev
docker push us-central1-docker.pkg.dev/YOUR_PROJECT_ID/kafka-backend-repo/kafka-backend:latest
```

Replace `YOUR_PROJECT_ID` with your actual GCP project ID.

---

## 4️ Deploy Infrastructure with Terraform

```bash
cd terraform
terraform init -upgrade
terraform apply -auto-approve
```

> This step creates:
> - GKE cluster
> - Kafka (via Helm)
> - Backend Deployment & Service (LoadBalancer)

---

## 5️ Get the Backend Service URL

```bash
kubectl get services
```

Copy the `EXTERNAL-IP` of the `kafka-backend-service` (port `3000`). Example:

```
http://34.122.38.150:3000
```
---

## 6️ Update the Frontend to Match Backend URL

In your frontend JavaScript file (`static/script.js`), update this line to point to your **GKE backend**:

```js
const BACKEND_URL = "http://34.122.38.150:3000"; // Replace with your backend service IP
```

> You can find the backend IP by running:
```bash
kubectl get services
```

---

## 7 Run the Frontend via Docker

Build the Docker image:

```bash
cd search_engine  
docker build -t search-frontend .
```

Then run the container:

```bash
docker run -p 8080:80 search-frontend
```

Your app will be live at: [http://localhost:8080](http://localhost:8080)

---



## Features

- Upload `.txt` files from frontend
- Build inverted index on backend
- Submit search queries → handled via Kafka
- Return results via polling `GET /result/:jobId`
- View Top-N frequent terms (`GET /top_n`)
- All processing is offloaded to GKE cluster

---

## Example Test Commands

```bash
curl -X POST -F 'file=@example.txt' http://<BACKEND-IP>:3000/upload
curl -X POST http://<BACKEND-IP>:3000/construct_indices
curl -X POST -H "Content-Type: application/json" -d '{"query":"hello"}' http://<BACKEND-IP>:3000/search
curl http://<BACKEND-IP>:3000/top_n
```

---

## Tear Down 

```bash
terraform destroy -auto-approve
```

---

## Authors

- Qufei Zhang

---

## Notes
- Kafka topic used: `search-requests`
- All uploaded files and inverted index are stored in memory during runtime
- Uncomment line 7 and 25 in backend/utils/inverted_index.js if you want to skip stop words! Sorry this was not included in the walkthroguh I hope it is intuitive!!! I didn't have time to make sure this feature 100% works since I just noticed it in the end, so please have mercy!
