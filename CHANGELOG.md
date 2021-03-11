# Changelog

## 1.6.1 / 2020-03-11

- pinned parcel-bundler
- updated publish workflow

## 1.6.0 / 2020-03-11

- support for mermaid metadata in [structured field values](https://www.rfc-editor.org/rfc/rfc8941.html) format
- upgraded mermaid version `8.9.1`

## 1.5.7 / 2020-11-16

- upgraded mermaid version `8.8.3`

## 1.5.6 / 2020-09-29

- added `minimap` setting documentation
- upgraded mermaid version `8.8.0`

## 1.5.5 / 2020-08-13

- removed `lodash` dependency

## 1.5.4 / 2020-08-13

- switched from using hardcoded `vscode-resource` scheme to `Webview.asWebviewUri`

## 1.5.3 / 2020-04-16

- updated mermaid

## 1.5.2 / 2020-04-16

- fixed the fixed azure devops regex

## 1.5.1 / 2020-03-12

- fixed azure devops regex

## 1.5.0 / 2019-12-30

- added configuration for controlling minimap visibility

## 1.4.0 / 2019-12-09

- added support for azure devops

## 1.3.1 / 2019-12-04

- fixed parse crash #91

## 1.3.0 / 2019-12-04

- added support form state diagrams and pie charts via mermaid@8.4
- publish workflow with actions

## 1.2.0 / 2019-08-07

- bring font-awesome icon handling on par with mermaid online editor

## 1.1.0 / 2019-08-05

- improved rendering customization/theme handling
- added configuration options

## 1.0.0 / 2019-08-01

- new preview app running in webview
- added preview app to publishing pipeline
- removed travis
- remove mermaid processing in builtin markdown previewer

## 0.12.2 / 2019-07-22

- updated mermaid (8.2.2)

## 0.12.1 / 2019-06-27

- updated mermaid
- added pipeline for publish on tag

## 0.12.0 / 2019-04-19

- added zoom and pan

## 0.11.2 / 2019-03-29

- center vertically graph diagrams
- added extension pack containing: [syntax highlighting](https://marketplace.visualstudio.com/items?itemName=bpruitt-goddard.mermaid-markdown-syntax-highlighting)

## 0.11.1 / 2019-03-11

- fixed peer dependencies

## 0.11.0 / 2019-03-11

- transitioned from htmlPreview to webview
- rerender on configuration change
- apply user provided custom theme

## 0.10.2 / 2018-12-10

- added link to mermaid website.

## 0.10.1 / 2018-05-31

- fixed loop text style in sequence diagrams
- updated mermaid 8.0.0-rc8

## 0.10.0 / 2018-05-26

- added sphinx directive support

## 0.9.0 / 2018-05-23

- added hugo shortcodes support

## 0.8.3 / 2018-02-09

- added Mermaid language contribution

## 0.8.2 / 2017-11-25

- added a minimap of the diagram

## 0.8.1 / 2017-11-25

- flowcharts can be scrolled horisontally if diagram wider than pane
- reverted pan and zoom as is not working well on retina displays

## 0.8.0 / 2017-11-25

- added pan and zoom support for the rendered diagram

## 0.7.0 / 2017-11-08

- Support for standalone Mermaid files .mmd [iiska](https://github.com/iiska)

## 0.6.0 / 2017-09-18

- added preliminary support for previewing mermaid diagrams into default markdown previewer

## 0.5.4 / 2017-09-18

- fixed theme selection using new mermaid api

## 0.5.3 / 2017-09-14

- updated mermaid dependency v7.1.0

## 0.5.2 / 2017-09-12

- updated mermaid dependency v7.0.17

## 0.5.1 / 2017-08-21

- updated mermaid dependency v7.0.4

## 0.5.0 / 2017-06-30

- Added FontAwesome (4.7) support

## 0.4.4 / 2017-06-29

- Convert mermaid resource path to a file URL for OS compatibility [FrodgE](https://github.com/FrodgE)

## 0.4.3 / 2017-02-01

- update dependencies to mermaid 7.0.0

## 0.4.2 / 2016-11-24

- made arrowhead fix a configuration extension.
- fixed #13

## 0.4.1 / 2016-09-09

- render arrowheads (#2)

## 0.4.0 / 2016-07-08

- added support for dark theme

## 0.3.1 / 2016-06-14

- throttle preview update

## 0.3.0 / 2016-05-26

- added support for diagrams inside markdown fenced block

## 0.2.0 / 2106-05-19

- added diagram customization

## 0.1.0 / 2016-05-14

- preview diagram (light theme)
