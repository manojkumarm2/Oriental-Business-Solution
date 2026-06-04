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
        
       # ==================================================================
        # TOP HEADER BLOCK (Matches example: image_30c7fe.png)
        # ==================================================================
        c.setFont("Helvetica-Bold", 36)
        c.drawString(50, height - 70, "FAX")
        
        # 1. Convert server time to local Eastern Standard/Daylight Time (Toronto/EST/EDT)
        local_tz = ZoneInfo("America/Toronto")
        local_now = datetime.now(local_tz)
        
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
    def send_fax(cls, to_number: str, media_url: str):
        # 1. Format the phone number for Telnyx (E.164 format)
        clean_number = to_number.strip().replace("-", "").replace(" ", "")
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
            "media_url": media_url
        }
        
        fax_response = requests.post(fax_url, headers={"Authorization": f"Bearer {cls.TELNYX_API_KEY}", "Content-Type": "application/json"}, json=fax_payload)

        if fax_response.status_code in [200, 201, 202]:
            fax_data = fax_response.json().get("data", {})
            logger.info(f"Fax ID generated: {fax_data.get('id')}")
            logger.info(f"Initial Status: {fax_data.get('status')}")
            return {"status": "success", "message": f"Fax queued successfully to {clean_number}"}
        else:
            raise ValueError(f"Telnyx fax routing failed: {fax_response.text}")