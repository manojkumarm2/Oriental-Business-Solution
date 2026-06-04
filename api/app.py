import os
import re
import traceback
import logging
from logging.handlers import RotatingFileHandler
import time
import json
from flask import Flask, jsonify, request, g, send_file
from flask_cors import CORS
from jose import jwt
import requests
from functools import wraps
import sqlite3
from dotenv import load_dotenv
from datetime import datetime, timedelta
import uuid

# Load the environment variables right away
load_dotenv()

from tax_managers import PersonalTaxManager, CorporateTaxManager, CvitpTaxManager, DocumentSignManager, DB_FILE, get_db_connection
from call_manager import CallManager, CvitpCallHistoryManager
from fax_manager import FaxManager

app = Flask(__name__)
application = app
CORS(app)

# --- Custom Logging Setup with Dynamic User Tracking ---
class ContextualUserFilter(logging.Filter):
    """
    Injects the active request's user email dynamically 
    into every log record context block.
    """
    def filter(self, record):
        try:
            from flask import g
            # If g.user_email exists, use it; otherwise default to 'Anonymous'
            record.user_email = getattr(g, 'user_email', 'Anonymous')
        except RuntimeError:
            # Fallback if a log happens outside of an active HTTP web request context
            record.user_email = 'System'
        return True

def setup_logger():
    obs_logger = logging.getLogger('obs_api')
    obs_logger.setLevel(logging.INFO)
    
    formatter = logging.Formatter('[%(asctime)s] [%(user_email)s] %(levelname)s in %(module)s: %(message)s')
    
    # 🎯 TIME CONVERSION FIX: Explicitly shift UTC to Eastern Time (EST/EDT)
    def eastern_time_converter(*args):
        # 1. Grab raw Coordinated Universal Time (UTC)
        utc_now = datetime.utcnow()
        
        # 2. Check if the current date falls within Daylight Saving Time (EDT = UTC-4) 
        # or Standard Time (EST = UTC-5). 
        # For 2026, EDT started March 8 and ends November 1.
        now_year = utc_now.year
        
        # Approximate boundary logic for Eastern Daylight Time (EDT)
        # March (after 2nd Sunday) through November (before 1st Sunday)
        dst_start = datetime(now_year, 3, 8, 2, 0, 0)
        dst_end = datetime(now_year, 11, 1, 2, 0, 0)
        
        if dst_start <= utc_now < dst_end:
            localized_time = utc_now - timedelta(hours=4)  # EDT Shift
        else:
            localized_time = utc_now - timedelta(hours=5)  # EST Shift
            
        return localized_time.timetuple()
        
    formatter.converter = eastern_time_converter
    
    # Resolved dynamic absolute path to prevent server permission routing errors
    log_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'api.log')
    file_handler = RotatingFileHandler(log_path, maxBytes=10*1024*1024, backupCount=5)
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(formatter)
    
    if not obs_logger.handlers:
        file_handler.addFilter(ContextualUserFilter())
        obs_logger.addHandler(file_handler)
    
    return obs_logger

logger = setup_logger()

logger.info("=== Oriental Biz API Application Starting/Restarting ===")

@app.before_request
def log_request_info():
    if request.method == 'OPTIONS':
        return
    g.start_time = time.time()
    
    # Early token peek strictly to extract the user email for incoming request logs
    token = request.headers.get('Authorization', '').split()
    if len(token) == 2:
        try:
            unverified_claims = jwt.get_unverified_claims(token[1])
            g.user_email = (unverified_claims.get('preferred_username') or unverified_claims.get('upn') or unverified_claims.get('email') or '').lower()
        except Exception:
            pass
            
    req_body = ""
    try:
        if request.is_json:
            req_body = json.dumps(request.get_json(silent=True))
        elif request.data:
            req_body = request.data.decode('utf-8', errors='ignore')
    except Exception as e:
        req_body = f"<Error reading body: {str(e)}>"

    logger.info(f"Incoming Request: {request.method} {request.url} | IP: {request.remote_addr}")
    if req_body:
        logger.info(f"Request Body: {req_body}")

@app.after_request
def log_response_info(response):
    if request.method == 'OPTIONS':
        return response
    duration = time.time() - g.start_time if hasattr(g, 'start_time') else 0
    logger.info(f"Response: {request.method} {request.url} | Status: {response.status_code} | Duration: {duration:.4f}s")
    if response.status_code >= 400:
        logger.error(f"Error Response Data: {response.get_data(as_text=True)}")
    return response
