-- CreateIndex
CREATE INDEX "product_tags_idx" ON "product" USING GIN ("tags");
