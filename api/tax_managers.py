import os
import sqlite3
from datetime import datetime
import secrets

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, 'obs_db.db')

def dict_factory(cursor, row):
    return {col[0]: row[idx] for idx, col in enumerate(cursor.description)}

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = dict_factory
    return conn

class PersonalTaxManager:
    @staticmethod
    def get_all():
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM customers ORDER BY createdAt DESC")
            return cursor.fetchall()

    @staticmethod
    def create(data):
        name = data.get('name')
        mobile = data.get('mobile')
        if not name or not mobile:
            raise ValueError("Name and mobile number are required.")
            
        customer_data = (
            name, data.get('spouse', ''), mobile, data.get('email', ''),
            data.get('address', ''), data.get('city', ''), data.get('invoiceDate', ''),
            data.get('filingDate', ''), data.get('draftSentDate', ''), data.get('invoiceNo', ''),
            data.get('invoiceAmount', ''), data.get('paymentReceived', ''), data.get('dob', ''),
            data.get('workStatus', ''), data.get('dueDate', ''), data.get('updatedBy', ''),
            data.get('status', 'Pending'), data.get('familyDetails', ''), data.get('history', ''),
            data.get('notes', ''), data.get('otherComments', ''), data.get('assignedTo', ''),
            data.get('draftStatus', ''), data.get('receivedDate', '')
        )
        
        with sqlite3.connect(DB_FILE) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO customers (
                    name, spouse, mobile, email, address, city, invoiceDate, filingDate, 
                    draftSentDate, invoiceNo, invoiceAmount, paymentReceived, dob, workStatus, 
                    dueDate, updatedBy, status, familyDetails, history, notes, otherComments, 
                    assignedTo, draftStatus, receivedDate
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, customer_data)
            conn.commit()
            return cursor.lastrowid

    @staticmethod
    def update(customer_id, updates):
        allowed_fields = [
            'name', 'spouse', 'mobile', 'email', 'address', 'city', 'invoiceDate',
            'filingDate', 'draftSentDate', 'invoiceNo', 'invoiceAmount', 'paymentReceived',
            'dob', 'workStatus', 'dueDate', 'updatedBy', 'status', 'familyDetails', 
            'history', 'notes', 'otherComments', 'assignedTo', 'draftStatus', 'receivedDate'
        ]
        filtered_updates = {k: v for k, v in updates.items() if k in allowed_fields}
        if not filtered_updates:
            raise ValueError("No valid fields provided for update.")
            
        set_parts = [f"{k} = ?" for k in filtered_updates.keys()]
        values = list(filtered_updates.values()) + [int(customer_id)]
        
        with sqlite3.connect(DB_FILE) as conn:
            cursor = conn.cursor()
            cursor.execute(f"UPDATE customers SET {', '.join(set_parts)}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?", values)
            conn.commit()
            return cursor.rowcount > 0

    @staticmethod
    def delete(customer_id):
        with sqlite3.connect(DB_FILE) as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM customers WHERE id = ?", (int(customer_id),))
            conn.commit()
            return cursor.rowcount > 0