# ----------------------------

TENANT_ID = os.getenv('AZURE_TENANT_ID', "c4ea64ee-34b6-4a18-9339-8aff143c12d4")
CLIENT_ID = os.getenv('AZURE_CLIENT_ID', "ec39786f-9998-4a43-aef9-2d8148338b0b")
DISCOVERY_URL = f'https://login.microsoftonline.com/{TENANT_ID}/v2.0/.well-known/openid-configuration'

ADMIN_EMAILS = {'info@orientalbiz.ca', 'cvitp@orientalbiz.ca', 'admin@orientalbiz.ca', 'madhu@orientalbiz.ca'}

def validate_token(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == 'OPTIONS':
            return jsonify({'status': 'ok'}), 200
        token = request.headers.get('Authorization', '').split()
        if len(token) != 2:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            token_str = token[1]
            jwks_uri = requests.get(DISCOVERY_URL).json()['jwks_uri']
            jwks = requests.get(jwks_uri).json()
            unverified_claims = jwt.get_unverified_claims(token_str)
            
            valid_audiences = [CLIENT_ID, f"api://{CLIENT_ID}"]
            if unverified_claims.get('aud') not in valid_audiences:
                 return jsonify({'message': 'Invalid audience'}), 401

            g.user_email = (unverified_claims.get('preferred_username') or unverified_claims.get('upn') or unverified_claims.get('email') or '').lower()
            jwt.decode(token_str, jwks, algorithms=['RS256'], audience=unverified_claims.get('aud'))
            return f(*args, **kwargs)
        except Exception as e:
            logger.warning(f"Token validation failed: {str(e)}")
            return jsonify({'message': 'Token is invalid', 'error': str(e)}), 401
    return decorated

def run_e164_phone_migration(cursor):
    target_tables = ['customers', 'corporate', 'cvitpStatus']
    fallback_number = "+10000000000"

    for table in target_tables:
        print(f"🔄 Starting E.164 formatting fallback migration for table: {table}")
        cursor.execute(f"SELECT id, mobile FROM {table};")
        records = cursor.fetchall()
        
        for record_id, raw_mobile in records:
            cleaned_number = fallback_number 
            
            if raw_mobile:
                mobile_str = str(raw_mobile).strip()
                
                if mobile_str.upper() not in ['NULL', 'N/A', '', 'NONE', 'NAN']:
                    digits_only = re.sub(r'[^0-9]', '', mobile_str)
                    
                    if len(digits_only) == 10:
                        cleaned_number = f"+1{digits_only}"
                    elif len(digits_only) == 11 and digits_only.startswith('1'):
                        cleaned_number = f"+{digits_only}"
                    elif len(digits_only) >= 10:
                        cleaned_number = f"+1{digits_only[-10:]}"
            
            update_query = f"UPDATE {table} SET mobile = ? WHERE id = ?;"
            cursor.execute(update_query, (cleaned_number, record_id))
    print("✅ All target tables completely migrated to E.164 metrics.")

def init_sqlite_db():
    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, spouse TEXT DEFAULT '', 
                mobile TEXT NOT NULL, email TEXT DEFAULT '', address TEXT DEFAULT '', city TEXT DEFAULT '', 
                invoiceDate TEXT DEFAULT '', filingDate TEXT DEFAULT '', draftSentDate TEXT DEFAULT '', 
                invoiceNo TEXT DEFAULT '', invoiceAmount TEXT DEFAULT '', paymentReceived TEXT DEFAULT '', 
                dob TEXT DEFAULT '', workStatus TEXT DEFAULT '', dueDate TEXT DEFAULT '', updatedBy TEXT DEFAULT '', 
                status TEXT DEFAULT 'Pending', familyDetails TEXT DEFAULT '', history TEXT DEFAULT '', 
                notes TEXT DEFAULT '', otherComments TEXT DEFAULT '', assignedTo TEXT DEFAULT '', 
                draftStatus TEXT DEFAULT '', receivedDate TEXT DEFAULT '', 
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS corporate (
                id INTEGER PRIMARY KEY AUTOINCREMENT, businessName TEXT NOT NULL, contactName TEXT DEFAULT '', 
                businessNumber TEXT DEFAULT '', address TEXT DEFAULT '', email TEXT DEFAULT '', yearEnd TEXT DEFAULT '', 
                todoList TEXT DEFAULT '', details TEXT DEFAULT '', mobile TEXT DEFAULT '', dateFiled TEXT DEFAULT '', 
                corporateIncomeTax TEXT DEFAULT '', status TEXT DEFAULT 'Pending', invoiceAmount TEXT DEFAULT '', 
                invoiceStatus TEXT DEFAULT '', paymentStatus TEXT DEFAULT '', notes TEXT DEFAULT '', 
                payrollStatus TEXT DEFAULT '', payrollAccount TEXT DEFAULT '', payrollDateFiled TEXT DEFAULT '', 
                hstPeriod TEXT DEFAULT '', hstDueDate TEXT DEFAULT '', hstStatus TEXT DEFAULT '', 
                hstDateFiled TEXT DEFAULT '', hstInvoiceStatus TEXT DEFAULT '', hstNotes TEXT DEFAULT '', 
                assignedTo TEXT DEFAULT '', updatedBy TEXT DEFAULT '', hstAvailable TEXT DEFAULT '', 
                payrollAvailable TEXT DEFAULT '', payrollDueDate TEXT DEFAULT '', 
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS cvitpStatus (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                mobile TEXT NOT NULL,
                email TEXT DEFAULT '',
                status TEXT DEFAULT 'Pending',
                assignedTo TEXT DEFAULT '',
                coin TEXT DEFAULT '',
                receivedDate TEXT DEFAULT '',
                filledDate TEXT DEFAULT '',
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS cvitpCallHistory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                number TEXT NOT NULL,
                type TEXT NOT NULL,
                time TEXT NOT NULL,
                status TEXT,
                duration INTEGER,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS personal_tax (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER,
                tax_year INTEGER,
                onedrive_item_id TEXT,
                file_name TEXT,
                portal_token TEXT,
                status TEXT DEFAULT 'Draft_Uploaded',
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS cvitp_tax (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER,
                tax_year INTEGER,
                onedrive_item_id TEXT,
                file_name TEXT,
                portal_token TEXT,
                status TEXT DEFAULT 'Draft_Uploaded',
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )''')
        cursor.execute('CREATE TABLE IF NOT EXISTS acs_users (email TEXT PRIMARY KEY, acs_user_id TEXT NOT NULL, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)')
        cursor.execute('CREATE TABLE IF NOT EXISTS bridged_calls (call_id TEXT PRIMARY KEY, loop_count INTEGER DEFAULT 0, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS fax_tokens (
                token TEXT PRIMARY KEY,
                customer_email TEXT,
                status TEXT DEFAULT 'Pending',
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS fax_logs (
                fax_id TEXT PRIMARY KEY,
                sender_email TEXT,
                sender_name TEXT,
                to_number TEXT,
                status TEXT DEFAULT 'queued',
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )''')
        
        for table in ['personal_tax', 'cvitp_tax']:
            cursor.execute(f"PRAGMA table_info({table})")
            columns = [col[1] for col in cursor.fetchall()]
            if 'shared_link' not in columns:
                cursor.execute(f"ALTER TABLE {table} ADD COLUMN shared_link TEXT")
            if 'client_location' not in columns:
                cursor.execute(f"ALTER TABLE {table} ADD COLUMN client_location TEXT")
            if 'agreed_to_file' not in columns:
                cursor.execute(f"ALTER TABLE {table} ADD COLUMN agreed_to_file BOOLEAN DEFAULT 0")
            if 'consent_timestamp' not in columns:
                cursor.execute(f"ALTER TABLE {table} ADD COLUMN consent_timestamp TEXT")
            if 'public_ip' not in columns:
                cursor.execute(f"ALTER TABLE {table} ADD COLUMN public_ip TEXT")
            if 'resolved_location' not in columns:
                cursor.execute(f"ALTER TABLE {table} ADD COLUMN resolved_location TEXT")
            if 'device_platform' not in columns:
                cursor.execute(f"ALTER TABLE {table} ADD COLUMN device_platform TEXT")
            if 'browser_engine' not in columns:
                cursor.execute(f"ALTER TABLE {table} ADD COLUMN browser_engine TEXT")
            if 'typed_name' not in columns:
                cursor.execute(f"ALTER TABLE {table} ADD COLUMN typed_name TEXT")
                
        cursor.execute("PRAGMA table_info(cvitpStatus)")
        columns = [col[1] for col in cursor.fetchall()]
        if 'email' not in columns:
            cursor.execute("ALTER TABLE cvitpStatus ADD COLUMN email TEXT")
        if 'yearsOfFiling' not in columns:
            cursor.execute("ALTER TABLE cvitpStatus ADD COLUMN yearsOfFiling TEXT DEFAULT ''")
                
        cursor.execute("PRAGMA table_info(cvitpCallHistory)")
        columns = [col[1] for col in cursor.fetchall()]
        if 'duration' not in columns:
            cursor.execute("ALTER TABLE cvitpCallHistory ADD COLUMN duration INTEGER")

        cursor.execute("PRAGMA table_info(fax_logs)")
        columns = [col[1] for col in cursor.fetchall()]
        if 'direction' not in columns:
            cursor.execute("ALTER TABLE fax_logs ADD COLUMN direction TEXT DEFAULT 'outbound'")
        if 'media_url' not in columns:
            cursor.execute("ALTER TABLE fax_logs ADD COLUMN media_url TEXT")
        if 'from_number' not in columns:
            cursor.execute("ALTER TABLE fax_logs ADD COLUMN from_number TEXT")

        conn.commit()

@app.route('/api/health', methods=['GET'])
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'sqliteConnected': os.path.exists(DB_FILE)})

# --- Personal Tax Routes ---
@app.route('/api/customers', methods=['GET'])
@app.route('/customers', methods=['GET'])
@validate_token
def get_customers():
    rows = PersonalTaxManager.get_all()
    if g.user_email in ADMIN_EMAILS:
        return jsonify(rows)
    for row in rows:
        row['invoiceAmount'] = ''
        row['paymentReceived'] = ''
    return jsonify(rows)

@app.route('/api/customers', methods=['POST'])
@app.route('/customers', methods=['POST'])
@validate_token
def create_customer():
    try:
        customer_id = PersonalTaxManager.create(request.get_json())
        return jsonify({'id': customer_id, 'status': 'created'}), 201
    except ValueError as e:
        logger.warning(f"Validation error in create_customer: {str(e)}")
        return jsonify({'message': str(e)}), 400

@app.route('/api/customers/<customer_id>', methods=['PUT'])
@app.route('/customers/<customer_id>', methods=['PUT'])
@validate_token
def update_customer(customer_id):
    if PersonalTaxManager.update(customer_id, request.get_json()):
        return jsonify({'status': 'updated'})
    return jsonify({'message': 'Customer not found'}), 404

@app.route('/api/customers/<customer_id>', methods=['DELETE'])
@app.route('/customers/<customer_id>', methods=['DELETE'])
@validate_token
def delete_customer(customer_id):
    if g.user_email not in ADMIN_EMAILS:
        return jsonify({'message': 'Unauthorized'}), 403
    if PersonalTaxManager.delete(customer_id):
        return jsonify({'message': 'Deleted successfully'})
    return jsonify({'message': 'Not found'}), 404

# --- Corporate Tax Routes ---
@app.route('/api/corporate', methods=['GET'])
@app.route('/corporate', methods=['GET'])
@validate_token
def get_corporate():
    rows = CorporateTaxManager.get_all()
    if g.user_email in ADMIN_EMAILS:
        return jsonify(rows)
    filtered = []
    for row in rows:
        if str(row.get('assignedTo', '')).lower() == g.user_email:
            row['invoiceAmount'] = ''
            row['corporateIncomeTax'] = ''
        filtered.append(row)
    return jsonify(filtered)

@app.route('/api/corporate', methods=['POST'])
@app.route('/corporate', methods=['POST'])
@validate_token
def create_corporate():
    try:
        corp_id = CorporateTaxManager.create(request.get_json())
        return jsonify({'id': corp_id, 'status': 'created'}), 201
    except ValueError as e:
        logger.warning(f"Validation error in create_corporate: {str(e)}")
        return jsonify({'message': str(e)}), 400

@app.route('/api/corporate/<corporate_id>', methods=['PUT'])
@app.route('/corporate/<corporate_id>', methods=['PUT'])
@validate_token
def update_corporate(corporate_id):
    if CorporateTaxManager.update(corporate_id, request.get_json()):
        return jsonify({'status': 'updated'})
    return jsonify({'message': 'Record not found'}), 404

@app.route('/api/corporate/<corporate_id>', methods=['DELETE'])
@app.route('/corporate/<corporate_id>', methods=['DELETE'])
@validate_token
def delete_corporate(corporate_id):
    if g.user_email not in ADMIN_EMAILS:
        return jsonify({'message': 'Unauthorized'}), 403
    if CorporateTaxManager.delete(corporate_id):
        return jsonify({'message': 'Deleted successfully'})
    return jsonify({'message': 'Not found'}), 404

# --- CVITP Tax Status Routes ---
@app.route('/api/cvitp', methods=['POST'])
@app.route('/cvitp', methods=['POST'])
@validate_token
def create_cvitp_entry():
    try:
        entry_id = CvitpTaxManager.create(request.get_json())
        return jsonify({'id': entry_id, 'status': 'created'}), 201
    except ValueError as e:
        logger.warning(f"Validation error in create_cvitp_entry: {str(e)}")
        return jsonify({'message': str(e)}), 400
    except Exception as e:
        logger.error(f"Server error handling CVITP record creation: {str(e)}")
        return jsonify({'message': 'Server error handling record creation.'}), 500

@app.route('/api/cvitp', methods=['GET'])
@app.route('/cvitp', methods=['GET'])
@validate_token
def get_cvitp_entries():
    return jsonify(CvitpTaxManager.get_all()), 200

@app.route('/api/cvitp/<entry_id>', methods=['PUT'])
@app.route('/cvitp/<entry_id>', methods=['PUT'])
@validate_token
def update_cvitp_entry(entry_id):
    try:
        if CvitpTaxManager.update(entry_id, request.get_json()):
            return jsonify({'status': 'updated'}), 200
        return jsonify({'message': 'CVITP entry record not found'}), 404
    except ValueError as e:
        logger.warning(f"Validation error in update_cvitp_entry: {str(e)}")
        return jsonify({'message': str(e)}), 400
    except Exception as e:
        logger.error(f"Server error handling CVITP record update: {str(e)}")
        return jsonify({'message': 'Server error handling record update.'}), 500

# --- Staff Dashboard Routes ---
@app.route('/api/staff/initialize-document', methods=['POST'])
@app.route('/staff/initialize-document', methods=['POST'])
@validate_token
def initialize_document_flow():
    try:
        result = DocumentSignManager.initialize_document(request.get_json())
        return jsonify(result), 200
    except ValueError as e:
        logger.warning(f"Validation error in initialize_document_flow: {str(e)}")
        return jsonify({"error": str(e)}), 400
    except Exception as err:
        logger.error(f"Server error handling initialize_document_flow: {str(err)}")
        return jsonify({"error": "Database initialization failed."}), 500

@app.route('/api/staff/esign-details/<tax_type>/<customer_id>', methods=['GET'])
@app.route('/staff/esign-details/<tax_type>/<customer_id>', methods=['GET'])
@validate_token
def get_esign_details(tax_type, customer_id):
    try:
        if tax_type not in ['Personal', 'CVITP']:
            raise ValueError("Invalid tax_type. Must be 'Personal' or 'CVITP'")
        record = DocumentSignManager.get_esign_details_by_customer_id(customer_id, tax_type)
        return jsonify(record), 200
    except ValueError as e:
        logger.warning(f"Validation error in get_esign_details: {str(e)}")
        return jsonify({"error": str(e)}), 404
    except Exception as err:
        logger.error(f"Server error handling get_esign_details: {str(err)}")
        return jsonify({"error": "Failed to retrieve e-sign details."}), 500

# --- Customer Portal Public Routes ---
@app.route('/api/public/review-tax/<token>', methods=['GET'])
@app.route('/public/review-tax/<token>', methods=['GET'])
def get_public_tax_document(token):
    try:
        record = DocumentSignManager.get_document_by_token(token)
        return jsonify({
            "tax_year": record.get("tax_year"),
            "tax_type": record.get("tax_type"),
            "file_name": record.get("file_name"),
            "status": record.get("status"),
            "preview_url": record.get("shared_link") or f"https://onedrive.live.com/embed?resid={record.get('onedrive_item_id')}&action=embedview&wdDownloadButton=False&wdPrintButton=False"
        }), 200
    except ValueError as e:
        logger.warning(f"Validation error in get_public_tax_document: {str(e)}")
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        logger.error(f"Server error in get_public_tax_document: {str(e)}")
        return jsonify({"error": "Server error processing document"}), 500

@app.route('/api/public/review-tax/<token>/sign', methods=['POST'])
@app.route('/public/review-tax/<token>/sign', methods=['POST'])
def sign_public_tax_document(token):
    try:
        result = DocumentSignManager.submit_signature(token, request.get_json())
        return jsonify(result), 200
    except ValueError as e:
        logger.warning(f"Validation error in sign_public_tax_document: {str(e)}")
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Server error in sign_public_tax_document: {str(e)}")
        return jsonify({"error": "Server error submitting signature"}), 500

# --- Call Management Routes ---
@app.route('/api/acs/token', methods=['GET'])
@app.route('/acs/token', methods=['GET'])
@validate_token
def get_acs_token():
    return jsonify(CallManager.get_acs_token_for_user(g.user_email))

@app.route('/api/incomingCall', methods=['POST'])
@app.route('/incomingCall', methods=['POST'])
def incoming_call():
    logger.info("Handling incoming call webhook.")
    response = CallManager.handle_incoming_webhook(request.get_json(force=True), request.url_root)
    return jsonify(response), 200

@app.route("/api/callback", methods=["POST"])
@app.route("/callback", methods=["POST"])
def call_callback():
    logger.info("Handling call lifecycle callback.")
    CallManager.handle_lifecycle_callback(request.json)
    return jsonify({"status": "success"}), 200

@app.route('/api/call-status/<path:phone_number>', methods=['GET'])
@app.route('/call-status/<path:phone_number>', methods=['GET'])
def get_call_status(phone_number):
    return jsonify({"is_answered": CallManager.get_answered_status(phone_number)}), 200

@app.route('/api/cvitp/call-history', methods=['GET'])
@app.route('/cvitp/call-history', methods=['GET'])
@validate_token
def get_cvitp_call_history():
    try:
        logs = CvitpCallHistoryManager.get_history()
        return jsonify(logs), 200
    except Exception as e:
        logger.error(f"Error retrieving call history: {str(e)}")
        return jsonify({'message': 'Failed retrieving communication logs.'}), 500

@app.route('/api/cvitp/call-history', methods=['POST'])
@app.route('/cvitp/call-history', methods=['POST'])
@validate_token
def create_cvitp_call_log():
    try:
        log_id = CvitpCallHistoryManager.log_call(request.get_json())
        return jsonify({'id': log_id, 'status': 'logged'}), 201
    except ValueError as e:
        logger.warning(f"Validation error in create_cvitp_call_log: {str(e)}")
        return jsonify({'message': str(e)}), 400
    except Exception as e:
        logger.error(f"Error archiving communication metric: {str(e)}")
        return jsonify({'message': 'Failed archiving communication metric.'}), 500

# --- Fax Management Routes ---
@app.route('/api/faxes', methods=['GET'])
@app.route('/faxes', methods=['GET'])
@validate_token
def get_faxes():
    if g.user_email not in ADMIN_EMAILS:
        return jsonify({'message': 'Unauthorized access.'}), 403
        
    try:
        with sqlite3.connect(DB_FILE) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            # Retrieve latest faxes first
            cursor.execute("SELECT * FROM fax_logs ORDER BY createdAt DESC")
            rows = cursor.fetchall()
            
        faxes = []
        for row in rows:
            faxes.append({
                'fax_id': row['fax_id'],
                'date_time': row['createdAt'],
                'name': row['sender_name'],
                'email': row['sender_email'],
                'to_number': row['to_number'],
                'from_number': row['from_number'],
                'status': row['status'],
                'direction': row['direction'],
                'document_link': row['media_url']
            })
            
        return jsonify(faxes), 200
    except Exception as e:
        logger.error(f"Failed to retrieve faxes: {str(e)}")
        return jsonify({'message': 'Server error reading faxes.'}), 500

@app.route('/api/send-fax', methods=['POST'])
@validate_token
def send_fax_route():
    try:
        to_number = request.form.get('to_number')
        file = request.files.get('file')
        
        if not to_number or not file:
            return jsonify({'detail': 'Missing recipient number or document.'}), 400
            
        file_id = str(uuid.uuid4())
        file_name = f"{file_id}.pdf"
        
        sender_name = request.form.get('sender_name', 'Oriental Biz')
        sender_email = request.form.get('sender_email', getattr(g, 'user_email', ''))
        department = request.form.get('department', '')
        subject = request.form.get('subject', '')
        message = request.form.get('message', '')

        raw_bytes = file.read()
        try:
            final_pdf_bytes = FaxManager.create_cover_page_and_merge(
                raw_bytes,
                to_number=to_number,
                sender_name=sender_name,
                sender_email=sender_email,
                department=department,
                subject=subject,
                message=message
            )
        except Exception as e:
            logger.error(f"Cover page generation failed: {e}\n{traceback.format_exc()}")
            # Gracefully fallback to sending the original unmerged document
            final_pdf_bytes = raw_bytes

        # Let OneDrive handle hosting the file
        target_drive = sender_email if sender_email in ADMIN_EMAILS else "admin@orientalbiz.ca"
        media_url = FaxManager.upload_to_onedrive(final_pdf_bytes, file_name, target_user=target_drive)
        result = FaxManager.send_fax(to_number, media_url, sender_email, sender_name)
        fax_id = result.get('fax_id')
        if fax_id and sender_email:
            with sqlite3.connect(DB_FILE) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO fax_logs (fax_id, sender_email, sender_name, to_number, direction, media_url)
                    VALUES (?, ?, ?, ?, 'outbound', ?)
                """, (fax_id, sender_email, sender_name, to_number, media_url))
                conn.commit()
        
        return jsonify(result), 200
    except ValueError as e:
        logger.warning(f"Validation error in send_fax_route: {str(e)}")
        return jsonify({'detail': str(e)}), 400
    except Exception as e:
        logger.error(f"Server error handling send_fax: {str(e)}")
        return jsonify({'detail': 'Failed to process fax request.'}), 500

@app.route('/api/fax/generate-token', methods=['POST'])
@validate_token
def generate_fax_token():
    try:
        data = request.get_json()
        email = data.get('email', '')
        token = str(uuid.uuid4())
        with sqlite3.connect(DB_FILE) as conn:
            cursor = conn.cursor()
            cursor.execute("INSERT INTO fax_tokens (token, customer_email) VALUES (?, ?)", (token, email))
            conn.commit()
        return jsonify({'token': token}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/public/fax/validate/<token>', methods=['GET'])
def validate_fax_token(token):
    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT status, customer_email FROM fax_tokens WHERE token = ?", (token,))
        row = cursor.fetchone()
        if not row:
            return jsonify({'error': 'Invalid token.'}), 404
        if row[0] != 'Pending':
            return jsonify({'error': 'This secure link has already been used to transmit a fax or has expired.'}), 400
        return jsonify({'status': row[0], 'email': row[1]}), 200

@app.route('/api/public/send-fax/<token>', methods=['POST'])
def public_send_fax(token):
    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT status FROM fax_tokens WHERE token = ?", (token,))
        row = cursor.fetchone()
        if not row or row[0] != 'Pending':
            return jsonify({'detail': 'Invalid or expired fax token.'}), 400
            
    try:
        to_number = request.form.get('to_number')
        file = request.files.get('file')
        
        if not to_number or not file:
            return jsonify({'detail': 'Missing recipient number or document.'}), 400
            
        file_id = str(uuid.uuid4())
        file_name = f"{file_id}.pdf"
        
        sender_name = request.form.get('sender_name', 'Oriental Biz Client')
        sender_email = request.form.get('sender_email', '')
        department = request.form.get('department', '')
        subject = request.form.get('subject', '')
        message = request.form.get('message', '')

        raw_bytes = file.read()
        try:
            final_pdf_bytes = FaxManager.create_cover_page_and_merge(
                raw_bytes,
                to_number=to_number,
                sender_name=sender_name,
                sender_email=sender_email,
                department=department,
                subject=subject,
                message=message
            )
        except Exception as e:
            logger.error(f"Cover page generation failed: {e}\n{traceback.format_exc()}")
            final_pdf_bytes = raw_bytes
        
        target_drive = sender_email if sender_email in ADMIN_EMAILS else "admin@orientalbiz.ca"
        media_url = FaxManager.upload_to_onedrive(final_pdf_bytes, file_name, target_user=target_drive)
        result = FaxManager.send_fax(to_number, media_url, sender_email, sender_name)
        fax_id = result.get('fax_id')
        if fax_id and sender_email:
            with sqlite3.connect(DB_FILE) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO fax_logs (fax_id, sender_email, sender_name, to_number, direction, media_url)
                    VALUES (?, ?, ?, ?, 'outbound', ?)
                """, (fax_id, sender_email, sender_name, to_number, media_url))
                conn.commit()
        
        # Invalidate the token immediately after successful transmission
        with sqlite3.connect(DB_FILE) as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE fax_tokens SET status = 'Completed' WHERE token = ?", (token,))
            conn.commit()
            
        return jsonify(result), 200
    except ValueError as e:
        logger.warning(f"Validation error in public_send_fax: {str(e)}")
        return jsonify({'detail': str(e)}), 400
    except Exception as e:
        logger.error(f"Server error handling public send_fax: {str(e)}")
        return jsonify({'detail': 'Failed to process fax request.'}), 500

