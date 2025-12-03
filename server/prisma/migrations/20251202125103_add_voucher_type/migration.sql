-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Voucher" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "serialNumber" TEXT NOT NULL,
    "issueDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "totalAmount" DECIMAL NOT NULL DEFAULT 0,
    "totalAmountWords" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'EXPENSE',
    "userId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Voucher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Voucher" ("createdAt", "id", "issueDate", "remarks", "serialNumber", "totalAmount", "totalAmountWords", "updatedAt", "userId") SELECT "createdAt", "id", "issueDate", "remarks", "serialNumber", "totalAmount", "totalAmountWords", "updatedAt", "userId" FROM "Voucher";
DROP TABLE "Voucher";
ALTER TABLE "new_Voucher" RENAME TO "Voucher";
CREATE UNIQUE INDEX "Voucher_userId_serialNumber_key" ON "Voucher"("userId", "serialNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