class CorporateTaxManager:
    @staticmethod
    def calculate_quarterly_due_date():
        try:
            now = datetime.now()
            month = now.month
            year = now.year
            due_month = month if month <= 9 else (month + 3) % 12
            due_year = year if month <= 9 else year + 1
            return datetime(due_year, due_month, 25).strftime('%Y-%m-%d')
        except Exception:
            return ''

    @classmethod
    def get_all(cls):
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM corporate ORDER BY createdAt DESC")
            rows = cursor.fetchall()
            
        current_year = datetime.now().year
        current_month = datetime.now().month
        
        for row in rows:
            if row['hstPeriod'] == 'Quarterly':
                row['hstDueDate'] = cls.calculate_quarterly_due_date()
            elif row['hstPeriod'] == 'Annually':
                row['hstDueDate'] = f"{current_year}-12-25"
            else:
                row['hstDueDate'] = f"{current_year}-{current_month:02d}-25"
        return rows

    @staticmethod
    def create(data):
        business_name = data.get('businessName')
        mobile = data.get('mobile')
        if not business_name or not mobile:
            raise ValueError("Business name and mobile number are required.")
            
        corporate_data = (
            business_name, data.get('contactName', ''), data.get('businessNumber', ''),
            data.get('address', ''), data.get('email', ''), data.get('yearEnd', ''),
            data.get('todoList', ''), data.get('details', ''), mobile, data.get('dateFiled', ''),
            data.get('corporateIncomeTax', ''), data.get('status', 'Pending'), data.get('invoiceAmount', ''),
            data.get('invoiceStatus', ''), data.get('paymentStatus', ''), data.get('notes', ''),
            data.get('payrollStatus', ''), data.get('payrollAccount', ''), data.get('payrollDateFiled', ''),
            data.get('hstPeriod', ''), data.get('hstDueDate', ''), data.get('hstStatus', ''),
            data.get('hstDateFiled', ''), data.get('hstInvoiceStatus', ''), data.get('hstNotes', ''),
            data.get('assignedTo', ''), data.get('updatedBy', ''), data.get('hstAvailable', ''),
            data.get('payrollAvailable', ''), data.get('payrollDueDate', ''),
            datetime.now().isoformat(), datetime.now().isoformat()
        )
        
        with sqlite3.connect(DB_FILE) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO corporate (
                    businessName, contactName, businessNumber, address, email, yearEnd, todoList, 
                    details, mobile, dateFiled, corporateIncomeTax, status, invoiceAmount, invoiceStatus, 
                    paymentStatus, notes, payrollStatus, payrollAccount, payrollDateFiled, hstPeriod, 
                    hstDueDate, hstStatus, hstDateFiled, hstInvoiceStatus, hstNotes, assignedTo, updatedBy, 
                    hstAvailable, payrollAvailable, payrollDueDate, createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, corporate_data)
            conn.commit()
            return cursor.lastrowid

    @staticmethod
    def update(corporate_id, updates):
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
            raise ValueError("No valid fields provided for update.")
            
        set_parts = [f"{k} = ?" for k in filtered_updates.keys()]
        values = list(filtered_updates.values()) + [int(corporate_id)]
        
        with sqlite3.connect(DB_FILE) as conn:
            cursor = conn.cursor()
            cursor.execute(f"UPDATE corporate SET {', '.join(set_parts)}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?", values)
            conn.commit()
            return cursor.rowcount > 0

    @staticmethod
    def delete(corporate_id):
        with sqlite3.connect(DB_FILE) as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM corporate WHERE id = ?", (int(corporate_id),))
            conn.commit()
            return cursor.rowcount > 0
        
    
class CvitpTaxManager:
    @staticmethod
    def create(data):
        name = data.get('name')
        mobile = data.get('mobile')
        if not name or not mobile:
            raise ValueError("Name and mobile number are required.")
            
        cvitp_data = (
            name,
            mobile,
            data.get('email', ''),
            data.get('status', 'Pending'),
            data.get('assignedTo', ''),
            data.get('coin', ''),
            data.get('receivedDate', ''),
            data.get('filledDate', ''),
            data.get('yearsOfFiling', '')
        )
        
        with sqlite3.connect(DB_FILE) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO cvitpStatus (
                    name, mobile, email, status, assignedTo, coin, receivedDate, filledDate, yearsOfFiling
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, cvitp_data)
            conn.commit()
            return cursor.lastrowid

    @staticmethod
    def get_all():
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM cvitpStatus ORDER BY createdAt DESC")
            return cursor.fetchall()

    @staticmethod
    def update(entry_id, updates):
        allowed_fields = [
            'name', 'mobile', 'email', 'status', 'assignedTo', 'coin', 'receivedDate', 'filledDate', 'yearsOfFiling'
        ]
        filtered_updates = {k: v for k, v in updates.items() if k in allowed_fields}
        if not filtered_updates:
            raise ValueError("No valid fields provided for update.")
            
        set_parts = [f"{k} = ?" for k in filtered_updates.keys()]
        values = list(filtered_updates.values()) + [int(entry_id)]
        
        with sqlite3.connect(DB_FILE) as conn:
            cursor = conn.cursor()
            cursor.execute(f"""
                UPDATE cvitpStatus 
                SET {', '.join(set_parts)}, updatedAt = CURRENT_TIMESTAMP 
                WHERE id = ?
            """, values)
            conn.commit()
            return cursor.rowcount > 0


