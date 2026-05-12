import os
import json
import requests
from jose import jwt
from functools import wraps
from datetime import datetime
from flask import Flask, jsonify, request, g
from flask_cors import CORS
import sqlite3
from dotenv import load_dotenv
import traceback

# Load environment variables
load_dotenv()

app = Flask(__name__)
application = app
CORS(app)

# Azure AD Configuration
TENANT_ID = os.getenv('AZURE_TENANT_ID') or "c4ea64ee-34b6-4a18-9339-8aff143c12d4"
CLIENT_ID = os.getenv('AZURE_CLIENT_ID') or "ec39786f-9998-4a43-aef9-2d8148338b0b"
DISCOVERY_URL = f'https://login.microsoftonline.com/{TENANT_ID}/v2.0/.well-known/openid-configuration'
EXPECTED_AUDIENCE = f"api://{CLIENT_ID}"

ADMIN_EMAILS = {
    'info@orientalbiz.ca',
    'cvitp@orientalbiz.ca',
    'admin@orientalbiz.ca'
}

def validate_token(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization'].split()
            if len(auth_header) == 2:
                token = auth_header[1]

        if not token:
            return jsonify({'message': 'Token is missing'}), 401

        try:
            # 1. Get Azure public keys (Note: caching these is recommended for performance)
            jwks_uri = requests.get(DISCOVERY_URL).json()['jwks_uri']
            jwks = requests.get(jwks_uri).json()
            
            unverified_claims = jwt.get_unverified_claims(token)
            
            # --- FIX STARTS HERE ---
            # Define valid audiences: both the raw UUID and the api:// URI
            valid_audiences = [CLIENT_ID, f"api://{CLIENT_ID}"]
            
            if unverified_claims.get('aud') not in valid_audiences:
                 return jsonify({
                     'message': 'Invalid audience',
                     'received': unverified_claims.get('aud'),
                     'expected': valid_audiences
                 }), 401
            # --- FIX ENDS HERE ---

            # Extract the user's email/username from the token claims for later filtering.
            user_email = (
                unverified_claims.get('preferred_username') or
                unverified_claims.get('upn') or
                unverified_claims.get('email') or
                unverified_claims.get('unique_name')
            )
            g.user_email = user_email or ''

            # Now perform full signature verification
            # The 'audience' parameter here should match what is in the token
            jwt.decode(
                token, 
                jwks, 
                algorithms=['RS256'], 
                audience=unverified_claims.get('aud')
            )

            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'message': 'Token is invalid', 'error': str(e)}), 401
            
    return decorated

# SQLite Configuration
# This gets the directory where app.py is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, 'obs_db.db')

def dict_factory(cursor, row):
    return {col[0]: row[idx] for idx, col in enumerate(cursor.description)}


def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = dict_factory
    return conn


