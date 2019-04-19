---
title: Zoom and pan
status: implemented
issue: 44
---

# Context

Complex mermaid diagrams tend to be larger than the size of the panel that displays the preview. The plugin scales the diagrams to fit the view but if a diagram is large enough the text becomes difficult to read.

# Decision

Add the ability to zoom and pan a diagram using d3 zoom.

# Consequences

Users are able to zoom and pan larger diagrams.
