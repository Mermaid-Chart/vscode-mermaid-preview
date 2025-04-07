import { diagramSamples } from "./constants";
interface DiagramInfo {
    name: string;
    code: string;
  }

  export const allDiagrams:  readonly DiagramInfo[] = [
    {
      name: 'Flowchart',
      code: diagramSamples.DefaultDiagramCode,
    },
    {
      name: 'Class',
      code: diagramSamples.ClassDiagram,
    },
    {
      name: 'Sequence',
      code: diagramSamples.SequenceDiagram,
    },
    {
      name: 'State',
      code: diagramSamples.StateDiagram,
    },
    {
      name: 'Architecture',
      code: diagramSamples.ArchitectureDiagram,
    },
    {
      name: 'Block',
      code: diagramSamples.BlockDiagram,
    },
    {
      name: 'C4',
      code: diagramSamples.C4Diagram,
    },
    {
      name: 'ER',
      code: diagramSamples.ERDiagram,
    },
    {
      name: 'Gantt',
      code: diagramSamples.GanttChart,
    },
    {
      name: 'Git',
      code: diagramSamples.GitDiagram,
    },
    {
      name: 'Kanban',
      code: diagramSamples.KanbanDiagram,
    },
    {
      name: 'Mindmap',
      code: diagramSamples.MindmapDiagram,
    },
    {
      name: 'Packet',
      code: diagramSamples.PacketDiagram,
    },
    {
      name: 'Pie',
      code: diagramSamples.PieChart,
    },
    {
      name: 'Quadrant',
      code: diagramSamples.QuadrantDiagram,
    },
    {
      name: 'Requirement',
      code: diagramSamples.RequirementDiagram,
    },
    {
      name: 'Sankey',
      code: diagramSamples.SankeyDiagram,
    },
    {
      name: 'Timeline',
      code: diagramSamples.TimelineDiagram,
    },
    {
      name: 'User Journey',
      code: diagramSamples.UserJourneyDiagram,
    },
    {
      name: 'XY',
      code: diagramSamples.XYDiagram,
    },
  ] as const;

  