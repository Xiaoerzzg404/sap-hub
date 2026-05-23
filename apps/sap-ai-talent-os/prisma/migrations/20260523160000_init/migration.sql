-- CreateTable
CREATE TABLE "Consultant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "workCountriesTimezones" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "contactNote" TEXT,
    "status" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sapModules" TEXT NOT NULL,
    "yearsOfExperience" INTEGER NOT NULL DEFAULT 0,
    "industries" TEXT NOT NULL,
    "representativeProjects" TEXT NOT NULL,
    "processes" TEXT NOT NULL,
    "hasS4Hana" BOOLEAN NOT NULL DEFAULT false,
    "hasRollout" BOOLEAN NOT NULL DEFAULT false,
    "hasJapanProject" BOOLEAN NOT NULL DEFAULT false,
    "japaneseLevel" TEXT NOT NULL,
    "englishLevel" TEXT NOT NULL,
    "chineseLevel" TEXT NOT NULL,
    "participationModes" TEXT NOT NULL,
    "expectedRate" TEXT,
    "availableFrom" DATETIME,
    "completedBootcamp" BOOLEAN NOT NULL DEFAULT false,
    "passedMockInterview" BOOLEAN NOT NULL DEFAULT false,
    "recommendable" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "moduleScore" INTEGER NOT NULL DEFAULT 0,
    "experienceScore" INTEGER NOT NULL DEFAULT 0,
    "languageScore" INTEGER NOT NULL DEFAULT 0,
    "deliveryScore" INTEGER NOT NULL DEFAULT 0,
    "aiScore" INTEGER NOT NULL DEFAULT 0,
    "reliabilityScore" INTEGER NOT NULL DEFAULT 0,
    "totalScore" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "ConsultantAssessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "consultantId" TEXT NOT NULL,
    "assessmentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "score" INTEGER,
    "risk" TEXT,
    "nextAction" TEXT,
    CONSTRAINT "ConsultantAssessment_consultantId_fkey" FOREIGN KEY ("consultantId") REFERENCES "Consultant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConsultantInteraction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "consultantId" TEXT NOT NULL,
    "interactionAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channel" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "nextAction" TEXT,
    CONSTRAINT "ConsultantInteraction_consultantId_fkey" FOREIGN KEY ("consultantId") REFERENCES "Consultant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClientDemand" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "clientName" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "countryRegion" TEXT NOT NULL,
    "projectStage" TEXT NOT NULL,
    "requiredModules" TEXT NOT NULL,
    "headcount" INTEGER NOT NULL DEFAULT 1,
    "languageRequirements" TEXT NOT NULL,
    "workMode" TEXT NOT NULL,
    "startDate" DATETIME,
    "duration" TEXT NOT NULL,
    "budgetRange" TEXT,
    "workContent" TEXT NOT NULL,
    "keyRisks" TEXT,
    "needsTraining" BOOLEAN NOT NULL DEFAULT false,
    "needsPoc" BOOLEAN NOT NULL DEFAULT false,
    "needsLongTermSupport" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL,
    "notes" TEXT
);

-- CreateTable
CREATE TABLE "MatchRecommendation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "matchRunId" TEXT NOT NULL,
    "demandId" TEXT NOT NULL,
    "consultantId" TEXT,
    "rank" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "reasons" TEXT NOT NULL,
    "risks" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "snapshot" TEXT,
    CONSTRAINT "MatchRecommendation_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "ClientDemand" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MatchRecommendation_consultantId_fkey" FOREIGN KEY ("consultantId") REFERENCES "Consultant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "title" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "topicCategory" TEXT NOT NULL,
    "targetReader" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "channels" TEXT NOT NULL,
    "plannedPublishAt" DATETIME,
    "actualPublishAt" DATETIME,
    "relatedProduct" TEXT,
    "relatedEntity" TEXT,
    "summary" TEXT NOT NULL,
    "cta" TEXT NOT NULL,
    "notes" TEXT
);

-- CreateTable
CREATE TABLE "ProductAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "targetCustomer" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "priceRange" TEXT,
    "deliveryFormat" TEXT NOT NULL,
    "deliverables" TEXT NOT NULL,
    "salesMessage" TEXT NOT NULL,
    "relatedContent" TEXT,
    "relatedDemand" TEXT,
    "notes" TEXT
);

-- CreateTable
CREATE TABLE "CoachResource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "contact" TEXT,
    "cooperationMode" TEXT NOT NULL,
    "suggestedFrequency" TEXT NOT NULL,
    "lastContactDate" DATETIME,
    "nextContactDate" DATETIME,
    "currentQuestion" TEXT,
    "advice" TEXT,
    "nextAction" TEXT,
    "notes" TEXT
);

-- CreateTable
CREATE TABLE "CoachInteraction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "coachId" TEXT NOT NULL,
    "interactionAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "question" TEXT NOT NULL,
    "advice" TEXT NOT NULL,
    "nextAction" TEXT,
    CONSTRAINT "CoachInteraction_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "CoachResource" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WeeklyReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "weekStart" DATETIME NOT NULL,
    "weekEnd" DATETIME NOT NULL,
    "newContentCount" INTEGER NOT NULL DEFAULT 0,
    "newLeadCount" INTEGER NOT NULL DEFAULT 0,
    "newConsultantCount" INTEGER NOT NULL DEFAULT 0,
    "newClientInterviewCount" INTEGER NOT NULL DEFAULT 0,
    "communityActiveCount" INTEGER NOT NULL DEFAULT 0,
    "courseSignupCount" INTEGER NOT NULL DEFAULT 0,
    "enterpriseOpportunityCount" INTEGER NOT NULL DEFAULT 0,
    "recommendableConsultantCount" INTEGER NOT NULL DEFAULT 0,
    "weeklyRevenue" REAL NOT NULL DEFAULT 0,
    "founderHours" REAL NOT NULL DEFAULT 0,
    "completedItems" TEXT NOT NULL,
    "biggestProblem" TEXT NOT NULL,
    "learning" TEXT NOT NULL,
    "nextMostImportantThing" TEXT NOT NULL,
    "nextTop3Todos" TEXT NOT NULL,
    "delegatedTasks" TEXT,
    "peopleToAsk" TEXT,
    "notes" TEXT
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "dueDate" DATETIME,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "notes" TEXT
);
