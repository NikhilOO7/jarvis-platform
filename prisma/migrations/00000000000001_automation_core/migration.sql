CREATE TYPE "AgentKind" AS ENUM ('EMAIL', 'CALENDAR', 'CONTACTS', 'RESEARCH', 'EXPENSES', 'CALCULATOR', 'KNOWLEDGE', 'VOICE', 'ORCHESTRATOR', 'CUSTOM');
CREATE TYPE "WorkflowStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');
CREATE TYPE "WorkflowRunStatus" AS ENUM ('QUEUED', 'RUNNING', 'WAITING_FOR_APPROVAL', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');
CREATE TYPE "ConnectorType" AS ENUM ('OPENAI', 'TELEGRAM', 'N8N', 'EMAIL', 'CALENDAR', 'CONTACTS', 'ELEVENLABS', 'ANTHROPIC', 'STORAGE');

CREATE TABLE "AgentDefinition" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "kind" "AgentKind" NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "capabilities" TEXT[],
  "riskLevel" INTEGER NOT NULL DEFAULT 1,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AgentDefinition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkflowTemplate" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "trigger" TEXT NOT NULL,
  "agentKinds" "AgentKind"[],
  "steps" JSONB NOT NULL,
  "requiredScopes" TEXT[],
  "status" "WorkflowStatus" NOT NULL DEFAULT 'DRAFT',
  "n8nWorkflowId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkflowTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkflowRun" (
  "id" TEXT NOT NULL,
  "workflowTemplateId" TEXT,
  "agentDefinitionId" TEXT,
  "command" TEXT NOT NULL,
  "status" "WorkflowRunStatus" NOT NULL DEFAULT 'QUEUED',
  "input" JSONB,
  "output" JSONB,
  "logs" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkflowRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApprovalRequest" (
  "id" TEXT NOT NULL,
  "workflowRunId" TEXT,
  "actionType" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "payload" JSONB,
  "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
  "decidedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConnectorConfig" (
  "id" TEXT NOT NULL,
  "type" "ConnectorType" NOT NULL,
  "name" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "status" TEXT NOT NULL DEFAULT 'NOT_CONFIGURED',
  "scopes" TEXT[],
  "metadata" JSONB,
  "connectedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ConnectorConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AgentDefinition_key_key" ON "AgentDefinition"("key");
CREATE UNIQUE INDEX "WorkflowTemplate_key_key" ON "WorkflowTemplate"("key");
CREATE INDEX "WorkflowRun_status_idx" ON "WorkflowRun"("status");
CREATE INDEX "WorkflowRun_workflowTemplateId_idx" ON "WorkflowRun"("workflowTemplateId");
CREATE INDEX "WorkflowRun_agentDefinitionId_idx" ON "WorkflowRun"("agentDefinitionId");
CREATE INDEX "ApprovalRequest_status_idx" ON "ApprovalRequest"("status");
CREATE UNIQUE INDEX "ConnectorConfig_type_name_key" ON "ConnectorConfig"("type", "name");

ALTER TABLE "WorkflowRun" ADD CONSTRAINT "WorkflowRun_workflowTemplateId_fkey" FOREIGN KEY ("workflowTemplateId") REFERENCES "WorkflowTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkflowRun" ADD CONSTRAINT "WorkflowRun_agentDefinitionId_fkey" FOREIGN KEY ("agentDefinitionId") REFERENCES "AgentDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_workflowRunId_fkey" FOREIGN KEY ("workflowRunId") REFERENCES "WorkflowRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
