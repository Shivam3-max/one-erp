-- CANDRON OneERP — bootstrap login data (idempotent, safe to re-run)
-- Paste into phpMyAdmin → SQL for the oneerp database.
-- If the database has NO tables yet, first import prisma/migrations/0_init/migration.sql.

INSERT IGNORE INTO Tenant (id,name,code,logoText,primaryCurrency,country,brandColor) VALUES
  ('T-CANDRON','CANDRON Electricals Pvt. Ltd.','CANDRON','CANDRON','INR','India','#2050e0');

INSERT IGNORE INTO User (id,tenantId,name,initials,role,department,email,passwordHash,accessLevel) VALUES
  ('U-01','T-CANDRON','Arjun Mehta','AM','Sales Head','sales','arjun@candron.in','$2b$10$KS5w9pUgH8QbZRGaxnFQjuF8cRXaiZgliOD1hn1CMHOE6TJx.SlNy','manager'),
  ('U-02','T-CANDRON','Priya Nair','PN','Application Engineer','application-engineering','priya@candron.in','$2b$10$KS5w9pUgH8QbZRGaxnFQjuF8cRXaiZgliOD1hn1CMHOE6TJx.SlNy','member'),
  ('U-03','T-CANDRON','Rakesh Iyer','RI','Design Engineer','design-engineering','rakesh@candron.in','$2b$10$KS5w9pUgH8QbZRGaxnFQjuF8cRXaiZgliOD1hn1CMHOE6TJx.SlNy','member'),
  ('U-04','T-CANDRON','Sneha Kulkarni','SK','Estimation Lead','estimation','sneha@candron.in','$2b$10$KS5w9pUgH8QbZRGaxnFQjuF8cRXaiZgliOD1hn1CMHOE6TJx.SlNy','member'),
  ('U-05','T-CANDRON','Vikram Rao','VR','Commercial Head','commercial','vikram@candron.in','$2b$10$KS5w9pUgH8QbZRGaxnFQjuF8cRXaiZgliOD1hn1CMHOE6TJx.SlNy','manager'),
  ('U-06','T-CANDRON','Deepa Menon','DM','Procurement Manager','procurement','deepa@candron.in','$2b$10$KS5w9pUgH8QbZRGaxnFQjuF8cRXaiZgliOD1hn1CMHOE6TJx.SlNy','member'),
  ('U-07','T-CANDRON','Suresh Patil','SP','Production Manager','manufacturing','suresh@candron.in','$2b$10$KS5w9pUgH8QbZRGaxnFQjuF8cRXaiZgliOD1hn1CMHOE6TJx.SlNy','member'),
  ('U-08','T-CANDRON','Anil Kumar','AK','Testing Engineer','quality','anil@candron.in','$2b$10$KS5w9pUgH8QbZRGaxnFQjuF8cRXaiZgliOD1hn1CMHOE6TJx.SlNy','member'),
  ('U-09','T-CANDRON','Meera Shah','MS','Director','management','meera@candron.in','$2b$10$KS5w9pUgH8QbZRGaxnFQjuF8cRXaiZgliOD1hn1CMHOE6TJx.SlNy','admin'),
  ('U-10','T-CANDRON','Guest Viewer','GV','Viewer','sales','viewer@candron.in','$2b$10$KS5w9pUgH8QbZRGaxnFQjuF8cRXaiZgliOD1hn1CMHOE6TJx.SlNy','viewer'),
  ('U-CLIENT-ADMIN','T-CANDRON','Client Admin','CA','Administrator','management','client.admin@candron.in','$2b$10$KS5w9pUgH8QbZRGaxnFQjuF8cRXaiZgliOD1hn1CMHOE6TJx.SlNy','admin'),
  ('U-CLIENT-VIEWER','T-CANDRON','Client Reviewer','CR','Reviewer','sales','client.viewer@candron.in','$2b$10$KS5w9pUgH8QbZRGaxnFQjuF8cRXaiZgliOD1hn1CMHOE6TJx.SlNy','viewer');
