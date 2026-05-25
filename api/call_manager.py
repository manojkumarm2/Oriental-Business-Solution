import os
import json
import sqlite3
import urllib.parse
from tax_managers import DB_FILE, get_db_connection

try:
    from azure.communication.identity import CommunicationIdentityClient, CommunicationUserIdentifier
    from azure.communication.callautomation import CallAutomationClient, TextSource, SsmlSource
except ImportError:
    pass

ACS_CONNECTION_STRING = os.getenv('ACS_CONNECTION_STRING')

class CallManager:
    @staticmethod
    def sanitize_phone_key(raw_number):
        if not raw_number:
            return None
        digits = "".join([c for c in str(raw_number) if c.isdigit()])
        return f"+{digits}"

    @classmethod
    def get_acs_token_for_user(cls, user_email):
        user_email = user_email.lower()
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT acs_user_id FROM acs_users WHERE email = ?", (user_email,))
            row = cursor.fetchone()
            
        identity_client = CommunicationIdentityClient.from_connection_string(ACS_CONNECTION_STRING)
        if row:
            acs_user_id = row['acs_user_id']
            user = CommunicationUserIdentifier(acs_user_id)
            token_response = identity_client.get_token(user, scopes=["voip"])
        else:
            user, token_response = identity_client.create_user_and_token(scopes=["voip"])
            acs_user_id = user.properties['id']
            with sqlite3.connect(DB_FILE) as conn:
                cursor = conn.cursor()
                cursor.execute("INSERT INTO acs_users (email, acs_user_id) VALUES (?, ?)", (user_email, acs_user_id))
                conn.commit()
                
        return {
            'token': token_response.token,
            'expiresOn': token_response.expires_on.isoformat() if hasattr(token_response.expires_on, 'isoformat') else str(token_response.expires_on),
            'acsUserId': acs_user_id
        }

    @classmethod
    def handle_incoming_webhook(cls, events, request_url_root):
        if not events:
            return {}

        for event in events:
            if event.get('eventType') == 'Microsoft.EventGrid.SubscriptionValidationEvent':
                return {'validationResponse': event['data']['validationCode']}
                
            if event.get('eventType') == 'Microsoft.Communication.IncomingCall':
                data = event.get('data', {})
                to_identity = data.get('to', {})
                from_identity = data.get('from', {})
                
                raw_caller = from_identity.get('phoneNumber', {}).get('value', '')
                caller_number = cls.sanitize_phone_key(raw_caller)
                
                if 'communicationUser' in to_identity or str(to_identity.get('rawId', '')).startswith('8:acs:'):
                    continue
                
                incoming_call_context = data.get('incomingCallContext')
                if incoming_call_context:
                    call_automation_client = CallAutomationClient.from_connection_string(ACS_CONNECTION_STRING)
                    callback_url = f"{request_url_root.rstrip('/')}/api/callback"
                    if callback_url.startswith("http://"):
                        callback_url = callback_url.replace("http://", "https://", 1)
                        
                    # Save temporary caller map data link natively to DB row state tracking
                    with sqlite3.connect(DB_FILE) as conn:
                        cursor = conn.cursor()
                        cursor.execute("INSERT OR REPLACE INTO bridged_calls (call_id, loop_count) VALUES (?, 0)", (caller_number,))
                        conn.commit()

                    cognitive_services_endpoint = os.getenv('AZURE_COGNITIVE_SERVICES_ENDPOINT', "https://orientalbiz-ai-tax-clinic.cognitiveservices.azure.com/")
                    call_automation_client.answer_call(
                        incoming_call_context=incoming_call_context,
                        callback_url=callback_url,
                        cognitive_services_endpoint=cognitive_services_endpoint
                    )
        return {}

    @classmethod
    def handle_lifecycle_callback(cls, callback_events):
        if not callback_events:
            return
        if isinstance(callback_events, dict):
            callback_events = [callback_events]
            
        call_automation_client = CallAutomationClient.from_connection_string(ACS_CONNECTION_STRING)
        
        for event in callback_events:
            event_type = event.get("type") or event.get("eventType")
            data = event.get("data", {})
            call_connection_id = data.get("callConnectionId")
            print(f"📊 [AZURE EVENT RECIEVED]: {event_type} for Connection: {call_connection_id}")

            if not call_connection_id:
                continue

            if event_type == "Microsoft.Communication.CallConnected":
                welcome_text = "Welcome to Oriental Business Solutions. Please wait, our team will be connecting with you soon."
                play_source = TextSource(text=welcome_text, voice_name="en-CA-LiamNeural")
                try:
                    call_connection_client = call_automation_client.get_call_connection(call_connection_id)
                    call_connection_client.play_media_to_all(play_source=play_source, operation_context="WelcomePlay")
                except Exception as e:
                    print(f"Error streaming payload: {e}")

            elif event_type == "Microsoft.Communication.PlayCompleted":
                op_context = data.get("operationContext")
                if op_context == "WelcomePlay":
                    # Invite Agents
                    try:
                        dev_emails_str = os.getenv('DEV_AGENT_EMAIL', '')
                        if dev_emails_str:
                            dev_emails = [e.strip().lower() for e in dev_emails_str.split(',') if e.strip()]
                            placeholders = ','.join(['?'] * len(dev_emails))
                            with get_db_connection() as conn:
                                cursor = conn.cursor()
                                cursor.execute(f"SELECT acs_user_id FROM acs_users WHERE email IN ({placeholders})", dev_emails)
                                rows = cursor.fetchall()
                            
                            call_connection_client = call_automation_client.get_call_connection(call_connection_id)
                            for row in rows:
                                target = CommunicationUserIdentifier(row['acs_user_id'])
                                call_connection_client.add_participant(target_participant=target)
                    except Exception as e:
                        print(f"Agent invite loop error: {e}")

                    # Play Hold Loop
                    try:
                        call_connection_client = call_automation_client.get_call_connection(call_connection_id)
                        hold_announcement = SsmlSource(
                            ssml_text=r"""<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
                                <voice name="en-CA-LiamNeural">
                                    <break time="2s"/>
                                    Please hold while we connect your call to an available representative.
                                </voice>
                            </speak>"""
                        )
                        call_connection_client.play_media_to_all(play_source=hold_announcement, operation_context="HoldLoop")
                    except Exception as media_err:
                        print(f"Failed hold text: {media_err}")

                elif op_context == "HoldLoop":
                    # DB State fallback validation checks
                    with get_db_connection() as conn:
                        cursor = conn.cursor()
                        cursor.execute("SELECT loop_count FROM bridged_calls WHERE loop_count = -1")
                        answered_globally = cursor.fetchone()
                    if answered_globally:
                        continue
                        
                    try:
                        call_connection_client = call_automation_client.get_call_connection(call_connection_id)
                        hold_announcement = SsmlSource(
                            ssml_text=r"""<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
                                <voice name="en-CA-LiamNeural">
                                    <break time="2s"/>
                                    Thank you for your patience. A volunteer agent will be with you shortly.
                                </voice>
                            </speak>"""
                        )
                        call_connection_client.play_media_to_all(play_source=hold_announcement, operation_context="HoldLoop")
                    except Exception:
                        pass

            elif event_type == "Microsoft.Communication.ParticipantsUpdated":
                    participants = data.get("participants", [])
                    
                    # If there are no participants left, or only 1 agent remains alone, kill the room
                    if len(participants) <= 1:
                        print(f"⚠️ Roster updated: {len(participants)} participants left. Empty call. Forcing hang up...")
                        try:
                            call_connection_client = call_automation_client.get_call_connection(call_connection_id)
                            call_connection_client.hang_up(is_for_everyone=True)
                        except Exception:
                            pass
                        continue

                # --- UNIFIED DISCONNECT BLOCK ---
            elif event_type in [
                    "Microsoft.Communication.CallDisconnected", 
                    "Microsoft.Communication.PlayFailed"
                ]:
                    print(f"🛑 Clean-up rule triggered by event '{event_type}'")
                    try:
                        call_connection_client = call_automation_client.get_call_connection(call_connection_id)
                        call_connection_client.hang_up(is_for_everyone=True)
                    except Exception:
                        pass
                        
                    try:
                        with sqlite3.connect(DB_FILE) as conn:
                            cursor = conn.cursor()
                            cursor.execute("DELETE FROM bridged_calls WHERE call_id = ? OR loop_count = -1", (call_connection_id,))
                            conn.commit()
                    except Exception:
                        pass
                    continue    
            elif event_type == "Microsoft.Communication.AddParticipantSucceeded":
                # Globally register answer state to stop hold announcements across worker execution bounds
                with sqlite3.connect(DB_FILE) as conn:
                    cursor = conn.cursor()
                    cursor.execute("UPDATE bridged_calls SET loop_count = -1")
                    conn.commit()

    @classmethod
    def get_answered_status(cls, phone_number):
        decoded_phone = urllib.parse.unquote(phone_number).strip()
        clean_phone_key = cls.sanitize_phone_key(decoded_phone)
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT loop_count FROM bridged_calls WHERE call_id = ?", (clean_phone_key,))
            row = cursor.fetchone()
        return (row and row['loop_count'] == -1)