class DocumentSignManager:
    @staticmethod
    def initialize_document(data):
        customer_id = data.get('customer_id')
        tax_type = data.get('tax_type')         # 'Personal' or 'CVITP'
        tax_year = data.get('tax_year')         # e.g., 2025
        onedrive_item_id = data.get('onedrive_item_id')
        file_name = data.get('file_name')
        shared_link = data.get('shared_link')

        if not all([customer_id, tax_type, tax_year, onedrive_item_id, shared_link]):
            raise ValueError("Missing required metadata parameters (including shared link)")

        # Generate a unique secure token for the client portal link
        secure_portal_token = secrets.token_urlsafe(32)
        target_table = "personal_tax" if tax_type == "Personal" else "cvitp_tax"
        
        with sqlite3.connect(DB_FILE) as conn:
            cursor = conn.cursor()
            query = f"""
                INSERT INTO {target_table} 
                (customer_id, tax_year, onedrive_item_id, file_name, portal_token, status, shared_link)
                VALUES (?, ?, ?, ?, ?, 'Draft Sent', ?)
            """
            cursor.execute(query, (customer_id, tax_year, onedrive_item_id, file_name, secure_portal_token, shared_link))
            new_record_id = cursor.lastrowid
            
            main_table = "customers" if tax_type == "Personal" else "cvitpStatus"
            cursor.execute(f"UPDATE {main_table} SET status = 'Draft Sent' WHERE id = ?", (customer_id,))
            conn.commit()

        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000').rstrip('/')
        customer_access_link = f"{frontend_url}/review-tax/{secure_portal_token}"

        return {
            "status": "Success", 
            "record_id": new_record_id, 
            "link": customer_access_link
        }

    @staticmethod
    def get_document_by_token(token):
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT *, 'Personal' as tax_type FROM personal_tax WHERE portal_token = ?", (token,))
            record = cursor.fetchone()
            if not record:
                cursor.execute("SELECT *, 'CVITP' as tax_type FROM cvitp_tax WHERE portal_token = ?", (token,))
                record = cursor.fetchone()
            
            if not record:
                raise ValueError("Invalid or expired portal link.")
            return record

    @staticmethod
    def get_esign_details_by_customer_id(customer_id, tax_type):
        with get_db_connection() as conn:
            cursor = conn.cursor()
            target_table = "personal_tax" if tax_type == "Personal" else "cvitp_tax"
            main_table = "customers" if tax_type == "Personal" else "cvitpStatus"
            
            # Get only necessary fields, exclude onedrive_item_id and portal_token
            query = f"""
                SELECT 
                    e.id, 
                    e.tax_year, 
                    e.file_name, 
                    e.status, 
                    e.createdAt, 
                    e.shared_link, 
                    e.client_location, 
                    e.agreed_to_file,
                    e.consent_timestamp,
                    e.public_ip,
                    e.resolved_location,
                    e.device_platform,
                    e.browser_engine,
                    e.typed_name,
                    e.portal_token,
                    c.name as customerName,
                    c.email
                FROM {target_table} e
                JOIN {main_table} c ON e.customer_id = c.id
                WHERE e.customer_id = ?
                ORDER BY e.createdAt DESC
            """
            cursor.execute(query, (customer_id,))
            records = cursor.fetchall()
            
            if not records:
                raise ValueError(f"No e-sign records found for this customer.")
            return records

    @staticmethod
    def submit_signature(token, data):
        typed_name = data.get('typed_name')
        client_location = data.get('location')
        agreed_to_file = data.get('agreed_to_file')
        
        consent_timestamp = data.get('consent_timestamp')
        public_ip = data.get('public_ip')
        resolved_location = data.get('resolved_location')
        device_platform = data.get('device_platform')
        browser_engine = data.get('browser_engine')

        if not typed_name or not client_location or not agreed_to_file:
            raise ValueError("Full Name, Location, and Agreement are required for authorization.")
        
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            for table, main_table in [("personal_tax", "customers"), ("cvitp_tax", "cvitpStatus")]:
                cursor.execute(f"SELECT id, customer_id FROM {table} WHERE portal_token = ?", (token,))
                record = cursor.fetchone()
                if record:
                    update_query = f"""
                        UPDATE {table} 
                        SET status = 'eSigned', 
                            client_location = ?, 
                            agreed_to_file = 1,
                            consent_timestamp = ?,
                            public_ip = ?,
                            resolved_location = ?,
                            device_platform = ?,
                            browser_engine = ?,
                            typed_name = ?
                        WHERE portal_token = ?
                    """
                    cursor.execute(update_query, (client_location, consent_timestamp, public_ip, resolved_location, device_platform, browser_engine, typed_name, token))
                    cursor.execute(f"UPDATE {main_table} SET status = 'eSigned' WHERE id = ?", (record['customer_id'],))
                    conn.commit()
                    return {"status": "Success", "message": "Document successfully signed."}
            
            raise ValueError("Invalid or expired portal link.")