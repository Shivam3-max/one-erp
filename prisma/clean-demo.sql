-- CANDRON OneERP — remove all demo/sample content, keep the tenant and users.
-- Paste into phpMyAdmin → SQL for the oneerp database → Go.
-- After this the workspace is clean: log in and enter your own data.
-- (Safe to run; it does not touch Tenant or User.)

SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM TestRecord;
DELETE FROM TestUnit;
DELETE FROM QuoteApproval;
DELETE FROM QuoteRevision;
DELETE FROM Quotation;
DELETE FROM ArtifactLink;
DELETE FROM Revision;
DELETE FROM Artifact;
DELETE FROM ProjectStage;
DELETE FROM Project;
DELETE FROM MaterialReq;
DELETE FROM WorkOrder;
DELETE FROM ComplianceItem;
DELETE FROM Communication;
DELETE FROM Contact;
DELETE FROM Opportunity;
DELETE FROM Activity;
DELETE FROM Configuration;
DELETE FROM Vendor;
DELETE FROM StandardRef;
DELETE FROM WorkflowConfig;
DELETE FROM RateCard;
DELETE FROM ProductFamily;
DELETE FROM Customer;
DELETE FROM TenantConfig;

SET FOREIGN_KEY_CHECKS = 1;
