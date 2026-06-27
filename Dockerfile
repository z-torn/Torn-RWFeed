# ==========================================
# Stage 1: Build and Compile everything from scratch
# ==========================================
FROM ubuntu:24.04 AS builder

ENV DEBIAN_FRONTEND=noninteractive

# Expanded toolchain packages to fully satisfy libpq autoconf/generation steps
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    gnupg \
    git \
    build-essential \
    cmake \
    ninja-build \
    tar \
    unzip \
    zip \
    pkg-config \
    linux-libc-dev \
    python3 \
    python3-pip \
    autoconf \
    automake \
    libtool \
    bison \
    flex \
    gperf \
    gettext \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the source files provided by Render
COPY . .

# CHANGED: Safely wipe the directory so git clone has a clean slate
RUN rm -rf vcpkg

# CHANGED: Fetch vcpkg using a shallow git clone (extremely reliable on cloud builders)
RUN git clone --depth=1 https://github.com/microsoft/vcpkg.git ./vcpkg

# Bootstrap the compiled runtime executable for vcpkg
RUN chmod +x ./vcpkg/bootstrap-vcpkg.sh && ./vcpkg/bootstrap-vcpkg.sh

# Run the project presets (Unsetting the build proxies to prevent vcpkg curl download failures)
RUN unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy && \
    cmake --preset ninja-multi && \
    cmake --build --preset build-release


# ==========================================
# Stage 2: Tiny Runtime Environment for Render
# ==========================================
FROM ubuntu:24.04 AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libpq5 \
    libssl3 \
    libstdc++6 \
    libcurl4t64 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/local/bin

# ---------------------------------------------------------
# Tell the app where the assets live in THIS container
# ---------------------------------------------------------
ENV OATPP_SWAGGER_RES_PATH="/usr/local/bin/libs/oatpp-swagger/res"
ENV SQL_FILE_PATH="/usr/local/bin/src/db/sql/"

# Copy target output from the actual compiled directory
COPY --from=builder /app/builds/ninja-multi/Release/torn_rw_feed /usr/local/bin/torn_rw_feed

# Copy assets and static dependency schemas
COPY --from=builder /app/libs/oatpp-swagger/res /usr/local/bin/libs/oatpp-swagger/res
COPY --from=builder /app/src/db/sql /usr/local/bin/src/db/sql

RUN chmod +x /usr/local/bin/torn_rw_feed

EXPOSE 8000
ENTRYPOINT ["/usr/local/bin/torn_rw_feed"]