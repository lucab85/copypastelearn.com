FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      python3 \
      python3-pip \
      python3-apt \
      sshpass \
      openssh-client \
      && pip3 install --no-cache-dir ansible && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

CMD ["bash"]