def init_sqlite_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    # Create customers table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            spouse TEXT DEFAULT '',
            mobile TEXT NOT NULL,
            email TEXT DEFAULT '',
            address TEXT DEFAULT '',
            city TEXT DEFAULT '',
            invoiceDate TEXT DEFAULT '',
            filingDate TEXT DEFAULT '',
            draftSentDate TEXT DEFAULT '',
            invoiceNo TEXT DEFAULT '',
            invoiceAmount TEXT DEFAULT '',
            paymentReceived TEXT DEFAULT '',
            dob TEXT DEFAULT '',
            workStatus TEXT DEFAULT '',
            dueDate TEXT DEFAULT '',
            updatedBy TEXT DEFAULT '',
            status TEXT DEFAULT 'Pending',
            familyDetails TEXT DEFAULT '',
            history TEXT DEFAULT '',
            notes TEXT DEFAULT '',
            otherComments TEXT DEFAULT '',
            assignedTo TEXT DEFAULT '',
            draftStatus TEXT DEFAULT '',
            receivedDate TEXT DEFAULT '',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS corporate (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            businessName TEXT NOT NULL,
            contactName TEXT DEFAULT '',
            businessNumber TEXT DEFAULT '',
            address TEXT DEFAULT '',
            email TEXT DEFAULT '',
            yearEnd TEXT DEFAULT '',
            todoList TEXT DEFAULT '',
            details TEXT DEFAULT '',
            mobile TEXT DEFAULT '',
            dateFiled TEXT DEFAULT '',
            corporateIncomeTax TEXT DEFAULT '',
            status TEXT DEFAULT 'Pending',
            invoiceAmount TEXT DEFAULT '',
            invoiceStatus TEXT DEFAULT '',
            paymentStatus TEXT DEFAULT '',
            notes TEXT DEFAULT '',
            payrollStatus TEXT DEFAULT '',
            payrollAccount TEXT DEFAULT '',
            payrollDateFiled TEXT DEFAULT '',
            hstPeriod TEXT DEFAULT '',
            hstDueDate TEXT DEFAULT '',
            hstStatus TEXT DEFAULT '',
            hstDateFiled TEXT DEFAULT '',
            hstInvoiceStatus TEXT DEFAULT '',
            hstNotes TEXT DEFAULT '',
            assignedTo TEXT DEFAULT '',
            updatedBy TEXT DEFAULT '',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()
    print("SQLite initialized successfully.")


def is_connected():
    return os.path.exists(DB_FILE)

def calculate_quarterly_due_date():
    try:
        year = datetime.now().year
        month = datetime.now().month
        quarter = (month - 1) // 3 + 1
        
        def add_months(quarter_month):
            next_month = quarter_month if month <= 9 else (month + 3) % 12
            next_year = year if month <= 9 else year + 1
            due_date = datetime(next_year, next_month, 25)
            return due_date.strftime('%Y-%m-%d')

        if quarter == 1:
            return add_months(3)
        elif quarter == 2:
            return add_months(6)
        elif quarter == 3:
            return add_months(9)
        elif quarter == 4:
            return add_months(12)
        else:
            return ''
    except Exception as e:
        print(f"Error calculating quarterly due date: {e}")
        return ''


# API Routes

@app.route('/api/health', methods=['GET'])
@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'sqliteConnected': is_connected()
    })


