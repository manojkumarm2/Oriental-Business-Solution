import os
import sqlite3
import shutil
from datetime import datetime

# Exact explicit paths based on your cPanel structure
LIVE_DB = '/home/hf6lflroa5da/orientalbiz_api/obs_db.db'
BACKUP_DIR = '/home/hf6lflroa5da/orientalbiz_api/db_backup'

def run_backup():
    # Verify the source database exists
    if not os.path.exists(LIVE_DB):
        raise FileNotFoundError(f"CRITICAL ERROR: Source database file not found at: {LIVE_DB}")

    # Create timestamped filename
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_filename = f"backup_{timestamp}.db"
    backup_path = os.path.join(BACKUP_DIR, backup_filename)

    conn = None
    try:
        print("Acquiring a safe state lock on the live database...")
        # Open a connection to establish a temporary safe block
        conn = sqlite3.connect(LIVE_DB, timeout=10.0)
        
        # BEGIN IMMEDIATE locks the database file against incoming writes 
        # from other threads or cPanel processes during the copy loop.
        conn.execute("BEGIN IMMEDIATE;")
        
        print("Streaming filesystem block copy...")
        # Perform a direct filesystem-level copy while the file is stable
        shutil.copy2(LIVE_DB, backup_path)
        
        # Release the lock instantly by rolling back the empty placeholder transaction
        conn.rollback()
        print(f"Success! Saved to: {backup_path}")
        
        # Clean up files older than 30 cycles
        manage_retention()
        
    except Exception as e:
        # Explicitly clear the lock if the copy fails mid-flight
        if conn:
            try:
                conn.rollback()
            except:
                pass
                
        # Clean up broken file footprints if an execution step fails
        if os.path.exists(backup_path):
            os.remove(backup_path)
        raise RuntimeError(f"Backup operation failed: {str(e)}")
    finally:
        if conn:
            conn.close()

def manage_retention():
    files = [os.path.join(BACKUP_DIR, f) for f in os.listdir(BACKUP_DIR) if f.endswith('.db')]
    files.sort(key=os.path.getmtime)
    while len(files) > 30:
        os.remove(files.pop(0))

if __name__ == '__main__':
    run_backup()