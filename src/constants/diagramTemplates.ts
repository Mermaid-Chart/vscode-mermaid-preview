const mermaidExamples = require('@mermaid-js/examples');
console.log(mermaidExamples.diagramData);

interface MermaidExample {
  code: string;
  isDefault?: boolean;
}

interface MermaidDiagramDefinition {
  name: string;
  examples?: MermaidExample[];
}

const diagramData = mermaidExamples.diagramData as readonly MermaidDiagramDefinition[];

interface DiagramInfo {
    name: string;
    code: string;
  }


  const extras = {
    ZenUML: `zenuml
    title Order Service
    @Actor Client #FFEBE6
    @Boundary OrderController #0747A6
    @EC2 <<BFF>> OrderService #E3FCEF
    group BusinessService {
      @Lambda PurchaseService
      @AzureFunction InvoiceService
    }
    @Starter(Client)
    // \`POST /orders\`
    OrderController.post(payload) {
      OrderService.create(payload) {
        order = new Order(payload)
        if(order != null) {
          par {
            PurchaseService.createPO(order)
            InvoiceService.createInvoice(order)      
          }      
        }
      }
    }
    `
  };


type DiagramDefinition = (typeof diagramData)[number];

const isValidDiagram = (
    diagram: DiagramDefinition
  ): diagram is DiagramDefinition & Required<Pick<DiagramDefinition, 'name' | 'examples'>> => {
  return Boolean(diagram.name && diagram.examples && diagram.examples.length > 0);
};

export const getSampleDiagrams = () => {
  const diagrams = diagramData
    .filter(isValidDiagram)
    .map((d) => ({
      ...d,
      example: d.examples.filter(({ isDefault }) => isDefault)[0]
    }));
  const examples: Record<string, string> = {};
  for (const diagram of diagrams) {
    if (diagram.example) {
      examples[diagram.name.replace(/ (Diagram|Chart|Graph)/, '')] = diagram.example.code;
    }
  }
  return { ...examples } as const;
};