@app.route('/api/public/fax-webhook', methods=['POST'])
@app.route('/public/fax-webhook', methods=['POST'])
def telnyx_fax_webhook():
    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify({'status': 'ignored'}), 200

        event_data = data.get('data', {})
        event_type = event_data.get('event_type')
        payload = event_data.get('payload', {})
        fax_id = payload.get('fax_id')
        
        if not fax_id:
            return jsonify({'status': 'ignored'}), 200
            
        # Handle completely incoming fax payloads
        if event_type == 'fax.received':
            direction = payload.get('direction', 'inbound')
            from_number = payload.get('from', '')
            to_number_payload = payload.get('to', '')
            media_url = payload.get('media_url', '')
            status = payload.get('status', 'received')
            caller_id = payload.get('caller_id', 'External Caller')
            
            with sqlite3.connect(DB_FILE) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT OR IGNORE INTO fax_logs 
                    (fax_id, sender_email, sender_name, to_number, from_number, direction, media_url, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (fax_id, 'Incoming', caller_id, to_number_payload, from_number, direction, media_url, status))
                conn.commit()
            return jsonify({'status': 'received'}), 200

        with sqlite3.connect(DB_FILE) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT sender_email, sender_name, to_number FROM fax_logs WHERE fax_id = ?", (fax_id,))
            row = cursor.fetchone()
            
            if row:
                sender_email, sender_name, to_number = row[0], row[1], row[2]
                
                if event_type == 'fax.queued':
                    if sender_email:
                        FaxManager.send_queued_email(sender_email, sender_name, to_number, fax_id)
                    cursor.execute("UPDATE fax_logs SET status = 'queued' WHERE fax_id = ?", (fax_id,))
                
                elif event_type == 'fax.delivered':
                    if sender_email:
                        FaxManager.send_confirmation_email(sender_email, sender_name, to_number, fax_id)
                    cursor.execute("UPDATE fax_logs SET status = 'delivered' WHERE fax_id = ?", (fax_id,))
                    
                elif event_type == 'fax.failed':
                    failure_reason = payload.get('failure_reason', 'Unknown')
                    if sender_email and hasattr(FaxManager, 'send_failure_email'):
                        FaxManager.send_failure_email(sender_email, sender_name, to_number, fax_id, failure_reason)
                    cursor.execute("UPDATE fax_logs SET status = 'failed' WHERE fax_id = ?", (fax_id,))
                    
            conn.commit()

        return jsonify({'status': 'received'}), 200
    except Exception as e:
        logger.error(f"Error handling Telnyx fax webhook: {e}")
        return jsonify({'error': str(e)}), 500

# Protected production environment strings from leaking to client responses
@app.errorhandler(Exception)
def handle_error(error):
    logger.exception(f"Unhandled Exception on {request.method} {request.url}")
    return jsonify({
        'message': 'An internal server error occurred.',
        'status': 500
    }), 500

init_sqlite_db()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 8080)), debug=False)