@app.route('/api/customers', methods=['GET'])
@app.route('/customers', methods=['GET'])
@validate_token
def get_customers():
    """Get all customers sorted by createdAt descending"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM customers ORDER BY createdAt DESC")
        rows = cursor.fetchall()
        conn.close()

        if g.user_email.lower() in ADMIN_EMAILS:
            return jsonify(rows)
        
        filtered_rows = []
        for row in rows:
            row['invoiceAmount'] = ''
            row['paymentReceived'] = ''
            filtered_rows.append(row)

        return jsonify(filtered_rows)
    except Exception as error:
        print(error)
        traceback.print_exc()
        return jsonify({'message': 'Unable to load customers.'}), 500


@app.route('/api/customers', methods=['POST'])
@app.route('/customers', methods=['POST'])
@validate_token
def create_customer():
    """Create a new customer"""
    try:
        data = request.get_json()
        
        name = data.get('name')
        mobile = data.get('mobile')
        
        if not name or not mobile:
            return jsonify({'message': 'Name and mobile number are required.'}), 400
        
        customer_data = (
            name,
            data.get('spouse', ''),
            mobile,
            data.get('email', ''),
            data.get('address', ''),
            data.get('city', ''),
            data.get('invoiceDate', ''),
            data.get('filingDate', ''),
            data.get('draftSentDate', ''),
            data.get('invoiceNo', ''),
            data.get('invoiceAmount', ''),
            data.get('paymentReceived', ''),
            data.get('dob', ''),
            data.get('workStatus', ''),
            data.get('dueDate', ''),
            data.get('updatedBy', ''),
            data.get('status', 'Pending'),
            data.get('familyDetails', ''),
            data.get('history', ''),
            data.get('notes', ''),
            data.get('otherComments', ''),
            data.get('assignedTo', ''),
            data.get('draftStatus', ''),
            data.get('receivedDate', '')
        )
        
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("""INSERT INTO customers (name, spouse, mobile, email, address, city, invoiceDate, filingDate, draftSentDate, invoiceNo, invoiceAmount, paymentReceived, dob, workStatus, dueDate, updatedBy, status, familyDetails, history, notes, otherComments, assignedTo, draftStatus, receivedDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""", customer_data)
        conn.commit()
        customer_id = cursor.lastrowid
        conn.close()
        
        created = {
            'id': customer_id, 'name': name, 'spouse': data.get('spouse', ''), 'mobile': mobile, 
            'email': data.get('email', ''), 'address': data.get('address', ''), 'city': data.get('city', ''), 
            'invoiceDate': data.get('invoiceDate', ''), 'filingDate': data.get('filingDate', ''), 
            'draftSentDate': data.get('draftSentDate', ''), 'invoiceNo': data.get('invoiceNo', ''), 
            'invoiceAmount': data.get('invoiceAmount', ''), 'paymentReceived': data.get('paymentReceived', ''), 
            'dob': data.get('dob', ''), 'workStatus': data.get('workStatus', ''), 'dueDate': data.get('dueDate', ''), 
            'updatedBy': data.get('updatedBy', ''), 
            'status': data.get('status', 'Pending'), 'familyDetails': data.get('familyDetails', ''), 
            'history': data.get('history', ''), 'notes': data.get('notes', ''), 
            'otherComments': data.get('otherComments', ''), 'assignedTo': data.get('assignedTo', ''), 
            'draftStatus': data.get('draftStatus', ''), 'receivedDate': data.get('receivedDate', ''), 
            'createdAt': datetime.now().isoformat(), 'updatedAt': datetime.now().isoformat()
        }
        return jsonify(created), 201
        
    except Exception as error:
        print(error)
        traceback.print_exc()
        return jsonify({'message': 'Unable to create customer.'}), 500


@app.route('/api/customers/<customer_id>', methods=['PUT'])
@app.route('/customers/<customer_id>', methods=['PUT'])
@validate_token
def update_customer(customer_id):
    """Update a customer by ID"""
    try:
        updates = request.get_json()
        
        try:
            customer_id = int(customer_id)
        except ValueError:
            return jsonify({'message': 'Invalid customer ID.'}), 400
        
        if not updates:
            return jsonify({'message': 'No updates provided.'}), 400
        
        allowed_fields = [
            'name', 'spouse', 'mobile', 'email', 'address', 'city', 'invoiceDate',
            'filingDate', 'draftSentDate', 'invoiceNo', 'invoiceAmount', 'paymentReceived',
            'dob', 'workStatus', 'dueDate', 'updatedBy', 'status',
            'familyDetails', 'history', 'notes', 'otherComments', 'assignedTo',
            'draftStatus', 'receivedDate'
        ]
        
        filtered_updates = {k: v for k, v in updates.items() if k in allowed_fields}
        
        if not filtered_updates:
            return jsonify({'message': 'No valid fields provided for update.'}), 400
        
        set_parts = [f"{k} = ?" for k in filtered_updates.keys()]
        values = list(filtered_updates.values()) + [customer_id]
        
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute(f"UPDATE customers SET {', '.join(set_parts)}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?", values)
        conn.commit()
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'message': 'Customer not found.'}), 404
        
        # Fetch updated customer
        conn.row_factory = dict_factory
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM customers WHERE id = ?", (customer_id,))
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return jsonify({'message': 'Customer not found.'}), 404
        return jsonify(row)
        
    except Exception as error:
        print(error)
        traceback.print_exc()
        return jsonify({'message': 'Unable to update customer.'}), 500


@app.route('/api/customers/<customer_id>', methods=['DELETE'])
@app.route('/customers/<customer_id>', methods=['DELETE'])
@validate_token
def delete_customer(customer_id):
    """Delete a customer by ID"""
    try:
        if g.user_email.lower() not in ADMIN_EMAILS:
            return jsonify({'message': 'Unauthorized to delete records.'}), 403

        try:
            customer_id = int(customer_id)
        except ValueError:
            return jsonify({'message': 'Invalid customer ID.'}), 400

        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM customers WHERE id = ?", (customer_id,))
        conn.commit()
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'message': 'Customer not found.'}), 404
            
        conn.close()
        return jsonify({'message': 'Customer deleted successfully.'}), 200
        
    except Exception as error:
        print(error)
        traceback.print_exc()
        return jsonify({'message': 'Unable to delete customer.'}), 500


# Corporate Customer API Endpoints

@app.route('/api/corporate', methods=['GET'])
@app.route('/corporate', methods=['GET'])
@validate_token
def get_corporate():
    """Get all corporate customers sorted by createdAt descending"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM corporate ORDER BY createdAt DESC")
        rows = cursor.fetchall()
        conn.close()
        
        filtered_rows = []
        user_email = g.user_email.lower()
        current_year = datetime.now().year
        current_month = datetime.now().month
        for row in rows:
            assigned_to = str(row.get('assignedTo') or '').lower()
            if row['hstPeriod'] == 'Quarterly':
                row['hstDueDate'] = calculate_quarterly_due_date()
            elif row['hstPeriod'] == 'Annually':
                row['hstDueDate'] = f"{current_year}-12-25"
            else:
                row['hstDueDate'] = f"{current_year}-{current_month:02d}-25"

            if assigned_to == user_email and user_email not in ADMIN_EMAILS:
                row['invoiceAmount'] = ''
                row['corporateIncomeTax'] = ''
                filtered_rows.append(row)
            else:
                filtered_rows.append(row)
            
        return jsonify(filtered_rows)
    except Exception as error:
        print(error)
        traceback.print_exc()
        return jsonify({'message': 'Unable to load corporate records.'}), 500


