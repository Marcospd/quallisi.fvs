CREATE INDEX "inspection_items_evaluation_idx" ON "inspection_items" USING btree ("evaluation");--> statement-breakpoint
CREATE INDEX "inspections_status_idx" ON "inspections" USING btree ("status");--> statement-breakpoint
CREATE INDEX "inspections_result_idx" ON "inspections" USING btree ("result");--> statement-breakpoint
CREATE INDEX "issues_status_idx" ON "issues" USING btree ("status");