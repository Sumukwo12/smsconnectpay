import os
import httpx
import base64
from datetime import datetime

class MpesaService:
    def __init__(self):
        self.consumer_key = os.getenv("MPESA_CONSUMER_KEY")
        self.consumer_secret = os.getenv("MPESA_CONSUMER_SECRET")
        self.shortcode = os.getenv("MPESA_SHORTCODE")
        self.passkey = os.getenv("MPESA_PASSKEY")
        self.callback_url = os.getenv("MPESA_CALLBACK_URL")
        self.env = os.getenv("MPESA_ENV", "sandbox")
        
        if self.env == "sandbox":
            self.base_url = "https://sandbox.safaricom.co.ke"
        else:
            self.base_url = "https://api.safaricom.co.ke"

    async def get_access_token(self):
        url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"
        auth_string = f"{self.consumer_key}:{self.consumer_secret}"
        encoded_auth = base64.b64encode(auth_string.encode()).decode()
        
        headers = {"Authorization": f"Basic {encoded_auth}"}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                return response.json().get("access_token")
            else:
                print(f"[ERROR] Failed to get M-Pesa token: {response.text}")
                return None

    async def trigger_stk_push(self, phone_number: str, amount: float):
        access_token = await self.get_access_token()
        if not access_token:
            return {"status": "error", "message": "Failed to authenticate with M-Pesa"}

        formatted_phone = phone_number.strip().replace("+", "")
        if formatted_phone.startswith("0"):
            formatted_phone = "254" + formatted_phone[1:]
        elif not formatted_phone.startswith("254"):
            formatted_phone = "254" + formatted_phone

        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        password_str = f"{self.shortcode}{self.passkey}{timestamp}"
        password = base64.b64encode(password_str.encode()).decode()

        url = f"{self.base_url}/mpesa/stkpush/v1/processrequest"
        headers = {"Authorization": f"Bearer {access_token}"}
        
        payload = {
            "BusinessShortCode": self.shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": int(amount),
            "PartyA": formatted_phone,
            "PartyB": self.shortcode,
            "PhoneNumber": formatted_phone,
            "CallBackURL": self.callback_url,
            "AccountReference": "SMSConnectPay",
            "TransactionDesc": "Tokens Top-up"
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, headers=headers)
                result = response.json()
                if response.status_code == 200 and result.get("ResponseCode") == "0":
                    print(f"[SUCCESS] STK Push triggered for {formatted_phone}")
                    return {"status": "success", "CheckoutRequestID": result.get("CheckoutRequestID")}
                else:
                    print(f"[ERROR] M-Pesa STK Push failed: {result}")
                    return {"status": "error", "message": result.get("CustomerMessage", "STK Push failed")}
            except Exception as e:
                print(f"[EXCEPTION] M-Pesa Service Error: {str(e)}")
                return {"status": "error", "message": str(e)}

mpesa_service = MpesaService()
