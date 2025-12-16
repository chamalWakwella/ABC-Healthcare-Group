import sqlite3 from "sqlite3"
import { join } from "path"

// On Vercel, use /tmp directory (only writable location)
// WARNING: Data in /tmp is ephemeral and will be lost on each deployment
const isVercel = process.env.VERCEL === "1" || process.env.VERCEL_ENV
const dbPath = process.env.DATABASE_PATH || 
  (isVercel ? "/tmp/hospital.db" : join(process.cwd(), "hospital.db"))

let db: sqlite3.Database | null = null
let isInitializing = false
let initPromise: Promise<void> | null = null

export function getDatabase(): sqlite3.Database {
  if (db) {
    return db
  }

  try {
    console.log(`Opening database at: ${dbPath} (Vercel: ${isVercel})`)
    
    // Use WAL mode for better concurrency
    db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
      if (err) {
        console.error("Error opening database:", err)
        console.error("Database path:", dbPath)
        // If database is corrupted, try to delete and recreate
        if (err.message.includes("CORRUPT") || err.message.includes("malformed")) {
          console.log("Database corrupted, will recreate on next access")
          db = null
          return
        }
        // On Vercel, if we can't write, log the error but don't throw
        if (isVercel && (err.message.includes("readonly") || err.message.includes("permission"))) {
          console.error("⚠️ WARNING: Cannot write to database on Vercel. SQLite will not work properly.")
          console.error("⚠️ You MUST migrate to a cloud database (Vercel Postgres, Turso, etc.)")
        }
        throw err
      }
      console.log("Database opened successfully")
    })

    // Enable WAL mode for better concurrency (but not on Vercel as it may cause issues)
    if (!isVercel) {
      db.run("PRAGMA journal_mode = WAL")
    }
    db.run("PRAGMA foreign_keys = ON")
    db.run("PRAGMA synchronous = NORMAL")
    
    // Initialize database if tables don't exist
    if (!initPromise) {
      initPromise = initializeDatabase(db)
    }
    
    return db
  } catch (error: any) {
    console.error("Failed to get database:", error)
    throw error
  }
}

