-- Add isGap flag to voucher lines for optional spacer rows
ALTER TABLE "VoucherLine"
ADD COLUMN "isGap" BOOLEAN NOT NULL DEFAULT false;
