CREATE EXTENSION IF NOT EXISTS vector;

CREATE TYPE "SourceType" AS ENUM ('MANUAL_LINK', 'MANUAL_TEXT', 'FILE_IMPORT', 'SOCIAL_EXPORT', 'BROWSER_EXTENSION', 'SHARE_SHEET', 'API_CONNECTOR');
CREATE TYPE "ContentCategory" AS ENUM ('FOOD', 'WORKOUT', 'TECH', 'PRODUCTS', 'JOBS', 'MISC');
CREATE TYPE "ProcessingStatus" AS ENUM ('PENDING', 'PROCESSED', 'DUPLICATE', 'FAILED');
CREATE TYPE "EntityType" AS ENUM ('FOOD', 'INGREDIENT', 'WORKOUT', 'MUSCLE', 'EQUIPMENT', 'COMPANY', 'JOB', 'SKILL', 'PRODUCT', 'CONCEPT', 'PERSON', 'GOAL', 'NOTE');

CREATE TABLE "RawSourceItem" (
  "id" TEXT NOT NULL,
  "sourceType" "SourceType" NOT NULL,
  "originalUrl" TEXT,
  "canonicalUrl" TEXT,
  "title" TEXT,
  "author" TEXT,
  "platform" TEXT,
  "rawText" TEXT,
  "rawMetadata" JSONB,
  "contentHash" TEXT,
  "category" "ContentCategory" NOT NULL DEFAULT 'MISC',
  "status" "ProcessingStatus" NOT NULL DEFAULT 'PENDING',
  "summary" TEXT,
  "embedding" vector(1536),
  "duplicateOfId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RawSourceItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "KnowledgeItem" (
  "id" TEXT NOT NULL,
  "sourceId" TEXT,
  "category" "ContentCategory" NOT NULL DEFAULT 'MISC',
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "insights" TEXT[],
  "actions" TEXT[],
  "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
  "embedding" vector(1536),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "KnowledgeItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Entity" (
  "id" TEXT NOT NULL,
  "type" "EntityType" NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Entity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EntityMention" (
  "id" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "knowledgeItemId" TEXT NOT NULL,
  "context" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EntityMention_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EntityRelation" (
  "id" TEXT NOT NULL,
  "fromEntityId" TEXT NOT NULL,
  "toEntityId" TEXT NOT NULL,
  "relation" TEXT NOT NULL,
  "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EntityRelation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChatSession" (
  "id" TEXT NOT NULL,
  "title" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChatMessage" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RawSourceItem_category_idx" ON "RawSourceItem"("category");
CREATE INDEX "RawSourceItem_status_idx" ON "RawSourceItem"("status");
CREATE INDEX "RawSourceItem_canonicalUrl_idx" ON "RawSourceItem"("canonicalUrl");
CREATE INDEX "RawSourceItem_contentHash_idx" ON "RawSourceItem"("contentHash");
CREATE INDEX "KnowledgeItem_category_idx" ON "KnowledgeItem"("category");
CREATE UNIQUE INDEX "Entity_type_name_key" ON "Entity"("type", "name");
CREATE INDEX "Entity_type_idx" ON "Entity"("type");
CREATE UNIQUE INDEX "EntityMention_entityId_knowledgeItemId_key" ON "EntityMention"("entityId", "knowledgeItemId");
CREATE UNIQUE INDEX "EntityRelation_fromEntityId_toEntityId_relation_key" ON "EntityRelation"("fromEntityId", "toEntityId", "relation");

ALTER TABLE "RawSourceItem" ADD CONSTRAINT "RawSourceItem_duplicateOfId_fkey" FOREIGN KEY ("duplicateOfId") REFERENCES "RawSourceItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "KnowledgeItem" ADD CONSTRAINT "KnowledgeItem_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "RawSourceItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EntityMention" ADD CONSTRAINT "EntityMention_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EntityMention" ADD CONSTRAINT "EntityMention_knowledgeItemId_fkey" FOREIGN KEY ("knowledgeItemId") REFERENCES "KnowledgeItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EntityRelation" ADD CONSTRAINT "EntityRelation_fromEntityId_fkey" FOREIGN KEY ("fromEntityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EntityRelation" ADD CONSTRAINT "EntityRelation_toEntityId_fkey" FOREIGN KEY ("toEntityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "RawSourceItem_embedding_idx" ON "RawSourceItem" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);
CREATE INDEX "KnowledgeItem_embedding_idx" ON "KnowledgeItem" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);
