# Voucher Automation Platform

A full-stack web application for managing Carrybee vouchers, gate passes, and asset receiving forms. The first milestone covers the voucher workflow with authentication, form automation, and printable templates inspired by the provided Word document.

## Features

- **Secure login** with employee profile support (name, EMP ID, designation, department, cell number, optional email).
- **Voucher CRUD API** with automatic total and amount-in-words conversion for each voucher.
- **React dashboard** to review, create, edit, and print vouchers using the Carrybee layout.
- **Auto-filled templates** that pull employee profile data into the voucher and compute totals instantly.
- **SQLite persistence** via Prisma for easy local setup and portability.

## Project Structure

```
Inventory Management/
├─ client/    # Vite + React (TypeScript) frontend
└─ server/    # Express + Prisma (TypeScript) backend
```

## Getting Started

1. **Install dependencies** (run once per workspace):
   ```powershell
   cd "c:\Users\USER\Documents\Inventory Management\server"
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   npm install

   cd "c:\Users\USER\Documents\Inventory Management\client"
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   npm install
   ```

2. **Apply database migrations** (SQLite file is created under `server/prisma/dev.db`):
   ```powershell
   cd "c:\Users\USER\Documents\Inventory Management\server"
   npx prisma migrate dev --name init
   ```

3. **Seed a first user** (manual example using Prisma CLI):
   ```powershell
   npx prisma db execute --script "INSERT INTO User (empId, name, designation, department, cellNo, passwordHash) VALUES ('EMP-001', 'Demo User', 'Manager', 'Finance', '017XXXXXXXX', '$2a$10$replace_with_bcrypt_hash');"
   ```
   > Generate a password hash with `npx bcrypt-cli hash "your-password"` or any bcrypt tool.

4. **Run the backend API**:
   ```powershell
   cd "c:\Users\USER\Documents\Inventory Management\server"
   npm run dev
   ```

5. **Run the frontend client** (in a separate terminal):
   ```powershell
   cd "c:\Users\USER\Documents\Inventory Management\client"
   npm run dev
   ```

6. Visit `http://localhost:5173`, log in with your credentials, and start creating vouchers. The form auto-fills profile information and mirrors the Carrybee layout with live previews and print support (`Ctrl+P`).

## Environment Variables

- Backend (`server/.env`)
  ```dotenv
  DATABASE_URL="file:./dev.db"
  JWT_SECRET="super-secret-change-me"
  PORT=4000
  ```

- Frontend (`client/.env`)
  ```dotenv
  VITE_API_URL=http://localhost:4000
  ```

## Next Steps

- Extend the Prisma schema and UI to cover gate passes and asset receive forms.
- Add role-based access control and audit history per voucher.
- Integrate PDF export (e.g., `react-to-print` or headless Chrome) for one-click downloads.
- Build seed scripts and admin panels for managing employee accounts.

## Printing Notes

The preview component is optimized for A4 printing. Use the browser print dialog to produce physical copies or PDFs—the layout hides navigation and controls automatically during printing.
