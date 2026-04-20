---
title: "Kubernetes Jobs and CronJobs Guide"
slug: "kubernetes-jobs-cronjobs-guide"
date: "2026-02-01"
category: "DevOps"
tags: ["Kubernetes", "Jobs", "CronJobs", "Batch", "DevOps"]
excerpt: "Run batch workloads in Kubernetes. Jobs, CronJobs, parallelism, backoff limits, TTL cleanup, and real-world patterns for data pipelines."
description: "Run batch workloads reliably in Kubernetes with Jobs and CronJobs. Parallelism settings, backoff policies, TTL cleanup, and data pipeline scheduling best practices."
---

Not everything in Kubernetes is a long-running service. Jobs handle one-off tasks (database migrations, backups, data processing) and CronJobs schedule them on a recurring basis.

## Jobs

### Basic Job

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migration
spec:
  template:
    spec:
      containers:
        - name: migrate
          image: my-app:latest
          command: ["python", "manage.py", "migrate"]
          envFrom:
            - secretRef:
                name: db-credentials
      restartPolicy: Never
  backoffLimit: 3
  ttlSecondsAfterFinished: 3600
```

| Field | Purpose |
|---|---|
| `backoffLimit` | Max retries before marking as failed |
| `ttlSecondsAfterFinished` | Auto-delete completed job after N seconds |
| `activeDeadlineSeconds` | Kill job if it runs too long |
| `restartPolicy` | `Never` (new pod) or `OnFailure` (restart same pod) |

### Parallel Jobs

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: process-data
spec:
  completions: 10      # Total tasks to complete
  parallelism: 3       # Run 3 pods at a time
  template:
    spec:
      containers:
        - name: processor
          image: data-processor:latest
          command: ["python", "process.py"]
      restartPolicy: Never
```

This runs 10 pod instances, 3 at a time, until all 10 complete.

### Indexed Jobs (K8s 1.24+)

Each pod gets a unique index:

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: indexed-process
spec:
  completionMode: Indexed
  completions: 5
  parallelism: 5
  template:
    spec:
      containers:
        - name: worker
          image: my-worker
          command: ["python", "process.py"]
          env:
            - name: JOB_INDEX
              valueFrom:
                fieldRef:
                  fieldPath: metadata.annotations['batch.kubernetes.io/job-completion-index']
      restartPolicy: Never
```

Each pod receives index 0-4 in `JOB_COMPLETION_INDEX` env var. Use for sharded processing.

## CronJobs

### Basic CronJob

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: nightly-backup
spec:
  schedule: "0 2 * * *"    # 2 AM daily
  timeZone: "Europe/Rome"
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 3
  startingDeadlineSeconds: 300
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: backup
              image: postgres:16-alpine
              command:
                - /bin/sh
                - -c
                - |
                  pg_dump -h $DB_HOST -U $DB_USER $DB_NAME | gzip > /backups/db-$(date +%Y%m%d).sql.gz
              envFrom:
                - secretRef:
                    name: db-credentials
              volumeMounts:
                - name: backups
                  mountPath: /backups
          volumes:
            - name: backups
              persistentVolumeClaim:
                claimName: backup-storage
          restartPolicy: OnFailure
      backoffLimit: 2
      ttlSecondsAfterFinished: 86400
```

### Concurrency Policies

| Policy | Behavior |
|---|---|
| `Allow` | Multiple jobs can run simultaneously (default) |
| `Forbid` | Skip new run if previous is still running |
| `Replace` | Kill running job and start new one |

### Common Schedules

```yaml
# Every 5 minutes
schedule: "*/5 * * * *"

# Hourly
schedule: "0 * * * *"

# Daily at midnight
schedule: "0 0 * * *"

# Weekly on Sunday at 3 AM
schedule: "0 3 * * 0"

# Monthly on the 1st at 4 AM
schedule: "0 4 1 * *"

# Every weekday at 9 AM
schedule: "0 9 * * 1-5"
```

## Real-World Patterns

### Database Backup with S3 Upload

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: db-backup-s3
spec:
  schedule: "0 */6 * * *"  # Every 6 hours
  concurrencyPolicy: Forbid
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: backup-sa  # IRSA for S3 access
          containers:
            - name: backup
              image: postgres:16-alpine
              command:
                - /bin/sh
                - -c
                - |
                  set -e
                  FILENAME="db-$(date +%Y%m%d_%H%M%S).sql.gz"
                  pg_dump -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" | gzip > "/tmp/$FILENAME"
                  aws s3 cp "/tmp/$FILENAME" "s3://my-backups/db/$FILENAME"
                  echo "Backup uploaded: $FILENAME"
              envFrom:
                - secretRef:
                    name: db-credentials
          restartPolicy: OnFailure
      backoffLimit: 2
```

### Data Pipeline

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: etl-pipeline
spec:
  template:
    spec:
      initContainers:
        - name: extract
          image: etl-tools
          command: ["python", "extract.py"]
          volumeMounts:
            - name: data
              mountPath: /data
        - name: transform
          image: etl-tools
          command: ["python", "transform.py"]
          volumeMounts:
            - name: data
              mountPath: /data
      containers:
        - name: load
          image: etl-tools
          command: ["python", "load.py"]
          volumeMounts:
            - name: data
              mountPath: /data
      volumes:
        - name: data
          emptyDir:
            sizeLimit: 10Gi
      restartPolicy: Never
  backoffLimit: 1
```

Init containers run sequentially: extract → transform → load.

## Monitoring Jobs

```bash
# List jobs
kubectl get jobs
kubectl get cronjobs

# Job status
kubectl describe job db-migration

# Pods created by a job
kubectl get pods -l job-name=db-migration

# Logs
kubectl logs job/db-migration

# Manual trigger of CronJob
kubectl create job manual-backup --from=cronjob/nightly-backup

# Suspend a CronJob
kubectl patch cronjob nightly-backup -p '{"spec":{"suspend":true}}'
```

## What's Next?

Our **MLflow for Kubernetes MLOps** course covers ML training jobs and data pipeline orchestration on Kubernetes. **Docker Fundamentals** teaches container basics. First lessons are free.