@app.route('/api/corporate', methods=['POST'])
@app.route('/corporate', methods=['POST'])
@validate_token
def create_corporate():
    """Create a new corporate customer"""
    try:
        data = request.get_json()
        
        businessName = data.get('businessName')
        mobile = data.get('mobile')
        
        if not businessName or not mobile:
            return jsonify({'message': 'Business name and mobile number are required.'}), 400
        
        corporate_data = (
            businessName,
            data.get('contactName', ''),
            data.get('businessNumber', ''),
            data.get('address', ''),
            data.get('email', ''),
            data.get('yearEnd', ''),
            data.get('todoList', ''),
            data.get('details', ''),
            mobile,
            data.get('dateFiled', ''),
            data.get('corporateIncomeTax', ''),
            data.get('status', 'Pending'),
            data.get('invoiceAmount', ''),
            data.get('invoiceStatus', ''),
            data.get('paymentStatus', ''),
            data.get('notes', ''),
            data.get('payrollStatus', ''),
            data.get('payrollAccount', ''),
            data.get('payrollDateFiled', ''),
            data.get('hstPeriod', ''),
            data.get('hstDueDate', ''),
            data.get('hstStatus', ''),
            data.get('hstDateFiled', ''),
            data.get('hstInvoiceStatus', ''),
            data.get('hstNotes', ''),
            data.get('assignedTo', ''),
            data.get('updatedBy', ''),
            data.get('hstAvailable', ''),
            data.get('payrollAvailable', ''),
            data.get('payrollDueDate', ''),
            datetime.now().isoformat(),
            datetime.now().isoformat(),
        )
        
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("""INSERT INTO corporate (businessName, contactName, businessNumber, address, email, yearEnd, todoList, details, mobile, dateFiled, corporateIncomeTax, status, invoiceAmount, invoiceStatus, paymentStatus, notes, payrollStatus, payrollAccount, payrollDateFiled, hstPeriod, hstDueDate, hstStatus, hstDateFiled, hstInvoiceStatus, hstNotes, assignedTo, updatedBy, hstAvailable, payrollAvailable, payrollDueDate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""", corporate_data)
        conn.commit()
        corporate_id = cursor.lastrowid
        conn.close()
        
        created = {
            'id': corporate_id,
            'businessName': businessName,
            'contactName': data.get('contactName', ''),
            'businessNumber': data.get('businessNumber', ''),
            'address': data.get('address', ''),
            'email': data.get('email', data.get('mailId', '')),
            'yearEnd': data.get('yearEnd', ''),
            'todoList': data.get('todoList', data.get('toDoList', '')),
            'details': data.get('details', ''),
            'mobile': mobile,
            'dateFiled': data.get('dateFiled', data.get('DateFiled', '')),
            'corporateIncomeTax': data.get('corporateIncomeTax', ''),
            'status': data.get('status', 'Pending'),
            'invoiceAmount': data.get('invoiceAmount', ''),
            'invoiceStatus': data.get('invoiceStatus', ''),
            'paymentStatus': data.get('paymentStatus', ''),
            'notes': data.get('notes', ''),
            'payrollStatus': data.get('payrollStatus', ''),
            'payrollAccount': data.get('payrollAccount', ''),
            'payrollDateFiled': data.get('payrollDateFiled', ''),
            'hstPeriod': data.get('hstPeriod', ''),
            'hstDueDate': data.get('hstDueDate', ''),
            'hstStatus': data.get('hstStatus', ''),
            'hstDateFiled': data.get('hstDateFiled', ''),
            'hstInvoiceStatus': data.get('hstInvoiceStatus', ''),
            'hstNotes': data.get('hstNotes', ''),
            'assignedTo': data.get('assignedTo', ''),
            'updatedBy': data.get('updatedBy', ''),
            'hstAvailable': data.get('hstAvailable', ''),
            'payrollAvailable': data.get('payrollAvailable', ''),
            'payrollDueDate': data.get('payrollDueDate', ''),
            'createdAt': datetime.now().isoformat(),
            'updatedAt': datetime.now().isoformat()
        }
        return jsonify(created), 201
        
    except Exception as error:
        print(error)
        traceback.print_exc()
        return jsonify({'message': 'Unable to create corporate record.'}), 500


