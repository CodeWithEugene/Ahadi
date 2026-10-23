# Ahadi's Omega agent: the published SingularityNET Omega image (prebuilt PeTTa, FAISS,
# embedder) with Omega's main branch source at a pinned commit copied over it (native LLM
# tool calling landed on main after v0.1.20), plus the Ahadi plugin and configuration.
ARG OMEGA_BASE=singularitynet/omega:v0.1.20
FROM ${OMEGA_BASE}

ARG OMEGA_REF=63a78265be9b8efc6e47cc39f3b4bc7a13e06ed5
ENV OMEGA_DIR=/PeTTa/repos/Omega

ADD https://github.com/singnet/Omega/archive/${OMEGA_REF}.tar.gz /tmp/omega.tar.gz
RUN mkdir -p /tmp/omega-src \
 && tar -xzf /tmp/omega.tar.gz --strip-components=1 -C /tmp/omega-src \
 && rm -rf /tmp/omega-src/memory \
 && cp -a /tmp/omega-src/. ${OMEGA_DIR}/ \
 && cp ${OMEGA_DIR}/run.metta /PeTTa/run.metta \
 && cp ${OMEGA_DIR}/proxy/* /opt/nginx/ && chown www-data:www-data /opt/nginx/* && chmod 0600 /opt/nginx/* \
 && echo "Omega main@${OMEGA_REF} on v0.1.20 image (Ahadi build)" > ${OMEGA_DIR}/version \
 && chmod 0444 ${OMEGA_DIR}/version \
 && chmod +x ${OMEGA_DIR}/entrypoint.sh ${OMEGA_DIR}/scripts/* \
 && rm -rf /tmp/omega-src /tmp/omega.tar.gz

COPY config/config.yaml config/plugins.yaml config/logging.conf ${OMEGA_DIR}/config/
COPY plugins/ahadi ${OMEGA_DIR}/plugins/ahadi
COPY memory/prompt.txt /opt/ahadi/prompt.txt
RUN rm -f ${OMEGA_DIR}/plugins/ahadi/ahadi.json \
 && for p in prompt prompt_Anthropic prompt_ASIOne prompt_ASICloud prompt_OpenRouter prompt_OpenAI prompt_OpenAIAPI; do \
      cp /opt/ahadi/prompt.txt ${OMEGA_DIR}/memory/$p.txt; done \
 && chown -R 65534:65534 ${OMEGA_DIR}/memory \
 && chmod -R a+rX ${OMEGA_DIR}/plugins/ahadi
