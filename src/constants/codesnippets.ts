
export interface sampleData {
    diagram: "flowchart" | "sequenceDiagram" | "classDiagram"|"Architecture"|"BlockDiagram"|"PieChart"|"GanttChart"|"Journey"|"StateDiagram"|"EntityRelationshipDiagram";
    name: string;
    completion?: string;
   
  }

export const getDiagramTemplates = (): sampleData[] => {
    return [
      {
        diagram: "flowchart",
        name: "Flowchart",
        completion: `graph TD;\n  A-->B;\n  A-->C;\n  B-->D;\n  C-->D;`, 
      },
      {
        diagram: "sequenceDiagram",
        name: "Sequence Diagram",
        completion: `sequenceDiagram\n  participant A\n  participant B\n  A->>B: Hello B, how are you?\n  B-->>A: I am good, thanks!$0`,
       
      },
      {
       
        diagram: "classDiagram",
        name: "Class Diagram",
        completion: `classDiagram\n  class Animal {\n    +String name\n    +int age\n    +makeSound()\n  }$0`,
        
      },
      {
        diagram: "BlockDiagram",
        name: "Block Diagram",
        completion:`block-beta
      columns 1
        db(("DB"))
        blockArrowId6<["&nbsp;&nbsp;&nbsp;"]>(down)
        block:ID
          A
          B["A wide one in the middle"]
          C
        end
        space
        D
        ID --> D
        C --> D
        style B fill:#d6dAdding,stroke:#333,stroke-width:4px`

      },
      {
diagram:"Architecture",
name:"Architecture Diagram",    
completion:`architecture-beta
    group api(cloud)[API]

    service db(database)[Database] in api
    service disk1(disk)[Storage] in api
    service disk2(disk)[Storage] in api
    service server(server)[Server] in api

    db:L -- R:server
    disk1:T -- B:server
    disk2:T -- B:db`
      }
    ];
  };
  