@app.route('/api/corporate/<corporate_id>', methods=['PUT'])
@app.route('/corporate/<corporate_id>', methods=['PUT'])
@validate_token
def update_corporate(corporate_id):
    """Update a corporate customer by ID"""
    try:
        updates = request.get_json()
        
        try:
            corporate_id = int(corporate_id)
        except ValueError:
            return jsonify({'message': 'Invalid corporate ID.'}), 400
        
        if not updates:
            return jsonify({'message': 'No updates provided.'}), 400
            
        allowed_fields = [
            'businessName', 'contactName', 'businessNumber', 'address', 'email', 
            'yearEnd', 'todoList', 'details', 'mobile', 'dateFiled', 'corporateIncomeTax', 
            'status', 'invoiceAmount', 'invoiceStatus', 'paymentStatus', 'notes', 
            'payrollStatus', 'payrollAccount', 'payrollDateFiled', 'hstPeriod', 
            'hstDueDate', 'hstStatus', 'hstDateFiled', 'hstInvoiceStatus', 'hstNotes', 
            'hstAvailable', 'payrollAvailable', 'payrollDueDate', 'assignedTo', 'updatedBy'
        ]
        
        filtered_updates = {k: v for k, v in updates.items() if k in allowed_fields}
        
        if not filtered_updates:
            return jsonify({'message': 'No valid fields provided for update.'}), 400
        
        set_parts = [f"{k} = ?" for k in filtered_updates.keys()]
        values = list(filtered_updates.values()) + [corporate_id]
        
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute(f"UPDATE corporate SET {', '.join(set_parts)}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?", values)
        conn.commit()
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'message': 'Corporate record not found.'}), 404
        
        # Fetch updated corporate record
        conn.row_factory = dict_factory
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM corporate WHERE id = ?", (corporate_id,))
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return jsonify({'message': 'Corporate record not found.'}), 404
        return jsonify(row)
        
    except Exception as error:
        print(error)
        traceback.print_exc()
        return jsonify({'message': 'Unable to update corporate record.'}), 500


@app.route('/api/corporate/<corporate_id>', methods=['DELETE'])
@app.route('/corporate/<corporate_id>', methods=['DELETE'])
@validate_token
def delete_corporate(corporate_id):
    """Delete a corporate customer by ID"""
    try:
        if g.user_email.lower() not in ADMIN_EMAILS:
            return jsonify({'message': 'Unauthorized to delete records.'}), 403

        try:
            corporate_id = int(corporate_id)
        except ValueError:
            return jsonify({'message': 'Invalid corporate ID.'}), 400

        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM corporate WHERE id = ?", (corporate_id,))
        conn.commit()
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'message': 'Corporate record not found.'}), 404
            
        conn.close()
        return jsonify({'message': 'Corporate record deleted successfully.'}), 200
        
    except Exception as error:
        print(error)
        traceback.print_exc()
        return jsonify({'message': 'Unable to delete corporate record.'}), 500


@app.errorhandler(500)
def handle_error(error):
    """Global error handler"""
    print(error)
    traceback.print_exc()
    return jsonify({'message': 'Server error.'}), 500


def start_server():
    """Initialize and start the server"""
    port = int(os.getenv('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)

init_sqlite_db()

if __name__ == '__main__':
    start_server()