async function initializeDatabase(db: sqlite3.Database): Promise<void> {
  if (isInitializing) {
    return initPromise!
  }
  isInitializing = true

  return new Promise((resolve, reject) => {
    // Check if patients table exists
    db.get(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='patients'
    `, (err, row: any) => {
      if (err) {
        console.error("Error checking tables:", err)
        isInitializing = false
        reject(err)
        return
      }

      if (!row) {
        console.log("Initializing database tables...")
        // Create tables from schema
        const schema = `
          PRAGMA foreign_keys = ON;

          CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            phone TEXT,
            dob TEXT,
            gender TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            user_id TEXT
          );

          CREATE TABLE IF NOT EXISTS staff (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            role TEXT NOT NULL,
            category TEXT,
            email TEXT NOT NULL UNIQUE,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            phone TEXT,
            is_available INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            user_id TEXT
          );

          CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            doctor_id INTEGER NOT NULL,
            order_type TEXT NOT NULL,
            notes TEXT,
            status TEXT NOT NULL DEFAULT 'Pending',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE,
            FOREIGN KEY(doctor_id) REFERENCES staff(id) ON DELETE CASCADE
          );

          CREATE TABLE IF NOT EXISTS assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            doctor_id INTEGER NOT NULL,
            assignee_staff_id INTEGER NOT NULL,
            task_type TEXT NOT NULL,
            notes TEXT,
            status TEXT NOT NULL DEFAULT 'Assigned',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE,
            FOREIGN KEY(doctor_id) REFERENCES staff(id) ON DELETE CASCADE,
            FOREIGN KEY(assignee_staff_id) REFERENCES staff(id) ON DELETE CASCADE
          );

          CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            staff_id INTEGER NOT NULL,
            message TEXT NOT NULL,
            is_read INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY(staff_id) REFERENCES staff(id) ON DELETE CASCADE
          );

          CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            created_by_staff_id INTEGER NOT NULL,
            report_type TEXT NOT NULL,
            report_text TEXT,
            image_filename TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE,
            FOREIGN KEY(created_by_staff_id) REFERENCES staff(id) ON DELETE CASCADE
          );

          CREATE TABLE IF NOT EXISTS patient_notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            message TEXT NOT NULL,
            is_read INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE
          );

          CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            user_type TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
          );
        `

        db.exec(schema, (err) => {
          if (err) {
            console.error("Error creating tables:", err)
            isInitializing = false
            reject(err)
            return
          }

          console.log("Database tables created successfully")

          // Create default admin if it doesn't exist
          db.get("SELECT id FROM staff WHERE username = ?", ["admin"], (err, row: any) => {
            if (err) {
              console.error("Error checking admin:", err)
              isInitializing = false
              resolve() // Don't fail if admin check fails
              return
            }

            if (!row) {
              const bcrypt = require("bcryptjs")
              const hashedPassword = bcrypt.hashSync("admin123", 10)
              db.run(`
                INSERT INTO staff (name, role, category, email, username, password_hash, is_available)
                VALUES (?, ?, ?, ?, ?, ?, ?)
              `, ["Administrator", "admin", "Management", "admin@hospital.com", "admin", hashedPassword, 1], (err) => {
                if (err) {
                  console.error("Error creating admin:", err)
                } else {
                  console.log("Default admin created: admin@hospital.com / admin123")
                }
                isInitializing = false
                resolve()
              })
            } else {
              isInitializing = false
              resolve()
            }
          })
        })
      } else {
        isInitializing = false
        resolve()
      }
    })
  })
}

// Ensure database is initialized before executing queries
async function ensureInitialized(): Promise<void> {
  if (initPromise) {
    await initPromise
  } else {
    const database = getDatabase()
    if (initPromise) {
      await initPromise
    }
  }
}

// Helper functions to promisify database operations
export async function dbGet(sql: string, params: any[] = []): Promise<any> {
  await ensureInitialized()
  return new Promise((resolve, reject) => {
    try {
      const database = getDatabase()
      
      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        reject(new Error("Database query timeout - SQLite may not be working on Vercel. Please migrate to a cloud database."))
      }, 10000) // 10 second timeout
      
      database.get(sql, params, (err, row) => {
        clearTimeout(timeout)
        if (err) {
          console.error("Database query error:", err)
          // If database is corrupted, try to recreate
          if (err.message.includes("CORRUPT") || err.message.includes("malformed")) {
            console.error("Database corruption detected, please restart the server")
            reject(new Error("Database corruption detected. Please delete hospital.db and restart the server."))
          } else if (err.message.includes("no such table")) {
            console.error("Table not found. Database may not be initialized. Error:", err.message)
            reject(new Error("Database tables not found. Please restart the server to initialize the database."))
          } else {
            reject(err)
          }
        } else {
          resolve(row)
        }
      })
    } catch (error: any) {
      reject(error)
    }
  })
}

export async function dbAll(sql: string, params: any[] = []): Promise<any[]> {
  await ensureInitialized()
  return new Promise((resolve, reject) => {
    try {
      const database = getDatabase()
      
      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        reject(new Error("Database query timeout - SQLite may not be working on Vercel. Please migrate to a cloud database."))
      }, 10000) // 10 second timeout
      
      database.all(sql, params, (err, rows) => {
        clearTimeout(timeout)
        if (err) {
          console.error("Database query error:", err)
          // If database is corrupted, try to recreate
          if (err.message.includes("CORRUPT") || err.message.includes("malformed")) {
            console.error("Database corruption detected, please restart the server")
            reject(new Error("Database corruption detected. Please delete hospital.db and restart the server."))
          } else if (err.message.includes("no such table")) {
            console.error("Table not found. Database may not be initialized. Error:", err.message)
            reject(new Error("Database tables not found. Please restart the server to initialize the database."))
          } else {
            reject(err)
          }
        } else {
          resolve(rows || [])
        }
      })
    } catch (error: any) {
      reject(error)
    }
  })
}

export async function dbRun(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  await ensureInitialized()
  return new Promise((resolve, reject) => {
    try {
      const database = getDatabase()
      
      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        reject(new Error("Database query timeout - SQLite may not be working on Vercel. Please migrate to a cloud database."))
      }, 10000) // 10 second timeout
      
      database.run(sql, params, function(err) {
        clearTimeout(timeout)
        if (err) {
          console.error("Database query error:", err)
          // If database is corrupted, try to recreate
          if (err.message.includes("CORRUPT") || err.message.includes("malformed")) {
            console.error("Database corruption detected, please restart the server")
            reject(new Error("Database corruption detected. Please delete hospital.db and restart the server."))
          } else if (err.message.includes("no such table")) {
            console.error("Table not found. Database may not be initialized. Error:", err.message)
            reject(new Error("Database tables not found. Please restart the server to initialize the database."))
          } else {
            reject(err)
          }
        } else {
          resolve({ lastID: this.lastID, changes: this.changes })
        }
      })
    } catch (error: any) {
      reject(error)
    }
  })
}

export function closeDatabase() {
  if (db) {
    db.close((err) => {
      if (err) console.error("Error closing database:", err)
    })
    db = null
    isInitializing = false
    initPromise = null
  }
}
