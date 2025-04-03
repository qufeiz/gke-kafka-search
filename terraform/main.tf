provider "google" {
  project = var.project_id
  region  = var.region
}

provider "helm" {
  kubernetes {
    config_path = "~/.kube/config"
  }
}

provider "kubernetes" {
  config_path = "~/.kube/config"
}

resource "google_container_cluster" "primary" {
  name     = "search-cluster"
  location = var.region

  remove_default_node_pool = true
  initial_node_count       = 1
  deletion_protection      = false
}

resource "google_container_node_pool" "primary_nodes" {
  name       = "primary-node-pool"
  cluster    = google_container_cluster.primary.name
  location   = var.region
  node_count = 1

  node_config {
    machine_type = "e2-medium"
    disk_type    = "pd-standard"
    disk_size_gb = 30
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  }
}

resource "helm_release" "kafka" {
  name       = "kafka"
  repository = "https://charts.bitnami.com/bitnami"
  chart      = "kafka"
  version    = "22.1.2"
  namespace  = "default"

  depends_on = [
    google_container_cluster.primary,
    google_container_node_pool.primary_nodes
  ]

  set {
    name  = "replicaCount"
    value = "2"
  }

  set {
    name  = "zookeeper.replicaCount"
    value = "1"
  }

  set {
    name  = "auth.enabled"
    value = "false"
  }
}

resource "kubernetes_deployment" "backend" {
  metadata {
    name = "kafka-backend"
    labels = {
      app = "kafka-backend"
    }
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app = "kafka-backend"
      }
    }

    template {
      metadata {
        labels = {
          app = "kafka-backend"
        }
      }

      spec {
        container {
          name  = "kafka-backend"
          image = "us-central1-docker.pkg.dev/finalproject-455103/kafka-backend-repo/kafka-backend:v3"
          port {
            container_port = 3000
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "backend" {
  metadata {
    name = "kafka-backend-service"
  }

  spec {
    selector = {
      app = kubernetes_deployment.backend.metadata[0].labels.app
    }

    type = "LoadBalancer"

    port {
      port        = 3000
      target_port = 3000
    }
  }
}

