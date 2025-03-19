export interface SnippetData {
  id: string;
  diagram: "flowchart" | "sequenceDiagram" | "classDiagram";
  section: "shapes" | "notes" | "edges" | "other" | "messages" | "relationships";
  name: string;
  code?: string;
  completion?: string;
  sample?: string;
  image: string;
}

const snippets: SnippetData[] = [
  {
    id: "mmflrect",
    diagram: "flowchart",
    section: "shapes",
    name: "Rectangle",
    completion: '${1:rectId}["`${2:label}`"] $0',
    sample: 'rectId["`label`"]',
    image: "/img/flowchart/shape_rectangle",
  },
  {
    id: "mmflrounded",
    diagram: "flowchart",
    section: "shapes",
    name: "Rounded",
    completion: '${1:roundedId}("`${2:label}`") $0',
    sample: 'roundedId("`label`")',
    image: "/img/flowchart/shape_rounded",
  },
  {
    id: "mmflstadium",
    diagram: "flowchart",
    section: "shapes",
    name: "Stadium",
    completion: '${1:stadiumId}(["`${2:label}`"]) $0',
    sample: 'stadiumId(["`label`"])',
    image: "/img/flowchart/shape_stadium",
  },
  {
    id: "mmflsubroutine",
    diagram: "flowchart",
    section: "shapes",
    name: "Subroutine",
    completion: '${1:subId}[["`${2:label}`"]] $0',
    sample: 'subId[["`label`"]]',
    image: "/img/flowchart/shape_subroutine",
  },
  {
    id: "mmfldatabase",
    diagram: "flowchart",
    section: "shapes",
    name: "Database",
    completion: '${1:dbId}[("`${2:label}`")] $0',
    sample: 'dbId[["`label`"]]',
    image: "/img/flowchart/shape_database",
  },
  {
    id: "mmfldecision",
    diagram: "flowchart",
    section: "shapes",
    name: "Decision",
    completion: '${1:decisionId}{"`${2:label}`"} $0',
    sample: 'decisionId{"`label`"}',
    image: "/img/flowchart/shape_decision",
  },
  {
    id: "mmflcircle",
    diagram: "flowchart",
    section: "shapes",
    name: "Circle",
    completion: '${1:circleId}(("`${2:label}`")) $0',
    sample: 'circleId(("`label`"))',
    image: "/img/flowchart/shape_circle",
  },
  {
    id: "mmflasymetric",
    diagram: "flowchart",
    section: "shapes",
    name: "Asymmetric",
    completion: '${1:asymmetricId}>"`${2:label}`"] $0',
    sample: 'asymmetricId>"`label`"]',
    image: "/img/flowchart/shape_asymmetric",
  },
  {
    id: "mmflhexagon",
    diagram: "flowchart",
    section: "shapes",
    name: "Hexagon",
    code: "mmflhexagon",
    completion: '${1:hexId}{{"`${2:label}`"}} $0',
    sample: 'hexId{{"`label`"}}',
    image: "/img/flowchart/shape_hexagon",
  },
  {
    id: "mmflparallelogram",
    diagram: "flowchart",
    section: "shapes",
    name: "Parallelogram",
    completion: '${1:paraId}[/"`${2:label}`"/]$0',
    sample: 'paraId[/"`label`"/]',
    image: "/img/flowchart/shape_parallelogram",
  },
  {
    id: "mmflparallelogramrev",
    diagram: "flowchart",
    section: "shapes",
    name: "Parallelogram reversed",
    completion: '${1:paraRevId}[\\"`${2:label}`"\\] $0',
    sample: 'paraRevId[\\"`label`"\\]',
    image: "/img/flowchart/shape_alt-parallelogram",
  },
  {
    id: "mmfltrapezoid",
    diagram: "flowchart",
    section: "shapes",
    name: "Trapezoid",
    completion: '${1:trapId}[/"`${2:label}`"\\]$0',
    sample: 'trapId[/"`label`"\\]',
    image: "/img/flowchart/shape_trapezoid",
  },
  {
    id: "mmfltrapezoidrev",
    diagram: "flowchart",
    section: "shapes",
    name: "Trapezoid reversed",
    completion: '${1:trapRevId}[\\"`${2:label}`"/]$0',
    sample: 'trapRevId[\\"`label`"/]',
    image: "/img/flowchart/shape_alt-trapezoid",
  },
  {
    id: "mmfldoublecircle",
    diagram: "flowchart",
    section: "shapes",
    name: "Double Circle",
    completion: '${1:doubleCircleId}((("`${2:label}`")))$0',
    sample: 'doubleCircleId((("`label`")))',
    image: "/img/flowchart/shape_double-circle",
  },
  /* Arrows */
  {
    id: "mmflarr",
    diagram: "flowchart",
    section: "edges",
    name: "Arrow",
    sample: "-->",
    completion: "-->$0",
    image: "/img/flowchart/edge_arrow",
  },
  {
    id: "mmflthkarr",
    diagram: "flowchart",
    section: "edges",
    name: "Thick Arrow",
    sample: "==>",
    completion: "==>$0",
    image: "/img/flowchart/edge_thick-arrow",
  },
  {
    id: "mmfldaarr",
    diagram: "flowchart",
    section: "edges",
    name: "Dashed arrow",
    sample: "-.->",
    completion: "-.->$0",
    image: "/img/flowchart/edge_dashed-arrow",
  },
  {
    id: "mmflarrlabel",
    diagram: "flowchart",
    section: "edges",
    name: "Arrow with Label",
    sample: "-- label -->",
    completion: "-- ${1:label} -->$0",
    image: "/img/flowchart/edge_arrow-with-label",
  },
  {
    id: "mmfltharrlabel",
    diagram: "flowchart",
    section: "edges",
    name: "Thick Arrow with Label",
    sample: "== label ==>",
    completion: "== ${1:label} ==>$0",
    image: "/img/flowchart/edge_thick-arrow-with-label",
  },
  {
    id: "mmfldaarrlabel",
    diagram: "flowchart",
    section: "edges",
    name: "Dashed arrow with Label",
    sample: "-. Label .->",
    completion: "-. ${1:label} .->$0",
    image: "/img/flowchart/edge_dashed-arrow-with-label",
  },
  {
    id: "mmflsubgraph",
    diagram: "flowchart",
    section: "other",
    name: "Subgraph",
    code: "mmflsubgraph",
    sample: `subgraph one
      a1-->a2
      end`,
    completion: "subgraph ${1:subgraphName}\n  ${2:nodeId}\nend$0",
    image: "/img/flowchart/other_subgraph",
  },
  {
    id: "mmflclassadd",
    diagram: "flowchart",
    section: "other",
    name: "Add class to a node",
    sample: `A:::theclass`,
    completion: "${1:A}:::${2:theclass}$0",
    image: "/img/flowchart/other_add-class-to-a-node",
  },
  {
    id: "mmflclassdef",
    diagram: "flowchart",
    section: "other",
    name: "Add class definition",
    sample: `classDef theclass fill:#f96`,
    completion: "classDef ${1:theclass} ${2: fill:#f96, stroke:#303;}$0",
    image: "/img/flowchart/other_add-class-definition",
  },
  /* Sequence Diagram */
  {
    id: "mmsdpart",
    diagram: "sequenceDiagram",
    section: "shapes",
    name: "Participant",
    completion: "participant ${1:aId} as ${2:Alice}\n$0",
    sample: "participant aId as Alice",
    image: "/img/sequenceDiagram/shape_participant",
  },
  {
    id: "mmsdact",
    diagram: "sequenceDiagram",
    section: "shapes",
    name: "Actor",
    completion: "actor ${1:jId} as ${2:John}\n$0",
    sample: "actor jId as John",
    image: "/img/sequenceDiagram/shape_actor",
  },
  {
    id: "mmsdnoteleft",
    diagram: "sequenceDiagram",
    section: "notes",
    name: "Note left of",
    completion: "Note left of ${1:Alice}: ${2:A typical message}\n$0",
    sample: "Note left of Alice: A typical message",
    image: "/img/sequenceDiagram/note_left_of",
  },
  /* Notes */
  {
    id: "mmsdnoteover",
    diagram: "sequenceDiagram",
    section: "notes",
    name: "Note over life line",
    code: "mmsdnoteover",
    completion: "Note over ${1:Alice},${2:John}: ${3:A typical message}\n$0",
    sample: "Note over Alice,John: A typical message",
    image: "/img/sequenceDiagram/note_over",
  },
  {
    id: "mmsdnoteright",
    diagram: "sequenceDiagram",
    section: "notes",
    name: "Note right of",
    completion: "Note right of ${1:Alice}: ${2:A typical message}\n$0",
    sample: "Note right of Alice: A typical message",
    image: "/img/sequenceDiagram/note_right_of",
  },
  /* Other */
  {
    id: "mmsdloop",
    diagram: "sequenceDiagram",
    section: "other",
    name: "Loop",
    completion:
      "loop ${1:Title} \n    ${2:From} ->> ${3:To}:${4:Message text}\nend\n$0",
    sample: `loop Loop text
      Alice->>John: Normal line
  end`,
    image: "/img/sequenceDiagram/other_loop",
  },
  {
    id: "mmsdalt",
    diagram: "sequenceDiagram",
    section: "other",
    name: "Alt",
    completion:
      "alt ${1:Title}\n    ${2:From} ->> ${3:To}:${4:Message text}\nelse ${5:Another Title}\n    ${6:From} ->> ${7:To}:${8:Message text}\nend\n$0",
    sample: `alt Alt text
      Alice->>John: First case
  else
      Alice->>John: Second case
  end
  `,
    image: "/img/sequenceDiagram/other_alt",
  },
  {
    id: "mmsdopt",
    diagram: "sequenceDiagram",
    section: "other",
    name: "Opt",
    completion:
      "opt ${1:Title} \n    ${2:From} ->> ${3:To}:${4:Message text} \nend\n$0",
    sample: `opt Opt text
      Alice->>John: First case
  end
  `,
    image: "/img/sequenceDiagram/other_opt",
  },
  {
    id: "mmsdpar",
    diagram: "sequenceDiagram",
    section: "other",
    name: "Par",
    completion:
      "par ${1:Title} \n  ${2:From} ->> ${3:To}:${4:Message text} \nand\n  ${5:From} ->> ${7:To}:${8:Message text}\nend\n$0",
    sample: `par Title
    Alice->>John: First parallel flow
  and
    Alice->>John: Second parallel flow
  end
  `,
    image: "/img/sequenceDiagram/other_par",
  },
  {
    id: "mmsdhigh",
    diagram: "sequenceDiagram",
    section: "other",
    name: "Highlight",
    completion:
      "rect rgb(191, 223, 255)\n    ${1:From} ->> ${2:To}:${3:Message text}\nend\n$0",
    sample: `rect rgb(191, 223, 255)\n
      Alice->>John: Normal line
  end
  `,
    image: "/img/sequenceDiagram/highlight",
  },
  {
    id: "mmsdcrit",
    diagram: "sequenceDiagram",
    section: "other",
    name: "Critical Region",
    completion:
      "critical ${1:Action} \n  ${2:From} ->> ${3:To}:${4:Message text}\noption ${5: Action}\n  ${6:From} ->> ${7:To}:${8:Message text}\nend\n$0",
    sample: `critical Action
    Alice->>John: First parallel flow
  option Another action
    Alice->>John: Second parallel flow
  end`,
    image: "/img/sequenceDiagram/other_critical-region",
  },
  {
    id: "mmsdbreak",
    diagram: "sequenceDiagram",
    section: "other",
    name: "Break",
    completion:
      "break ${1:Some reason} \n  ${2:From} ->> ${3:To}:${4:Message text}\nend\n$0",
    sample: `break Some reason
    Alice->>John: First parallel flow
  end
  `,
    image: "/img/sequenceDiagram/other_break",
  },

  /* Messages */
  {
    id: "mmsdsolid",
    diagram: "sequenceDiagram",
    section: "messages",
    name: "Solid Line",
    completion: "${1:aId} -> ${2:jId}: ${3:Message text}\n$0",
    sample: "aId -> jId: Message text\n",
    image: "/img/sequenceDiagram/message_solid",
  },
  {
    id: "mmsddotted",
    diagram: "sequenceDiagram",
    section: "messages",
    name: "Dotted Line",
    completion: "${1:aId} --> ${2:jId}: ${3:Message text}\n$0",
    sample: "aId --> jId: Message text\n",
    image: "/img/sequenceDiagram/message_dotted",
  },
  {
    id: "mmsdsolidarr",
    diagram: "sequenceDiagram",
    section: "messages",
    name: "Solid Line Arrow",
    completion: "${1:aId} ->> ${2:jId}: ${3:Message text}\n$0",
    sample: "aId ->> jId: Message text\n",
    image: "/img/sequenceDiagram/message_solid_arrow",
  },
  {
    id: "mmsddotarr",
    diagram: "sequenceDiagram",
    section: "messages",
    name: "Dotted Line Arrow",
    completion: "${1:aId} -->> ${2:jId}: ${3:Message text}\n$0",
    sample: "aId -->> jId: Message text\n",
    image: "/img/sequenceDiagram/message_dotted_arrow",
  },
  {
    id: "mmsdmsolcross",
    diagram: "sequenceDiagram",
    section: "messages",
    name: "Solid Line Cross",
    completion: "${1:aId} -x ${2:jId}: ${3: Message text}\n$0",
    sample: "aId -x jId: Message text\n",
    image: "/img/sequenceDiagram/message_solid_cross",
  },
  {
    id: "mmsdmdotcross",
    diagram: "sequenceDiagram",
    section: "messages",
    name: "Dotted Line Cross",
    completion: "${1:aId} --x ${2:jId}: ${3:Message text}\n$0",
    sample: "aId --x jId: Message text\n",
    image: "/img/sequenceDiagram/message_dotted_cross",
  },
  {
    id: "mmsdmsolasync",
    diagram: "sequenceDiagram",
    section: "messages",
    name: "Solid Line Async",
    completion: "${1:aId} -) ${2:jId}: ${3:Message text}\n$0",
    sample: "aId -) jId: Message text\n",
    image: "/img/sequenceDiagram/message_solid_async",
  },
  {
    id: "mmsdmdotasync",
    diagram: "sequenceDiagram",
    section: "messages",
    name: "Dotted Line Async",
    completion: "${1:aId} --) ${2:jId}: ${3:Message text}\n$0",
    sample: "aId --) jId: Message text\n",
    image: "/img/sequenceDiagram/message_dotted_async",
  },
    // Class Diagram
    {
      id: 'mmcl-basic-class',
      diagram: 'classDiagram',
      section: 'shapes',
      name: 'Basic Class',
      completion: `class \${1:cId}
      \${1:cId} : +String owner
      \${1:cId} : +deposit(amount)`,
      sample: `class BankAccount
      BankAccount : +String owner
      BankAccount : +deposit(amount) bool`,
      image: '',
    },
    {
      id: 'mmcl-generics',
      diagram: 'classDiagram',
      section: 'shapes',
      name: 'Generics',
      completion: `class \${1:className}~\${2:Gen}~ {
        int id
        List~int~ position
        -List~string~ messages
        setPoints(List~int~ points)
        getPoints() List~int~
        +setMessages(List~string~ messages)
        +getMessages() List~string~
        +getDistanceMatrix() List~List~int~~
      }`,
      sample: `class BankAccount
      BankAccount : +String owner
      BankAccount : +deposit(amount) bool`,
      image: '',
    },
    {
      id: 'mmcl-rel-inheritance',
      diagram: 'classDiagram',
      section: 'relationships',
      name: 'Inheritance',
      completion: `\${1:class1} --|> \${2:class2}`,
      sample: `classA --|> classB`,
      image: '',
    },
    {
      id: 'mmcl-rel-composition',
      diagram: 'classDiagram',
      section: 'relationships',
      name: 'Composition',
      completion: `\${1:class1} --* \${2:class2}`,
      sample: `classC --* classD`,
      image: '',
    },
    {
      id: 'mmcl-rel-aggregation',
      diagram: 'classDiagram',
      section: 'relationships',
      name: 'Aggregation',
      completion: `\${1:class1} --o \${2:class2}`,
      sample: `classE --o classF`,
      image: '',
    },
    {
      id: 'mmcl-rel-association',
      diagram: 'classDiagram',
      section: 'relationships',
      name: 'Association',
      completion: `\${1:class1} --> \${2:class2}`,
      sample: `classK --> classL`,
      image: '',
    },
    {
      id: 'mmcl-rel-link',
      diagram: 'classDiagram',
      section: 'relationships',
      name: 'Link',
      completion: `\${1:class1} -- \${2:class2}`,
      sample: `classI -- classJ`,
      image: '',
    },
    {
      id: 'mmcl-rel-dependency',
      diagram: 'classDiagram',
      section: 'relationships',
      name: 'Dependency',
      completion: `\${1:class1} ..> \${2:class2}`,
      sample: `classA ..> classB`,
      image: '',
    },
    {
      id: 'mmcl-rel-realization',
      diagram: 'classDiagram',
      section: 'relationships',
      name: 'realization',
      completion: `\${1:class1} ..|> \${2:class2}`,
      sample: `classA ..|> classB`,
      image: '',
    },
    {
      id: 'mmcl-rel-dashed-link',
      diagram: 'classDiagram',
      section: 'relationships',
      name: 'Link (Dashed)',
      completion: `\${1:class1} .. \${2:class2}`,
      sample: `classA .. classB`,
      image: '',
    },
    {
      id: 'mmcl-lollipop',
      diagram: 'classDiagram',
      section: 'relationships',
      name: 'Lollipop',
      completion: `\${1:class1} --() \${2:class2}`,
      sample: `classA --() classB`,
      image: '',
    },
    {
      id: 'mmcl-anno-interface',
      diagram: 'classDiagram',
      section: 'relationships',
      name: 'Interface',
      completion: `<<interface>> \${1:class1}`,
      sample: `classA --() classB`,
      image: '',
    },
    {
      id: 'mmcl-anno-abstract',
      diagram: 'classDiagram',
      section: 'relationships',
      name: 'Abstract',
      completion: `<<abstract>> \${1:class1}`,
      sample: `classA --() classB`,
      image: '',
    },
    {
      id: 'mmcl-anno-service',
      diagram: 'classDiagram',
      section: 'relationships',
      name: 'Service',
      completion: `<<service>> \${1:class1}`,
      sample: `classA --() classB`,
      image: '',
    },
    {
      id: 'mmcl-anno-enumeration',
      diagram: 'classDiagram',
      section: 'relationships',
      name: 'Enumeration',
      completion: `<<enumeration>> \${1:class1}`,
      sample: `classA --() classB`,
      image: '',
    },
    {
      id: 'mmcl-direction',
      diagram: 'classDiagram',
      section: 'relationships',
      name: 'Direction',
      completion: `direction LR`,
      sample: `direction LR`,
      image: '',
    },
    {
      id: 'mmcl-classdef',
      diagram: 'classDiagram',
      section: 'relationships',
      name: 'classDef',
      completion: `classDef \${1:name} \${2:fill:#f9f,stroke:#333,stroke-width:4px;}
  `,
      sample: `classDef purple fill:#f9f,stroke:#333,stroke-width:4px;
  `,
      image: '',
    },
    {
      id: 'mmcl-css-class',
      diagram: 'classDiagram',
      section: 'relationships',
      name: 'classDef',
      completion: `cssClass "\${1:name}" \${2:purpleClass}`,
      sample: `cssClass "Animal" cssClassName`,
      image: '',
    },
];

export const getSnippetsBasedOnDiagram = (languageId: string) => {
    const parts = languageId.split('.');
    
    // Ensure there is a second part (diagram type)
    if (parts.length < 2) {
        return []; // Return an empty array if no diagram type is found
    }

    const diagramType = parts[1];
    return snippets.filter((item) => item.diagram.toLocaleLowerCase() === diagramType.toLocaleLowerCase());
};