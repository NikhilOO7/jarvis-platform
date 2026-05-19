import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { workflowTemplates, type WorkflowTemplateDefinition } from "@/lib/workflow-templates";

export async function syncWorkflowTemplates() {
  return Promise.all(
    workflowTemplates.map((workflow) =>
      prisma.workflowTemplate.upsert({
        where: { key: workflow.key },
        update: {
          name: workflow.name,
          description: workflow.description,
          trigger: workflow.trigger,
          agentKinds: [...workflow.agentKinds],
          steps: workflow.steps as Prisma.InputJsonValue,
          requiredScopes: [...workflow.requiredScopes]
        },
        create: {
          key: workflow.key,
          name: workflow.name,
          description: workflow.description,
          trigger: workflow.trigger,
          agentKinds: [...workflow.agentKinds],
          steps: workflow.steps as Prisma.InputJsonValue,
          requiredScopes: [...workflow.requiredScopes]
        }
      })
    )
  );
}

export async function createWorkflowRunFromRoute(input: {
  command: string;
  workflow: WorkflowTemplateDefinition;
  route: {
    agentKind: string;
    confidence: number;
    risk: string;
    rationale: string;
  };
}) {
  const templates = await syncWorkflowTemplates();
  const workflowTemplate = templates.find((template) => template.key === input.workflow.key);
  const approvalSteps = input.workflow.steps.filter((step) => step.approvalRequired);

  return prisma.workflowRun.create({
    data: {
      workflowTemplateId: workflowTemplate?.id,
      command: input.command,
      status: approvalSteps.length > 0 ? "WAITING_FOR_APPROVAL" : "QUEUED",
      input: {
        command: input.command,
        route: input.route
      },
      logs: [
        {
          at: new Date().toISOString(),
          event: "COMMAND_ROUTED",
          message: `Command routed to ${input.route.agentKind}.`
        }
      ],
      approvals: {
        create: approvalSteps.map((step) => ({
          actionType: "WORKFLOW_STEP",
          title: step.title,
          description: step.description,
          payload: {
            workflowKey: input.workflow.key,
            command: input.command,
            agentKind: input.route.agentKind,
            risk: input.route.risk
          }
        }))
      }
    },
    include: {
      approvals: true,
      workflowTemplate: true
    }
  });
}
