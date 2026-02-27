-- Migration: adiciona campos novos na tabela projects
-- Campos: cliente, número do contrato, datas, engenheiro RT, fiscalização, características, observações

ALTER TABLE "projects"
  ADD COLUMN "client_name" varchar(255),
  ADD COLUMN "contract_number" varchar(100),
  ADD COLUMN "start_date" date,
  ADD COLUMN "end_date" date,
  ADD COLUMN "engineer_name" varchar(255),
  ADD COLUMN "supervision" varchar(255),
  ADD COLUMN "characteristics" text,
  ADD COLUMN "notes" text;
