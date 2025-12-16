# Hospital Management System

A complete hospital management system built with Next.js 16, SQLite, and TypeScript.

## Features

- **Role-based Access Control**: Admin, Doctor, Nurse, Radiologist, and Patient roles
- **Patient Management**: Register, view, and manage patient records
- **Staff Management**: Create and manage hospital staff accounts
- **Assignment System**: Doctors can assign tasks to nurses and radiologists
- **Prescription System**: Doctors can write prescriptions for patients
- **Radiology Reports**: Radiologists can upload scan images and reports
- **Notifications**: Real-time notifications for staff and patients
- **Reports**: Upload and manage medical reports with images
- **Secure Authentication**: Session-based authentication with bcrypt password hashing
- **Local Database**: SQLite database for easy setup and deployment

## Setup Instructions

### 1. Install Dependencies

**Windows Users**: `sqlite3` should work out of the box with prebuilt binaries. Simply run:

```bash
npm install
```

**Linux/Mac Users**: 

```bash
npm install
```

### 2. Database Setup

The database will be automatically created on first run. The SQLite database file (`hospital.db`) will be created in the project root.

A default admin account is automatically created:
- **Email**: `admin@hospital.com`
- **Username**: `admin`
- **Password**: `admin123`

**Important**: Change the default admin password after first login!

### 3. Environment Variables (Optional)

Create a `.env.local` file if you want to customize settings:

```env
DATABASE_PATH=./hospital.db
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NODE_ENV=development
```

**Note**: The `.env.local` file is optional. If not provided, the system will use default values. This file should be added to `.gitignore` and not committed to version control.

### 4. Running the Application

```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

### 5. Building for Production

```bash
npm run build
npm start
```

## User Roles

- **Admin**: Full system access, can create staff and patients
- **Doctor**: Create assignments, write prescriptions, view radiology scan results
- **Nurse**: View assignments, update task status, create reports
- **Radiologist**: View scan assignments, upload results with images, create reports
- **Patient**: View own medical history, prescriptions, assignments, and reports

## Technology Stack

- **Framework**: Next.js 16 with App Router
- **Database**: SQLite (sqlite3)
- **Authentication**: Session-based with bcrypt password hashing
- **Styling**: Tailwind CSS with shadcn/ui components
- **Language**: TypeScript

## Security Features

- Secure password hashing with bcrypt
- Session-based authentication with HTTP-only cookies
- Role-based access control
- Protected API routes and server actions
- SQL injection protection with prepared statements
- WAL mode enabled for better database concurrency

## Database Schema

The system includes the following tables:

- `patients` - Patient information and credentials
- `staff` - Hospital staff (admin, doctors, nurses, radiologists)
- `orders` - Prescriptions and clinical orders (created via prescription system)
- `assignments` - Task assignments for staff
- `notifications` - Staff notifications
- `patient_notifications` - Patient notifications
- `reports` - Medical reports with optional image uploads
- `sessions` - User session management

All tables have proper foreign key constraints for data integrity. The database uses WAL (Write-Ahead Logging) mode for better concurrency and corruption prevention.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── admin/             # Admin dashboard
│   ├── doctor/             # Doctor dashboard
│   ├── nurse/              # Nurse dashboard
│   ├── radiologist/        # Radiologist dashboard
│   ├── patient/            # Patient dashboard
│   ├── api/                # API routes
│   └── login/              # Login page
├── components/             # React components
│   ├── ui/                 # shadcn/ui components
│   └── ...                 # Feature components
├── lib/                    # Utility libraries
│   ├── db.ts              # Database connection and initialization
│   ├── auth.ts             # Authentication functions
│   └── actions/            # Server actions
├── public/                 # Static files
│   └── uploads/           # Uploaded images and scans
└── hospital.db            # SQLite database (created automatically)
```

## Key Features

### Doctor Dashboard
- Create assignments for nurses and radiologists
- Write prescriptions for patients
- View radiology scan results
- Edit and delete assignments
- View notifications

### Nurse/Radiologist Dashboard
- View assigned tasks
- Update task status (Assigned → In Progress → Completed)
- Upload scan results (Radiologist only)
- View notifications

### Patient Dashboard
- View prescriptions
- View assignments and their status
- View medical reports and scan images
- View notifications

### Admin Dashboard
- Create staff accounts (doctors, nurses, radiologists)
- Create patient accounts
- View system overview

## Important Files Explained

### Required Files (Do NOT delete)
- `next-env.d.ts` - Auto-generated TypeScript definitions by Next.js. Required for TypeScript support.
- `hospital.db-shm` - SQLite shared memory file (auto-created with WAL mode). Required for database operation.
- `hospital.db-wal` - SQLite Write-Ahead Log file (auto-created with WAL mode). Required for database operation.

### Optional Files
- `.env.local` - Environment variables file (optional). Create this only if you need to customize database path or other settings. Should be in `.gitignore`.

### Auto-Generated Files (Managed by SQLite)
- `hospital.db` - Main database file (created automatically on first run)
- `hospital.db-shm` - Shared memory file (created automatically when using WAL mode)
- `hospital.db-wal` - Write-Ahead Log file (created automatically when using WAL mode)

These SQLite files are automatically managed by the database system. The `-shm` and `-wal` files are temporary files that SQLite uses for better concurrency and performance. They will be recreated automatically if deleted (when the database is accessed).

## Notes

- The database file (`hospital.db`) is created automatically on first run
- The `-shm` and `-wal` files are automatically created by SQLite when using WAL mode
- Make sure to backup the database file regularly (including `-shm` and `-wal` files if you want a complete backup)
- For production deployments, consider using PostgreSQL or another production database
- The default admin account should be changed immediately after setup
- Uploaded images are stored in `public/uploads/` directory
- The database uses WAL mode for better performance and corruption prevention
- All database-related files (`*.db`, `*.db-shm`, `*.db-wal`) are automatically ignored by git (see `.gitignore`)

## Development

To start development:

```bash
npm run dev
```

To build for production:

```bash
npm run build
npm start
```

## License

This project is private and proprietary.
