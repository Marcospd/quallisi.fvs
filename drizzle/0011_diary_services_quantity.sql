-- Migration: adiciona quantidade e unidade nos serviços executados do diário
ALTER TABLE "diary_services_executed"
  ADD COLUMN "quantity" numeric(14, 4),
  ADD COLUMN "unit" varchar(50);
