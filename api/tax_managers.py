import os
import sqlite3
from datetime import datetime

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