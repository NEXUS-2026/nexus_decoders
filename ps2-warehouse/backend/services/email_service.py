"""
Email service for sending challans via Gmail SMTP
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_server = "smtp.gmail.com"
        self.smtp_port = 587
        self.email_user = os.getenv("EMAIL_HOST_USER", "atharvamp04@gmail.com")
        self.email_password = os.getenv("EMAIL_HOST_PASSWORD", "jkuf uych pcza tyym")
        
    def send_challan_email(
        self, 
        recipient_email: str,
        subject: str,
        body: str,
        pdf_attachment_path: Optional[str] = None,
        video_attachment_path: Optional[str] = None
    ) -> bool:
        """Send challan email with optional PDF and video attachments"""
        try:
            # Create message
            message = MIMEMultipart()
            message["From"] = self.email_user
            message["To"] = recipient_email
            message["Subject"] = subject
            
            # Add body
            message.attach(MIMEText(body, "html"))
            
            # Add PDF attachment if provided
            if pdf_attachment_path and os.path.exists(pdf_attachment_path):
                with open(pdf_attachment_path, "rb") as attachment:
                    part = MIMEBase("application", "octet-stream")
                    part.set_payload(attachment.read())
                    encoders.encode_base64(part)
                    part.add_header(
                        "Content-Disposition",
                        f"attachment; filename=challan.pdf"
                    )
                    message.attach(part)
                    logger.info(f"Attached PDF: {pdf_attachment_path}")
            
            # Add video attachment if provided
            if video_attachment_path and os.path.exists(video_attachment_path):
                with open(video_attachment_path, "rb") as attachment:
                    part = MIMEBase("application", "octet-stream")
                    part.set_payload(attachment.read())
                    encoders.encode_base64(part)
                    part.add_header(
                        "Content-Disposition",
                        f"attachment; filename=processed_video.mp4"
                    )
                    message.attach(part)
                    logger.info(f"Attached video: {video_attachment_path}")
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.email_user, self.email_password)
                server.send_message(message)
                
            logger.info(f"Email sent successfully to {recipient_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {recipient_email}: {str(e)}")
            return False
    
    def test_connection(self) -> bool:
        """Test SMTP connection"""
        try:
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.email_user, self.email_password)
                logger.info("SMTP connection test successful")
                return True
        except Exception as e:
            logger.error(f"SMTP connection test failed: {str(e)}")
            return False

# Global email service instance
email_service = EmailService()
