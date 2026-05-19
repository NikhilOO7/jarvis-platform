import { workflowTemplates, type WorkflowTemplateDefinition } from "@/lib/workflow-templates";

type N8nNode = {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, unknown>;
};

function makeNodeId(workflowKey: string, index: number) {
  return `${workflowKey}_${index + 1}`;
}

export function createN8nWorkflowScaffold(workflow: WorkflowTemplateDefinition) {
  const nodes: N8nNode[] = [
    {
      id: makeNodeId(workflow.key, 0),
      name: "Manual Trigger",
      type: "n8n-nodes-base.manualTrigger",
      typeVersion: 1,
      position: [0, 0],
      parameters: {}
    },
    ...workflow.steps.map((step, index) => ({
      id: makeNodeId(workflow.key, index + 1),
      name: step.approvalRequired ? `${step.title} Approval Gate` : step.title,
      type: "n8n-nodes-base.noOp",
      typeVersion: 1,
      position: [(index + 1) * 260, 0] as [number, number],
      parameters: {
        notes: step.description,
        approvalRequired: Boolean(step.approvalRequired),
        risk: workflow.risk,
        agentKinds: workflow.agentKinds
      }
    }))
  ];

  const connections = Object.fromEntries(
    nodes.slice(0, -1).map((node, index) => [
      node.name,
      {
        main: [
          [
            {
              node: nodes[index + 1].name,
              type: "main",
              index: 0
            }
          ]
        ]
      }
    ])
  );

  return {
    name: workflow.name,
    active: false,
    nodes,
    connections,
    settings: {
      executionOrder: "v1"
    },
    staticData: {
      jarvis: {
        key: workflow.key,
        trigger: workflow.trigger,
        requiredScopes: workflow.requiredScopes,
        description: workflow.description
      }
    }
  };
}

export function createN8nExportBundle() {
  return {
    exportedAt: new Date().toISOString(),
    source: "jarvis-platform",
    workflows: workflowTemplates.map(createN8nWorkflowScaffold)
  };
}
