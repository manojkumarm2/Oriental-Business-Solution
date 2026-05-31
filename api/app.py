import os
import traceback
from flask import Flask, jsonify, request, g
from flask_cors import CORS
from jose import jwt
import requests
from functools import wraps
import sqlite3
from dotenv import load_dotenv  # 1. Import load_dotenv

# 2. Load the environment variables right away
load_dotenv()

from tax_managers import PersonalTaxManager, CorporateTaxManager, CvitpTaxManager, DocumentSignManager, DB_FILE, get_db_connection
from call_manager import CallManager, CvitpCallHistoryManager

app = Flask(__name__)
application = app
CORS(app)

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
            return jsonify({'message': 'Token is invalid', 'error': str(e)}), 401
    return decorated

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
        
        # Migrate tables to include shared_link
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
                
        # Migrate cvitpStatus to include email
        cursor.execute("PRAGMA table_info(cvitpStatus)")
        columns = [col[1] for col in cursor.fetchall()]
        if 'email' not in columns:
            cursor.execute("ALTER TABLE cvitpStatus ADD COLUMN email TEXT")
                
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
    """Create a new CVITP status entry"""
    try:
        entry_id = CvitpTaxManager.create(request.get_json())
        return jsonify({'id': entry_id, 'status': 'created'}), 201
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    except Exception as e:
        return jsonify({'message': 'Server error handling record creation.', 'error': str(e)}), 500

@app.route('/api/cvitp', methods=['GET'])
@app.route('/cvitp', methods=['GET'])
@validate_token
def get_cvitp_entries():
    """Retrieve all CVITP status entries"""
    return jsonify(CvitpTaxManager.get_all()), 200


@app.route('/api/cvitp/<entry_id>', methods=['PUT'])
@app.route('/cvitp/<entry_id>', methods=['PUT'])
@validate_token
def update_cvitp_entry(entry_id):
    """Update an existing CVITP status entry by id"""
    try:
        if CvitpTaxManager.update(entry_id, request.get_json()):
            return jsonify({'status': 'updated'}), 200
        return jsonify({'message': 'CVITP entry record not found'}), 404
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    except Exception as e:
        return jsonify({'message': 'Server error handling record update.', 'error': str(e)}), 500

# --- Staff Dashboard Routes ---
@app.route('/api/staff/initialize-document', methods=['POST'])
@app.route('/staff/initialize-document', methods=['POST'])
@validate_token
def initialize_document_flow():
    try:
        result = DocumentSignManager.initialize_document(request.get_json())
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as err:
        return jsonify({"error": f"Database initialization failed: {str(err)}"}), 500

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
        return jsonify({"error": str(e)}), 404
    except Exception as err:
        return jsonify({"error": f"Failed to retrieve e-sign details: {str(err)}"}), 500

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
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": "Server error processing document"}), 500

@app.route('/api/public/review-tax/<token>/sign', methods=['POST'])
@app.route('/public/review-tax/<token>/sign', methods=['POST'])
def sign_public_tax_document(token):
    try:
        result = DocumentSignManager.submit_signature(token, request.get_json())
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
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
    response = CallManager.handle_incoming_webhook(request.get_json(force=True), request.url_root)
    return jsonify(response), 200

@app.route("/api/callback", methods=["POST"])
@app.route("/callback", methods=["POST"])
def call_callback():
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
        return jsonify({'message': 'Failed retrieving communication logs.', 'error': str(e)}), 500

@app.route('/api/cvitp/call-history', methods=['POST'])
@app.route('/cvitp/call-history', methods=['POST'])
@validate_token
def create_cvitp_call_log():
    try:
        log_id = CvitpCallHistoryManager.log_call(request.get_json())
        return jsonify({'id': log_id, 'status': 'logged'}), 201
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    except Exception as e:
        return jsonify({'message': 'Failed archiving communication metric.', 'error': str(e)}), 500

@app.errorhandler(500)
def handle_error(error):
    traceback.print_exc()
    return jsonify({'message': 'Server error.'}), 500

init_sqlite_db()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 8080)), debug=False)