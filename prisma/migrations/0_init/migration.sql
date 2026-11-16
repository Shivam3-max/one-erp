-- CreateTable
CREATE TABLE `Tenant` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `logoText` VARCHAR(191) NOT NULL,
    `primaryCurrency` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NOT NULL,
    `brandColor` VARCHAR(191) NOT NULL DEFAULT '#2050e0',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `initials` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `department` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NULL,
    `accessLevel` VARCHAR(191) NOT NULL DEFAULT 'member',

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Customer` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NOT NULL,
    `gstin` VARCHAR(191) NULL,
    `rating` VARCHAR(191) NOT NULL,
    `since` VARCHAR(191) NOT NULL,
    `commercial` JSON NULL,

    INDEX `Customer_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Contact` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `primary` BOOLEAN NOT NULL DEFAULT false,

    INDEX `Contact_customerId_idx`(`customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Communication` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `summary` TEXT NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `date` VARCHAR(191) NOT NULL,

    INDEX `Communication_tenantId_idx`(`tenantId`),
    INDEX `Communication_customerId_idx`(`customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Opportunity` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `stage` VARCHAR(191) NOT NULL,
    `value` DOUBLE NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `ownerId` VARCHAR(191) NOT NULL,
    `expectedClose` VARCHAR(191) NOT NULL,
    `source` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NULL,
    `lastActivity` VARCHAR(191) NOT NULL,

    INDEX `Opportunity_tenantId_idx`(`tenantId`),
    INDEX `Opportunity_customerId_idx`(`customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Project` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `ownerId` VARCHAR(191) NOT NULL,
    `currentStage` VARCHAR(191) NOT NULL,
    `health` VARCHAR(191) NOT NULL,
    `priority` VARCHAR(191) NOT NULL,
    `value` DOUBLE NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `marginPct` DOUBLE NULL,
    `createdAt` VARCHAR(191) NOT NULL,
    `targetDelivery` VARCHAR(191) NULL,
    `location` VARCHAR(191) NOT NULL,
    `productSummary` VARCHAR(191) NOT NULL,
    `tags` JSON NOT NULL,

    INDEX `Project_tenantId_idx`(`tenantId`),
    INDEX `Project_customerId_idx`(`customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectStage` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL,
    `startedAt` VARCHAR(191) NULL,
    `completedAt` VARCHAR(191) NULL,
    `ownerId` VARCHAR(191) NULL,
    `note` TEXT NULL,

    INDEX `ProjectStage_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Artifact` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `stage` VARCHAR(191) NOT NULL,
    `currentRevision` INTEGER NOT NULL DEFAULT 1,
    `ownerId` VARCHAR(191) NOT NULL,
    `updatedAt` VARCHAR(191) NOT NULL,
    `upstreamStale` BOOLEAN NOT NULL DEFAULT false,
    `meta` JSON NULL,

    INDEX `Artifact_tenantId_idx`(`tenantId`),
    INDEX `Artifact_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Revision` (
    `id` VARCHAR(191) NOT NULL,
    `artifactId` VARCHAR(191) NOT NULL,
    `rev` INTEGER NOT NULL,
    `createdAt` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `changeSummary` TEXT NOT NULL,

    INDEX `Revision_artifactId_idx`(`artifactId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ArtifactLink` (
    `id` VARCHAR(191) NOT NULL,
    `artifactId` VARCHAR(191) NOT NULL,
    `toArtifactId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `atRevision` INTEGER NOT NULL,

    INDEX `ArtifactLink_artifactId_idx`(`artifactId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductFamily` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `blurb` TEXT NOT NULL,
    `attributeCount` INTEGER NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `schema` JSON NULL,

    INDEX `ProductFamily_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TenantConfig` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `data` JSON NOT NULL,

    UNIQUE INDEX `TenantConfig_tenantId_key`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Configuration` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NULL,
    `familyId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `values` JSON NOT NULL,
    `marginPct` DOUBLE NOT NULL DEFAULT 18,
    `validated` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` VARCHAR(191) NOT NULL,
    `createdBy` VARCHAR(191) NOT NULL,

    INDEX `Configuration_tenantId_idx`(`tenantId`),
    INDEX `Configuration_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Quotation` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `revision` INTEGER NOT NULL DEFAULT 1,
    `status` VARCHAR(191) NOT NULL,
    `validityDays` INTEGER NOT NULL DEFAULT 60,
    `ownerId` VARCHAR(191) NOT NULL,
    `product` VARCHAR(191) NOT NULL,
    `lineItems` JSON NOT NULL,
    `packing` DOUBLE NOT NULL,
    `freight` DOUBLE NOT NULL,
    `insurance` DOUBLE NOT NULL,
    `gstPct` DOUBLE NOT NULL DEFAULT 18,
    `paymentTerms` VARCHAR(191) NOT NULL,
    `deliveryWeeks` INTEGER NOT NULL,
    `scope` JSON NOT NULL,
    `exclusions` JSON NOT NULL,
    `terms` JSON NOT NULL,
    `blocks` JSON NOT NULL,
    `createdAt` VARCHAR(191) NOT NULL,
    `updatedAt` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Quotation_projectId_key`(`projectId`),
    UNIQUE INDEX `Quotation_code_key`(`code`),
    INDEX `Quotation_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuoteRevision` (
    `id` VARCHAR(191) NOT NULL,
    `quotationId` VARCHAR(191) NOT NULL,
    `rev` INTEGER NOT NULL,
    `date` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `change` TEXT NOT NULL,

    INDEX `QuoteRevision_quotationId_idx`(`quotationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuoteApproval` (
    `id` VARCHAR(191) NOT NULL,
    `quotationId` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `date` VARCHAR(191) NULL,

    INDEX `QuoteApproval_quotationId_idx`(`quotationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ComplianceItem` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `clause` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `requirement` TEXT NOT NULL,
    `companySpec` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `deviation` TEXT NULL,
    `engineerComment` TEXT NULL,
    `engineerId` VARCHAR(191) NOT NULL,

    INDEX `ComplianceItem_tenantId_idx`(`tenantId`),
    INDEX `ComplianceItem_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Vendor` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `rating` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `onTimePct` INTEGER NOT NULL,

    INDEX `Vendor_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MaterialReq` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `item` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `qty` DOUBLE NOT NULL,
    `unit` VARCHAR(191) NOT NULL,
    `requiredBy` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `poNo` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL,
    `value` DOUBLE NOT NULL,
    `quotes` JSON NULL,

    INDEX `MaterialReq_tenantId_idx`(`tenantId`),
    INDEX `MaterialReq_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WorkOrder` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `projectShort` VARCHAR(191) NOT NULL,
    `unit` VARCHAR(191) NOT NULL,
    `stage` VARCHAR(191) NOT NULL,
    `operator` VARCHAR(191) NOT NULL,
    `machine` VARCHAR(191) NOT NULL,
    `startedAt` VARCHAR(191) NOT NULL,
    `progress` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `issue` TEXT NULL,

    INDEX `WorkOrder_tenantId_idx`(`tenantId`),
    INDEX `WorkOrder_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TestUnit` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `serial` VARCHAR(191) NOT NULL,
    `projectShort` VARCHAR(191) NOT NULL,
    `product` VARCHAR(191) NOT NULL,
    `certIssued` BOOLEAN NOT NULL DEFAULT false,
    `issuedAt` VARCHAR(191) NULL,

    UNIQUE INDEX `TestUnit_serial_key`(`serial`),
    INDEX `TestUnit_tenantId_idx`(`tenantId`),
    INDEX `TestUnit_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TestRecord` (
    `id` VARCHAR(191) NOT NULL,
    `testUnitId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `result` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NULL,
    `limit` VARCHAR(191) NULL,
    `engineerId` VARCHAR(191) NOT NULL,
    `witnessed` BOOLEAN NOT NULL DEFAULT false,

    INDEX `TestRecord_testUnitId_idx`(`testUnitId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WorkflowConfig` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `artifactType` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `states` JSON NOT NULL,
    `approvalChain` JSON NOT NULL,

    INDEX `WorkflowConfig_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StandardRef` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NULL,
    `code` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `scope` VARCHAR(191) NOT NULL,

    INDEX `StandardRef_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RateCard` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `effectiveFrom` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT false,
    `rates` JSON NOT NULL,
    `factors` JSON NULL,

    INDEX `RateCard_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Activity` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NULL,
    `actorId` VARCHAR(191) NOT NULL,
    `verb` VARCHAR(191) NOT NULL,
    `target` TEXT NOT NULL,
    `at` VARCHAR(191) NOT NULL,

    INDEX `Activity_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Contact` ADD CONSTRAINT `Contact_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectStage` ADD CONSTRAINT `ProjectStage_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Artifact` ADD CONSTRAINT `Artifact_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Revision` ADD CONSTRAINT `Revision_artifactId_fkey` FOREIGN KEY (`artifactId`) REFERENCES `Artifact`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtifactLink` ADD CONSTRAINT `ArtifactLink_artifactId_fkey` FOREIGN KEY (`artifactId`) REFERENCES `Artifact`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuoteRevision` ADD CONSTRAINT `QuoteRevision_quotationId_fkey` FOREIGN KEY (`quotationId`) REFERENCES `Quotation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuoteApproval` ADD CONSTRAINT `QuoteApproval_quotationId_fkey` FOREIGN KEY (`quotationId`) REFERENCES `Quotation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TestRecord` ADD CONSTRAINT `TestRecord_testUnitId_fkey` FOREIGN KEY (`testUnitId`) REFERENCES `TestUnit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

