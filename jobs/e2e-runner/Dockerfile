FROM mcr.microsoft.com/playwright:v1.58.1-noble

USER root
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates unzip \
  && rm -rf /var/lib/apt/lists/*

USER pwuser
ENV BUN_INSTALL="/home/pwuser/.bun"
# Bun needs a writable temp directory during install.
ENV BUN_TMPDIR="/tmp/bun-tmp"
ENV PATH="$BUN_INSTALL/bin:$PATH"

# Keep Bun aligned with repo's packageManager version.
ARG BUN_VERSION="1.3.8"
RUN curl -fsSL https://bun.com/install | bash -s "bun-v${BUN_VERSION}" \
  && bun --version

WORKDIR /workspace
COPY --chown=pwuser:pwuser . .

RUN mkdir -p "$BUN_TMPDIR" && bun install --frozen-lockfile

ENV CI="true"
CMD ["bun", "run", "test:e2e"]
