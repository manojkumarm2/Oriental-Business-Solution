import os
import requests
import logging
from io import BytesIO
from datetime import datetime
try:
    from pypdf import PdfReader, PdfWriter
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.utils import simpleSplit
except ImportError:
    pass
try:
    from zoneinfo import ZoneInfo # Python 3.9+ standard library
except ImportError:
    from backports.zoneinfo import ZoneInfo

logger = logging.getLogger('obs_api')



class FaxManager:
    TELNYX_API_KEY = os.getenv("TELNYX_API_KEY", "YOUR_TELNYX_API_KEY")
    FROM_NUMBER = os.getenv("TELNYX_FROM_NUMBER", "+14374655477")  # Your verified Telnyx number
    CONNECTION_ID = os.getenv("TELNYX_FAX_CONNECTION_ID", "2974257171778242524")  # Required for Telnyx Programmable Fax

    @classmethod
    def create_cover_page_and_merge(
        cls, 
        file_content: bytes, 
        to_number: str, 
        sender_name: str, 
        sender_email: str,
        department: str,
        subject: str, 
        message: str,
        # Added tracking fields to mirror example data parameters
        sender_company: str = "Oriental Business Solutions Inc.",
        sender_address: str = "80 Culture Crescent, Brampton, ON, L6X 5A2",
        sender_phone: str = "+16478556177",
    ) -> bytes:
        
        original_pdf = PdfReader(BytesIO(file_content))
        total_pages = len(original_pdf.pages) + 1  # original + 1 cover page

        packet = BytesIO()
        c = canvas.Canvas(packet, pagesize=letter)
        width, height = letter
        
        # Determine exact Eastern time parameters
        local_tz = ZoneInfo("America/Toronto")
        local_now = datetime.now(local_tz)
        # ==================================================================
        # LINE INTEGRATED HEADERS
        # ==================================================================
        y_header_banner = height - 27 
        c.setFont("Helvetica-Bold", 8.5)
        
        # --- LEFT ANCHORED BLOCKS (Safe Left-to-Right Flow) ---
        # Column 1 (X: 35)
        c.drawString(35, y_header_banner, f"From: {sender_name[:18]}") 
        
        # Column 2 (X: 135)
        c.drawString(135, y_header_banner, "Fax: +14374655477")
        
        # Column 3 (X: 235) - Safely truncated up to 30 characters
        raw_to_string = f"To: CRA {department}".strip()
        clean_to_string = raw_to_string if len(raw_to_string) <= 30 else f"{raw_to_string[:27]}... {to_number[-7:]}"
        c.drawString(235, y_header_banner, clean_to_string)
        
        # --- RIGHT ANCHORED BLOCKS (Safe Right-to-Left Alignment) ---
        # Anchor 1: Converted Chronological Clock Metrics (Ends perfectly at width - 35)
        time_string = local_now.strftime('%m/%d/%Y %I:%M %p')
        c.drawRightString(width - 35, y_header_banner, time_string)
        
        # Anchor 2: Page Progression Indices (Ends 110 points to the left of the time stamp)
        c.drawRightString(width - 145, y_header_banner, f"Page: 1 of {total_pages}")
        
        # Anchor 3: Target Terminal Destination Fax (Ends 185 points to the left of the time stamp)
        # c.drawRightString(width - 220, y_header_banner, f"Fax: {to_number}")
        
        # Underline Split Rule Divider
        c.setLineWidth(0.5)
        c.line(35, y_header_banner - 5, width - 35, y_header_banner - 5)
        c.setLineWidth(1.0)
        
       # ==================================================================
        # TOP HEADER BLOCK (Matches example: image_30c7fe.png)
        # ==================================================================
        c.setFont("Helvetica-Bold", 36)
        c.drawString(50, height - 70, "FAX")
        
        # 1. Convert server time to local Eastern Standard/Daylight Time (Toronto/EST/EDT)
        
        # 2. Date Line
        c.setFont("Helvetica-Bold", 11)
        c.drawString(50, height - 105, "Date")
        c.setFont("Helvetica", 11)
        c.drawString(100, height - 105, local_now.strftime('%m/%d/%Y'))
        c.line(50, height - 110, 280, height - 110)
        
        # 3. Time Line (New row added)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(50, height - 125, "Time")
        c.setFont("Helvetica", 11)
        c.drawString(100, height - 125, local_now.strftime('%I:%M %p %Z')) # Formats as e.g., 12:15 PM EDT
        c.line(50, height - 130, 280, height - 130)
        
        # 4. Total Page Count Line (Pushed down slightly to accommodate the time row)
        c.setFont("Helvetica", 11)
        c.drawString(50, height - 150, f"Number of pages including cover sheet: {total_pages}")
        c.line(50, height - 155, 280, height - 155)

        # ==================================================================
        # TWO COLUMN GRID SYSTEM (No Overlapping Text)
        # Left Side (X: 50 to 280) | Right Side (X: 320 to 560)
        # ==================================================================
        y_grid = height - 205
        
        # --- LEFT COLUMN: TO (Recipient Target) ---
        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, y_grid, "To:")
        c.line(50, y_grid - 5, 280, y_grid - 5)
        
        c.setFont("Helvetica", 11)
        # Wrap target lines cleanly
        to_lines = simpleSplit(f"Canada Revenue Agency {department}".strip(), "Helvetica", 11, 230)
        curr_y = y_grid - 25
        for t_line in to_lines:
            c.drawString(50, curr_y, t_line)
            curr_y -= 20
            
        c.setFont("Helvetica-Oblique", 10)
        c.drawString(50, y_grid - 95, "Phone")
        c.line(50, y_grid - 100, 280, y_grid - 100)
        
        c.setFont("Helvetica-Bold", 10)
        c.drawString(50, y_grid - 120, "Fax Phone")
        c.setFont("Helvetica", 11)
        c.drawString(120, y_grid - 120, to_number)
        c.line(50, y_grid - 125, 280, y_grid - 125)

        # --- RIGHT COLUMN: FROM (Sender Profile) ---
        c.setFont("Helvetica-Bold", 14)
        c.drawString(320, y_grid, "From:")
        c.line(320, y_grid - 5, 550, y_grid - 5)
        
        c.setFont("Helvetica", 11)
        c.drawString(320, y_grid - 25, sender_name)
        c.line(320, y_grid - 30, 550, y_grid - 30)
        
        c.drawString(320, y_grid - 45, sender_company)
        c.line(320, y_grid - 50, 550, y_grid - 50)
        
        # Dynamically split address text across columns if long
        addr_lines = simpleSplit(sender_address, "Helvetica", 10, 230)
        addr_y = y_grid - 65
        for line in addr_lines[:2]: # Max 2 address layout lines
            c.drawString(320, addr_y, line)
            addr_y -= 15
        c.line(320, y_grid - 90, 550, y_grid - 90)
        
        c.setFont("Helvetica-Oblique", 10)
        c.drawString(320, y_grid - 105, "Phone")
        c.setFont("Helvetica", 11)
        c.drawString(400, y_grid - 105, sender_phone)
        c.line(320, y_grid - 110, 550, y_grid - 110)
        
        c.setFont("Helvetica-Oblique", 10)
        c.drawString(320, y_grid - 125, "Email")
        c.setFont("Helvetica", 10) # Dropped to 10pt slightly to fit longer developer domain strings cleanly
        c.drawString(400, y_grid - 125, sender_email if sender_email else "N/A")
        c.line(320, y_grid - 130, 550, y_grid - 130)
        
        c.setFont("Helvetica-Bold", 10)
        c.drawString(320, y_grid - 145, "Fax Phone")
        c.setFont("Helvetica", 11)
        c.drawString(400, y_grid - 145, "+1-437-465-5477") 
        c.line(320, y_grid - 150, 550, y_grid - 150)
        

        # ==================================================================
        # REMARKS SECTION BLOCK (Matches example layout)
        # ==================================================================
        y_remarks = y_grid - 180
        
        # Draw the distinctive dark filled banner block
        c.setFillColorRGB(0, 0, 0)
        c.rect(50, y_remarks, 100, 18, fill=True, stroke=False)
        
        c.setFillColorRGB(1, 1, 1) # White text for banner overlay
        c.setFont("Helvetica-Bold", 11)
        c.drawString(58, y_remarks + 5, "REMARKS:")
        
        # Reset color to black for text rendering
        c.setFillColorRGB(0, 0, 0)
        c.line(50, y_remarks, width - 50, y_remarks)
        
        # Print contents inside the remarks block safely
        y_text = y_remarks - 25
        c.setFont("Helvetica", 11)
        
        # Combine subject and text layout cleanly if both available
        full_message = f"SUBJECT: {subject}\n\n{message}" if subject else message
        
        # Split message line-by-line supporting explicit newlines (\n)
        for segment in full_message.split('\n'):
            wrapped_lines = simpleSplit(segment, "Helvetica", 11, width - 100)
            for line in wrapped_lines:
                if y_text < 60: # Avoid spilling onto page boundary lines
                    break
                c.drawString(50, y_text, line)
                y_text -= 18
            y_text -= 6 # Padding paragraph separation spacing
            
        # Standard disclaimer notice block at base padding area
        c.setFont("Helvetica-Oblique", 8)
        c.drawString(50, 35, "CONFIDENTIALITY NOTE: This transmission is intended only for the Canada Revenue Agency.")
        
        c.save()
        packet.seek(0)
        
        # ==================================================================
        # FILE ASSEMBLY
        # ==================================================================
        cover_pdf = PdfReader(packet)
        writer = PdfWriter()
        writer.add_page(cover_pdf.pages[0])
        
        for page in original_pdf.pages:
            writer.add_page(page)
            
        output = BytesIO()
        writer.write(output)
        return output.getvalue()

    @classmethod
    def send_fax(cls, to_number: str, media_url: str, sender_email: str = None, sender_name: str = None):
        # 1. Format the phone number for Telnyx (E.164 format)
        clean_number = to_number.strip().replace("-", "").replace(" ", "")
        company_tag = "OrientalBiz Soln Inc"
        sanitized_tag = "".join(c for c in company_tag if c.isalnum() or c in " -_").strip()
        fax_header_tag = sanitized_tag[:20] # Strict 20 character limit truncation
        if not clean_number.startswith("+"):
            if clean_number.startswith("1"):
                clean_number = "+" + clean_number
            else:
                clean_number = "+1" + clean_number

        if not cls.CONNECTION_ID:
            raise ValueError("TELNYX_FAX_CONNECTION_ID is missing. Please add your Telnyx Fax Application Connection ID to your environment variables.")

        # 2. Trigger the Outbound Fax
        fax_url = "https://api.telnyx.com/v2/faxes"
        fax_payload = {
            "connection_id": cls.CONNECTION_ID,
            "from": cls.FROM_NUMBER, 
            "to": clean_number, 
            "media_url": media_url,
            "t38_fax_key_line": fax_header_tag,
            "from_display_name": fax_header_tag
        }

        logger.info(f"📤 Initiating fax transmission to {clean_number} with media URL: {media_url}")
        fax_response = requests.post(fax_url, headers={"Authorization": f"Bearer {cls.TELNYX_API_KEY}", "Content-Type": "application/json"}, json=fax_payload)

        if fax_response.status_code in [200, 201, 202]:
            fax_data = fax_response.json().get("data", {})
            fax_id = fax_data.get('id')
            logger.info(f"Fax ID generated: {fax_id}")
            logger.info(f"Initial Status: {fax_data.get('status')}")
            
            return {"status": "success", "message": f"Fax queued successfully to {clean_number}", "fax_id": fax_id}
        else:
            raise ValueError(f"Telnyx fax routing failed: {fax_response.text}")

    @staticmethod
    def send_queued_email(client_email: str, sender_name: str, to_number: str, fax_id: str):
        logger.info(f"📧 Preparing to send fax queued notification email to {client_email}.")

        tenant_id = os.getenv('AZURE_TENANT_ID', "c4ea64ee-34b6-4a18-9339-8aff143c12d4")
        client_id = os.getenv('AZURE_CLIENT_ID', "ec39786f-9998-4a43-aef9-2d8148338b0b")
        client_secret = os.getenv('AZURE_CLIENT_SECRET')

        if not client_secret:
            logger.error("📧 Email skipped: AZURE_CLIENT_SECRET missing from environment configurations.")
            return False

        to_recipients = [{"emailAddress": {"address": client_email}}]

        try:
            # 1. Acquire Token via Client Credentials
            token_url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
            token_data = {
                'client_id': client_id,
                'client_secret': client_secret,
                'scope': 'https://graph.microsoft.com/.default',
                'grant_type': 'client_credentials'
            }
            token_r = requests.post(token_url, data=token_data)
            token_r.raise_for_status()
            access_token = token_r.json().get('access_token')

            # 2. Render HTML Email Body Template
            body_html = f"""
            <html>
            <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 30px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
                    <h2 style="color: #1976d2; border-bottom: 2px solid #2196F3; padding-bottom: 10px; margin-top: 0;">📤 Fax Queued for Transmission</h2>
                    <p>Hello <strong>{sender_name}</strong>,</p>
                    <p>Your document has been successfully processed and is currently in the queue to be faxed.</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 25px 0; background-color: #f9f9f9; border-radius: 4px; overflow: hidden;">
                        <tr>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #ddd; width: 40%; font-weight: bold;">Target Destination:</td>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #ddd;">{to_number}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #ddd; font-weight: bold;">Transmission ID:</td>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #ddd; font-family: monospace;">{fax_id}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #ddd; font-weight: bold;">Queued Time (UTC):</td>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #ddd;">{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 15px; font-weight: bold;">Status:</td>
                            <td style="padding: 12px 15px; color: #1976d2; font-weight: bold;">⏳ QUEUED</td>
                        </tr>
                    </table>
                    <p>You will receive an automated confirmation email once Telnyx confirms successful delivery.</p>
                    <p>Thank you for using the Oriental Biz Fax Gateway.</p>
                    <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #888; text-align: center;">
                        <p style="margin: 0;">This is an automated system notification.</p>
                        <p style="margin: 5px 0 0 0;">Please do not reply directly to this email.</p>
                    </div>
                </div>
            </body>
            </html>
            """

            # 3. Transmit payload to Microsoft Graph
            email_payload = {
                "message": {
                    "subject": f"⏳ Fax Queued: {to_number}",
                    "body": {
                        "contentType": "HTML",
                        "content": body_html
                    },
                    "toRecipients": to_recipients,
                    "from": {
                        "emailAddress": {
                            "address": "fax@orientalbiz.ca"
                        }
                    }
                },
                "saveToSentItems": "true"
            }

            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }

            sender_email_address = "info@orientalbiz.ca"
            send_mail_url = f"https://graph.microsoft.com/v1.0/users/{sender_email_address}/sendMail"
            send_r = requests.post(send_mail_url, headers=headers, json=email_payload)
            send_r.raise_for_status()

            logger.info(f"✅ Fax queued email dispatched to: {client_email}")
            return True

        except Exception as email_err:
            error_details = send_r.text if 'send_r' in locals() else str(email_err)
            logger.exception(f"💥 Failed to dispatch fax queued email via Graph API: {error_details}")
            return False

    @staticmethod
    def upload_to_onedrive(file_bytes: bytes, file_name: str, target_user: str = "admin@orientalbiz.ca") -> str:
        tenant_id = os.getenv('AZURE_TENANT_ID', "c4ea64ee-34b6-4a18-9339-8aff143c12d4")
        client_id = os.getenv('AZURE_CLIENT_ID', "ec39786f-9998-4a43-aef9-2d8148338b0b")
        client_secret = os.getenv('AZURE_CLIENT_SECRET')
        
        if not client_secret:
            raise ValueError("AZURE_CLIENT_SECRET missing. Cannot authenticate with Microsoft Graph.")

        logger.info(f"☁️ Staging {file_name} to OneDrive for {target_user}...")

        # 1. Acquire Token via Client Credentials
        token_url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
        token_data = {
            'client_id': client_id,
            'client_secret': client_secret,
            'scope': 'https://graph.microsoft.com/.default',
            'grant_type': 'client_credentials'
        }
        token_r = requests.post(token_url, data=token_data)
        token_r.raise_for_status()
        access_token = token_r.json().get('access_token')

        headers = {'Authorization': f'Bearer {access_token}'}

        # 2. Push File to OneDrive (Organized by Year/Month)
        now = datetime.utcnow()
        folder_path = f"Sent_Faxes/{now.strftime('%Y/%m')}"
        upload_url = f"https://graph.microsoft.com/v1.0/users/{target_user}/drive/root:/{folder_path}/{file_name}:/content"
        
        upload_headers = headers.copy()
        upload_headers['Content-Type'] = 'application/pdf'
        
        upload_r = requests.put(upload_url, headers=upload_headers, data=file_bytes)
        upload_r.raise_for_status()
        item_data = upload_r.json()
        item_id = item_data.get('id')

        # 3. Retrieve pre-authenticated direct download URL
        download_url = item_data.get('@microsoft.graph.downloadUrl')
        
        if not download_url:
            get_url = f"https://graph.microsoft.com/v1.0/users/{target_user}/drive/items/{item_id}?$select=id,@microsoft.graph.downloadUrl"
            get_r = requests.get(get_url, headers=headers)
            get_r.raise_for_status()
            download_url = get_r.json().get('@microsoft.graph.downloadUrl')

        if download_url:
            return download_url

        # Fallback (may fail for bots due to MS restrictions)
        link_url = f"https://graph.microsoft.com/v1.0/users/{target_user}/drive/items/{item_id}/createLink"
        link_r = requests.post(link_url, headers=headers, json={"type": "view", "scope": "anonymous"})
        link_r.raise_for_status()
        web_url = link_r.json().get('link', {}).get('webUrl', '')

        return f"{web_url}&download=1" if "?" in web_url else f"{web_url}?download=1"

    @staticmethod
    def send_confirmation_email(client_email: str, sender_name: str, to_number: str, fax_id: str):
        logger.info(f"📧 Preparing to send fax delivery confirmation email to {client_email}.")

        tenant_id = os.getenv('AZURE_TENANT_ID', "c4ea64ee-34b6-4a18-9339-8aff143c12d4")
        client_id = os.getenv('AZURE_CLIENT_ID', "ec39786f-9998-4a43-aef9-2d8148338b0b")
        client_secret = os.getenv('AZURE_CLIENT_SECRET')

        if not client_secret:
            logger.error("📧 Email skipped: AZURE_CLIENT_SECRET missing from environment configurations.")
            return False

        to_recipients = [{"emailAddress": {"address": client_email}}]

        try:
            # 1. Acquire Token via Client Credentials
            token_url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
            token_data = {
                'client_id': client_id,
                'client_secret': client_secret,
                'scope': 'https://graph.microsoft.com/.default',
                'grant_type': 'client_credentials'
            }
            token_r = requests.post(token_url, data=token_data)
            token_r.raise_for_status()
            access_token = token_r.json().get('access_token')

            # 2. Render HTML Email Body Template
            body_html = f"""
            <html>
            <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 30px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
                    <h2 style="color: #2e7d32; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; margin-top: 0;">✅ Secure Fax Delivered</h2>
                    <p>Hello <strong>{sender_name}</strong>,</p>
                    <p>This is a confirmation that your document transmission has been successfully delivered to its destination.</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 25px 0; background-color: #f9f9f9; border-radius: 4px; overflow: hidden;">
                        <tr>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #ddd; width: 40%; font-weight: bold;">Target Destination:</td>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #ddd;">{to_number}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #ddd; font-weight: bold;">Transmission ID:</td>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #ddd; font-family: monospace;">{fax_id}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #ddd; font-weight: bold;">Delivery Time (UTC):</td>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #ddd;">{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 15px; font-weight: bold;">Status:</td>
                            <td style="padding: 12px 15px; color: #2e7d32; font-weight: bold;">✓ DELIVERED</td>
                        </tr>
                    </table>
                    <p>Thank you for using the Oriental Biz Fax Gateway.</p>
                    <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #888; text-align: center;">
                        <p style="margin: 0;">This is an automated system notification.</p>
                        <p style="margin: 5px 0 0 0;">Please do not reply directly to this email.</p>
                    </div>
                </div>
            </body>
            </html>
            """

            # 3. Transmit payload to Microsoft Graph
            email_payload = {
                "message": {
                    "subject": f"✅ Fax Delivered Successfully to {to_number}",
                    "body": {
                        "contentType": "HTML",
                        "content": body_html
                    },
                    "toRecipients": to_recipients,
                    "from": {
                        "emailAddress": {
                            "address": "fax@orientalbiz.ca"
                        }
                    }
                },
                "saveToSentItems": "true"
            }

            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }

            sender_email_address = "info@orientalbiz.ca"
            send_mail_url = f"https://graph.microsoft.com/v1.0/users/{sender_email_address}/sendMail"
            send_r = requests.post(send_mail_url, headers=headers, json=email_payload)
            send_r.raise_for_status()

            logger.info(f"✅ Fax confirmation email dispatched to: {client_email}")
            return True

        except Exception as email_err:
            error_details = send_r.text if 'send_r' in locals() else str(email_err)
            logger.exception(f"💥 Failed to dispatch fax confirmation email via Graph API: {error_details}")
            return False

    @staticmethod
    def send_failure_email(client_email: str, sender_name: str, to_number: str, fax_id: str, failure_reason: str = "Unknown"):
        logger.info(f"📧 Preparing to send fax failure notification email to {client_email}.")

        tenant_id = os.getenv('AZURE_TENANT_ID', "c4ea64ee-34b6-4a18-9339-8aff143c12d4")
        client_id = os.getenv('AZURE_CLIENT_ID', "ec39786f-9998-4a43-aef9-2d8148338b0b")
        client_secret = os.getenv('AZURE_CLIENT_SECRET')

        if not client_secret:
            logger.error("📧 Email skipped: AZURE_CLIENT_SECRET missing from environment configurations.")
            return False

        to_recipients = [{"emailAddress": {"address": client_email}}]

        try:
            # 1. Acquire Token via Client Credentials
            token_url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
            token_data = {
                'client_id': client_id,
                'client_secret': client_secret,
                'scope': 'https://graph.microsoft.com/.default',
                'grant_type': 'client_credentials'
            }
            token_r = requests.post(token_url, data=token_data)
            token_r.raise_for_status()
            access_token = token_r.json().get('access_token')

            # 2. Render HTML Email Body Template
            body_html = f"""
            <html>
            <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 30px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
                    <h2 style="color: #d32f2f; border-bottom: 2px solid #F44336; padding-bottom: 10px; margin-top: 0;">❌ Fax Transmission Failed</h2>
                    <p>Hello <strong>{sender_name}</strong>,</p>
                    <p>We encountered an issue while attempting to deliver your fax.</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 25px 0; background-color: #f9f9f9; border-radius: 4px; overflow: hidden;">
                        <tr>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #ddd; width: 40%; font-weight: bold;">Target Destination:</td>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #ddd;">{to_number}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #ddd; font-weight: bold;">Transmission ID:</td>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #ddd; font-family: monospace;">{fax_id}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #ddd; font-weight: bold;">Reason:</td>
                            <td style="padding: 12px 15px; border-bottom: 1px solid #ddd; color: #d32f2f;">{failure_reason}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 15px; font-weight: bold;">Status:</td>
                            <td style="padding: 12px 15px; color: #d32f2f; font-weight: bold;">FAILED</td>
                        </tr>
                    </table>
                    <p>Please double-check the recipient number and try again. If the problem persists, please contact support.</p>
                    <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #888; text-align: center;">
                        <p style="margin: 0;">This is an automated system notification.</p>
                        <p style="margin: 5px 0 0 0;">Please do not reply directly to this email.</p>
                    </div>
                </div>
            </body>
            </html>
            """

            # 3. Transmit payload to Microsoft Graph
            email_payload = {
                "message": {
                    "subject": f"❌ Fax Failed: {to_number}",
                    "body": {
                        "contentType": "HTML",
                        "content": body_html
                    },
                    "toRecipients": to_recipients,
                    "from": {
                        "emailAddress": {
                            "address": "fax@orientalbiz.ca"
                        }
                    }
                },
                "saveToSentItems": "true"
            }

            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }

            sender_email_address = "info@orientalbiz.ca"
            send_mail_url = f"https://graph.microsoft.com/v1.0/users/{sender_email_address}/sendMail"
            send_r = requests.post(send_mail_url, headers=headers, json=email_payload)
            send_r.raise_for_status()

            logger.info(f"✅ Fax failure email dispatched to: {client_email}")
            return True

        except Exception as email_err:
            error_details = send_r.text if 'send_r' in locals() else str(email_err)
            logger.exception(f"💥 Failed to dispatch fax failure email via Graph API: {error_details}")
            return False