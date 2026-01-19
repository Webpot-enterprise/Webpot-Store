Sheet name - Production-Backend-Database 
Tabs: 
Users - user_id, email, password_hash, auth_provider, full_name, created_at, updated_at, status, google_auth_id, last_login 

Sessions - session_id, user_id, token, created_at, expires_at, ip_address, device_info 

AuthTokens - token_id, user_id, token_hash, created_at, expires_at, token_type 
Logs - log_id, user_id, action, timestamp, ip_address, details 

Orders - order_id, user_id, customer_email, customer_name, order_date, total_amount, currency, order_status, service_type, service_details, delivery_date, payment_method, referral_code_used, confirmation_sent 

ReferralCodes - code_id, referral_code, user_id, created_by, created_at, expires_at, discount_percentage, max_users, current_users, status 

Contacts - contact_id, name, email, subject, message, submitted_at, source, ip_address, user_agent