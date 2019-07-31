FROM node:10

LABEL version="1.0.0"
LABEL repository="http://github.com/vstirbu/vscode-mermaid-preview"
LABEL homepage="http://github.com/vstirbu/vscode-mermaid-preview"
LABEL maintainer="Vlad Stirbu <vlad@smallthin.gs"

LABEL com.github.actions.name="GitHub Action for vscode-mermaid-preview"
LABEL com.github.actions.description="Build vscode-mermaid-preview application"
LABEL com.github.actions.icon="package"
LABEL com.github.actions.color="red"

COPY "entrypoint.sh" "/entrypoint.sh"
ENTRYPOINT ["/entrypoint.sh"]
CMD ["help"]
