from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
from datetime import datetime, timedelta
import psycopg2
import psycopg2.extras
import logging
import hashlib
from psycopg2.extras import RealDictCursor
import os
import sys
import csv
import io

app = Flask(__name__)
CORS(app, origins=["*"])

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'stealer_analysis'),
    'user': os.getenv('DB_USER', 'stealer_user'),
    'password': os.getenv('DB_PASSWORD', 'Test@2013'),
    'port': int(os.getenv('DB_PORT', 5432))
}

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Egyptian BIN data with bank information
EGYPTIAN_BINS = {
    '623078': {'scheme': 'China union pay', 'card_type': 'Debit', 'issuer': 'EGYPTIAN GULF BANK', 'country': 'EG'},
    '594526': {'scheme': 'Maestro', 'card_type': 'Credit', 'issuer': 'HSBC BANK EGYPT S.A.E', 'country': 'EG'},
    '559461': {'scheme': 'Mastercard', 'card_type': 'Debit', 'issuer': 'EMIRATES NATIONAL BANK OF DUBAI S.A.E', 'country': 'EG'},
    '559444': {'scheme': 'Mastercard', 'card_type': 'Debit', 'issuer': 'NATIONAL BANK OF EGYPT', 'country': 'EG'},
    '559254': {'scheme': 'Mastercard', 'card_type': 'Credit', 'issuer': 'ABU DHABI ISLAMIC BANK', 'country': 'EG'},
    '558712': {'scheme': 'Mastercard', 'card_type': 'Credit', 'issuer': 'HSBC BANK EGYPT', 'country': 'EG'},
    '558711': {'scheme': 'Mastercard', 'card_type': 'Credit', 'issuer': 'HSBC BANK EGYPT', 'country': 'EG'},
    '558710': {'scheme': 'Mastercard', 'card_type': 'Credit', 'issuer': 'HSBC BANK EGYPT', 'country': 'EG'},
    '558708': {'scheme': 'Mastercard', 'card_type': 'Credit', 'issuer': 'HSBC BANK EGYPT', 'country': 'EG'},
    '557666': {'scheme': 'Mastercard', 'card_type': 'Debit', 'issuer': 'EGYPTIAN BANKS CO. FOR TECHNOLOGICAL ADVANCEMENT, S.A.E.', 'country': 'EG'},
    '557653': {'scheme': 'Mastercard', 'card_type': 'Debit', 'issuer': 'EGYPTIAN BANKS CO. FOR TECHNOLOGICAL ADVANCEMENT, S.A.E.', 'country': 'EG'},
    '557607': {'scheme': 'Mastercard', 'card_type': 'Debit', 'issuer': 'COMMERCIAL INTERNATIONAL BANK (EGYPT) S.A.E.', 'country': 'EG'},
    '557313': {'scheme': 'Mastercard', 'card_type': 'Debit', 'issuer': 'BANQUE MISR', 'country': 'EG'},
    '556633': {'scheme': 'Mastercard', 'card_type': 'Credit', 'issuer': 'BANK AUDI SAL', 'country': 'EG'},
    '555922': {'scheme': 'Mastercard', 'card_type': 'Debit', 'issuer': 'EGYPTIAN BANKS CO. FOR TECHNOLOGICAL ADVANCEMENT, S.A.E.', 'country': 'EG'},
    '553413': {'scheme': 'Mastercard', 'card_type': 'Credit', 'issuer': 'NATIONAL BANK OF EGYPT', 'country': 'EG'},
    '552921': {'scheme': 'Mastercard', 'card_type': 'Credit', 'issuer': 'CITIBANK, N.A.', 'country': 'EG'},
    '552919': {'scheme': 'Mastercard', 'card_type': 'Credit', 'issuer': 'CITIBANK, N.A.', 'country': 'EG'},
    '552918': {'scheme': 'Mastercard', 'card_type': 'Credit', 'issuer': 'CITIBANK, N.A.', 'country': 'EG'},
    '552916': {'scheme': 'Mastercard', 'card_type': 'Credit', 'issuer': 'HSBC BANK EGYPT', 'country': 'EG'},
    '552566': {'scheme': 'Mastercard', 'card_type': 'Credit', 'issuer': 'COMMERCIAL INTERNATIONAL BANK (EGYPT) S.A.E.', 'country': 'EG'},
    '552425': {'scheme': 'Mastercard', 'card_type': 'Credit', 'issuer': 'NATIONAL BANK OF KUWAIT (S.A.K.)', 'country': 'EG'},
    '552362': {'scheme': 'Mastercard', 'card_type': 'Credit', 'issuer': 'BANK AUDI SAL', 'country': 'EG'},
    '550506': {'scheme': 'Mastercard', 'card_type': 'Credit', 'issuer': 'COMMERCIAL INTERNATIONAL BANK (EGYPT) S.A.E.', 'country': 'EG'},
    '550444': {'scheme': 'Mastercard', 'card_type': 'Credit', 'issuer': 'ARAB INTERNATIONAL BANK', 'country': 'EG'},
    '550442': {'scheme': 'Mastercard', 'card_type': 'Credit', 'issuer': 'ARAB INTERNATIONAL BANK', 'country': 'EG'},
    '550431': {'scheme': 'Mastercard', 'card_type': 'Credit', 'issuer': 'ARAB INTERNATIONAL BANK', 'country': 'EG'},
    '550368': {'scheme': 'Mastercard', 'card_type': 'Debit', 'issuer': 'BANQUE MISR', 'country': 'EG'},
    '550228': {'scheme': 'Mastercard', 'card_type': 'Credit', 'issuer': 'UNITED BANK S.E.A.', 'country': 'EG'},
    '498881': {'scheme': 'Visa', 'card_type': 'Credit', 'issuer': 'BANQUE MISR', 'country': 'EG'},
    '498880': {'scheme': 'Visa', 'card_type': 'Debit', 'issuer': 'BANQUE MISR', 'country': 'EG'},
    '498839': {'scheme': 'Visa', 'card_type': 'Credit', 'issuer': 'BANQUE MISR', 'country': 'EG'},
    '498835': {'scheme': 'Visa', 'card_type': 'Credit', 'issuer': 'BANQUE MISR', 'country': 'EG'},
    '498814': {'scheme': 'Visa', 'card_type': 'Debit', 'issuer': 'BANQUE MISR', 'country': 'EG'},
    '498813': {'scheme': 'Visa', 'card_type': 'Debit', 'issuer': 'BANQUE MISR', 'country': 'EG'},
    '494609': {'scheme': 'Visa', 'card_type': 'Debit', 'issuer': 'NATIONAL BANK OF EGYPT', 'country': 'EG'},
    '494608': {'scheme': 'Visa', 'card_type': 'Credit', 'issuer': 'NATIONAL BANK OF EGYPT', 'country': 'EG'},
    '494606': {'scheme': 'Visa', 'card_type': 'Debit', 'issuer': 'NATIONAL BANK OF EGYPT', 'country': 'EG'},
    '488953': {'scheme': 'Visa', 'card_type': 'Credit', 'issuer': 'NATIONAL BANK OF EGYPT', 'country': 'EG'},
    '486667': {'scheme': 'Visa', 'card_type': 'Credit', 'issuer': 'CITIBANK', 'country': 'EG'},
    '486393': {'scheme': 'Visa', 'card_type': 'Debit', 'issuer': 'BANK OF ALEXANDRIA', 'country': 'EG'},
    '486318': {'scheme': 'Visa', 'card_type': 'Credit', 'issuer': 'COMMERCIAL INTERNATIONAL BANK', 'country': 'EG'},
    '484890': {'scheme': 'Visa', 'card_type': 'Debit', 'issuer': 'NATIONAL SOCIETE GENERALE BANK S.A.E.', 'country': 'EG'},
    '484889': {'scheme': 'Visa', 'card_type': 'Credit', 'issuer': 'NATIONAL SOCIETE GENERALE BANK S.A.E.', 'country': 'EG'},
    '483469': {'scheme': 'Visa', 'card_type': 'Debit', 'issuer': 'NATIONAL BANK OF EGYPT', 'country': 'EG'},
    '481355': {'scheme': 'Visa', 'card_type': 'Credit', 'issuer': 'BANQUE MISR', 'country': 'EG'},
    '479069': {'scheme': 'Visa', 'card_type': 'Credit', 'issuer': 'COMMERCIAL INTERNATIONAL BANK', 'country': 'EG'},
    '479031': {'scheme': 'Visa', 'card_type': 'Credit', 'issuer': 'NATIONAL BANK OF EGYPT', 'country': 'EG'},
    '478749': {'scheme': 'Visa', 'card_type': 'Credit', 'issuer': 'BANQUE MISR', 'country': 'EG'},
    '478684': {'scheme': 'Visa', 'card_type': 'Debit', 'issuer': 'UNION NATIONAL BANK - EGYPT', 'country': 'EG'},
    '474733': {'scheme': 'Visa', 'card_type': 'Credit', 'issuer': 'ARAB BANK PLC', 'country': 'EG'},
    '474718': {'scheme': 'Visa', 'card_type': 'Debit', 'issuer': 'ARAB BANK PLC', 'country': 'EG'},
    '473866': {'scheme': 'Visa', 'card_type': 'Debit', 'issuer': 'NATIONAL SOCIETE GENERALE BANK S.A.E.', 'country': 'EG'},
    '473865': {'scheme': 'Visa', 'card_type': 'Debit', 'issuer': 'NATIONAL SOCIETE GENERALE BANK S.A.E.', 'country': 'EG'},
    '473864': {'scheme': 'Visa', 'card_type': 'Debit', 'issuer': 'NATIONAL SOCIETE GENERALE BANK S.A.E.', 'country': 'EG'},
    '472845': {'scheme': 'Visa', 'card_type': 'Debit', 'issuer': 'NATIONAL BANK OF EGYPT', 'country': 'EG'},
    '472594': {'scheme': 'Visa', 'card_type': 'Debit', 'issuer': 'BANK OF ALEXANDRIA', 'country': 'EG'},
    '471445': {'scheme': 'Visa', 'card_type': 'Debit', 'issuer': 'BANQUE MISR', 'country': 'EG'},
    '470697': {'scheme': 'Visa', 'card_type': 'Credit', 'issuer': 'BLOM BANK EGYPT', 'country': 'EG'},
    '470696': {'scheme': 'Visa', 'card_type': 'Debit', 'issuer': 'BLOM BANK EGYPT', 'country': 'EG'},
    '470695': {'scheme': 'Visa', 'card_type': 'Credit', 'issuer': 'BLOM BANK EGYPT', 'country': 'EG'},
    '470694': {'scheme': 'Visa', 'card_type': 'Credit', 'issuer': 'BLOM BANK EGYPT', 'country': 'EG'},
    '470693': {'scheme': 'Visa', 'card_type': 'Credit', 'issuer': 'BLOM BANK EGYPT', 'country': 'EG'},
    '470599': {'scheme': 'Visa', 'card_type': 'Credit', 'issuer': 'NATIONAL BANK OF EGYPT', 'country': 'EG'},
    '470363': {'scheme': 'Visa', 'card_type': 'Credit', 'issuer': 'CREDIT AGRICOLE EGYPT S.A.E.', 'country': 'EG'},
    '469680': {'scheme': 'Visa', 'card_type': 'Credit', 'issuer': 'ARAB AFRICAN INTERNATIONAL BANK', 'country': 'EG'},
    '469580': {'scheme': 'Visa', 'card_type': 'Credit', 'issuer': 'ARAB BANKING CORPORATION - EGYPT', 'country': 'EG'},
    '469579': {'scheme': 'Visa', 'card_type': 'Credit', 'issuer': 'ARAB BANKING CORPORATION - EGYPT', 'country': 'EG'},
    '469578': {'scheme': 'Visa', 'card_type': 'Credit', 'issuer': 'ARAB BANKING CORPORATION - EGYPT', 'country': 'EG'},
    '469361': {'scheme': 'Visa', 'card_type': 'Credit', 'issuer': 'CITIBANK', 'country': 'EG'},
    '467738': {'scheme': 'Visa', 'card_type': 'Debit', 'issuer': 'ALWATANY BANK OF EGYPT', 'country': 'EG'},
    '465727': {'scheme': 'Visa', 'card_type': 'Credit', 'issuer': 'ARAB INTERNATIONAL BANK', 'country': 'EG'},
    '465566': {'scheme': 'Visa', 'card_type': 'Debit', 'issuer': 'BANQUE MISR', 'country': 'EG'},
    '464619': {'scheme': 'Visa', 'card_type': 'Credit', 'issuer': 'BANQUE MISR', 'country': 'EG'},
    '464481': {'scheme': 'Visa', 'card_type': 'Credit', 'issuer': 'EGYPTIAN GULF BANK', 'country': 'EG'},
    '464480': {'scheme': 'Visa', 'card_type': 'Credit', 'issuer': 'EGYPTIAN GULF BANK', 'country': 'EG'},
    '460014': {'scheme': 'Visa', 'card_type': 'Debit', 'issuer': 'ARAB AFRICAN INTERNATIONAL BANK', 'country': 'EG'},
    '458834': {'scheme': 'Visa', 'card_type': 'Debit', 'issuer': 'HSBC BANK - EGYPT SAE', 'country': 'EG'},
    '458832': {'scheme': 'Visa', 'card_type': 'Debit', 'issuer': 'HSBC BANK - EGYPT SAE', 'country': 'EG'},
    '458830': {'scheme': 'Visa', 'card_type': 'Debit', 'issuer': 'HSBC BANK - EGYPT SAE', 'country': 'EG'},
    '458783': {'scheme': 'Visa', 'card_type': 'Credit', 'issuer': 'ARAB AFRICAN INTERNATIONAL BANK', 'country': 'EG'},
    '458245': {'scheme': 'Visa', 'card_type': 'Debit', 'issuer': 'CITIBANK, N.A.', 'country': 'EG'},
    '458244': {'scheme': 'Visa', 'card_type': 'Debit', 'issuer': 'CITIBANK, N.A.', 'country': 'EG'},
    '458243': {'scheme': 'Visa', 'card_type': 'Debit', 'issuer': 'CITIBANK, N.A.', 'country': 'EG'},
    '457872': {'scheme': 'Visa', 'card_type': 'Credit', 'issuer': 'UNION NATIONAL BANK - EGYPT', 'country': 'EG'},
    '457871': {'scheme': 'Visa', 'card_type': 'Debit', 'issuer': 'UNION NATIONAL BANK - EGYPT', 'country': 'EG'},
    '457638': {'scheme': 'Visa', 'card_type': 'Debit', 'issuer': 'CREDIT AGRICOLE EGYPT S.A.E.', 'country': 'EG'},
    '457376': {'scheme': 'Visa', 'card_type': 'Debit', 'issuer': 'NATIONAL BANK OF EGYPT', 'country': 'EG'},
    '457338': {'scheme': 'Visa', 'card_type': 'Debit', 'issuer': 'BLOM BANK EGYPT', 'country': 'EG'},
}

def test_connection():
    """Test database connection"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        print("✓ Database connection successful")
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        print(f"✓ PostgreSQL version: {version[0]}")
        conn.close()
        return True
    except psycopg2.Error as e:
        print(f"✗ Database connection failed: {e}")
        return False

def check_existing_tables():
    """Check which tables already exist"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        
        existing_tables = [row[0] for row in cursor.fetchall()]
        print("Existing tables:")
        for table in existing_tables:
            print(f"  ✓ {table}")
        
        conn.close()
        return existing_tables
        
    except psycopg2.Error as e:
        print(f"Error checking tables: {e}")
        return []

def create_missing_tables():
    """Create only the missing tables needed for the Flask app"""
    print("\nCreating missing tables for Flask app...")
    
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        existing_tables = check_existing_tables()
        
        # Create users table if it doesn't exist
        if 'users' not in existing_tables:
            print("Creating users table...")
            cursor.execute('''
                CREATE TABLE users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    role VARCHAR(20) DEFAULT 'user',
                    is_active BOOLEAN DEFAULT TRUE,
                    api_key VARCHAR(255),
                    last_login TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            print("✓ users table created")
        else:
            print("✓ users table already exists")
        
        # Create watchlist table if it doesn't exist
        if 'watchlist' not in existing_tables:
            print("Creating watchlist table...")
            cursor.execute('''
                CREATE TABLE watchlist (
                    id SERIAL PRIMARY KEY,
                    keyword VARCHAR(255) NOT NULL,
                    field_type VARCHAR(50) NOT NULL,
                    severity VARCHAR(20) DEFAULT 'medium',
                    description TEXT,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_by INTEGER REFERENCES users(id),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            print("✓ watchlist table created")
        else:
            print("✓ watchlist table already exists")
        
        # Create alerts table if it doesn't exist
        if 'alerts' not in existing_tables:
            print("Creating alerts table...")
            cursor.execute('''
                CREATE TABLE alerts (
                    id SERIAL PRIMARY KEY,
                    watchlist_id INTEGER REFERENCES watchlist(id) ON DELETE CASCADE,
                    matched_field VARCHAR(50) NOT NULL,
                    matched_value TEXT NOT NULL,
                    record_type VARCHAR(20) NOT NULL,
                    record_id INTEGER NOT NULL,
                    severity VARCHAR(20) DEFAULT 'medium',
                    status VARCHAR(20) DEFAULT 'new',
                    reviewed_by INTEGER REFERENCES users(id),
                    reviewed_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            print("✓ alerts table created")
        else:
            print("✓ alerts table already exists")

        # Create card_watchlist table for BIN monitoring
        if 'card_watchlist' not in existing_tables:
            print("Creating card_watchlist table...")
            cursor.execute('''
                CREATE TABLE card_watchlist (
                    id SERIAL PRIMARY KEY,
                    bin_number VARCHAR(6) NOT NULL,
                    bank_name VARCHAR(255),
                    country VARCHAR(2) DEFAULT 'EG',
                    severity VARCHAR(20) DEFAULT 'medium',
                    description TEXT,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_by INTEGER REFERENCES users(id),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            print("✓ card_watchlist table created")
        else:
            print("✓ card_watchlist table already exists")

        # Create card_alerts table for BIN-based alerts
        if 'card_alerts' not in existing_tables:
            print("Creating card_alerts table...")
            cursor.execute('''
                CREATE TABLE card_alerts (
                    id SERIAL PRIMARY KEY,
                    card_watchlist_id INTEGER REFERENCES card_watchlist(id) ON DELETE CASCADE,
                    matched_bin VARCHAR(6) NOT NULL,
                    card_number VARCHAR(255) NOT NULL,
                    card_id INTEGER NOT NULL,
                    bank_name VARCHAR(255),
                    severity VARCHAR(20) DEFAULT 'medium',
                    status VARCHAR(20) DEFAULT 'new',
                    reviewed_by INTEGER REFERENCES users(id),
                    reviewed_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            print("✓ card_alerts table created")
        else:
            print("✓ card_alerts table already exists")

        # Create optimized credential_alert_details table
        if 'credential_alert_details' not in existing_tables:
            print("Creating credential_alert_details table...")
            cursor.execute('''
                CREATE TABLE credential_alert_details (
                    id SERIAL PRIMARY KEY,
                    alert_id INTEGER REFERENCES alerts(id) ON DELETE CASCADE,
                    credential_id INTEGER NOT NULL,
                    domain VARCHAR(255),
                    url TEXT,
                    username VARCHAR(255),
                    password TEXT,
                    stealer_type VARCHAR(100),
                    system_country VARCHAR(50),
                    system_ip INET,
                    computer_name VARCHAR(255),
                    os_version VARCHAR(255),
                    machine_user VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            print("✓ credential_alert_details table created")
        else:
            print("✓ credential_alert_details table already exists")
            
            # Check if we need to update the system_country column length
            try:
                cursor.execute("""
                    SELECT character_maximum_length 
                    FROM information_schema.columns 
                    WHERE table_name = 'credential_alert_details' 
                    AND column_name = 'system_country'
                """)
                result = cursor.fetchone()
                
                if result and result[0] == 10:
                    print("🔄 Updating system_country column length from 10 to 50 characters...")
                    cursor.execute("ALTER TABLE credential_alert_details ALTER COLUMN system_country TYPE VARCHAR(50)")
                    print("✓ system_country column updated to VARCHAR(50)")
                else:
                    print("✓ system_country column already has adequate length")
                    
            except Exception as e:
                print(f"⚠ Warning: Could not check/update system_country column: {e}")
        
        conn.commit()
        print("✓ All missing tables committed to database")
        
        # Create indexes for new tables
        print("Creating indexes...")
        indexes = [
            'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)',
            'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
            'CREATE INDEX IF NOT EXISTS idx_watchlist_keyword ON watchlist(keyword)',
            'CREATE INDEX IF NOT EXISTS idx_watchlist_field_type ON watchlist(field_type)',
            'CREATE INDEX IF NOT EXISTS idx_watchlist_active ON watchlist(is_active)',
            'CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status)',
            'CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity)',
            'CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at)',
            'CREATE INDEX IF NOT EXISTS idx_card_watchlist_bin ON card_watchlist(bin_number)',
            'CREATE INDEX IF NOT EXISTS idx_card_watchlist_active ON card_watchlist(is_active)',
            'CREATE INDEX IF NOT EXISTS idx_card_alerts_status ON card_alerts(status)',
            'CREATE INDEX IF NOT EXISTS idx_card_alerts_bin ON card_alerts(matched_bin)',
            'CREATE INDEX IF NOT EXISTS idx_credential_alert_details_alert_id ON credential_alert_details(alert_id)',
            'CREATE INDEX IF NOT EXISTS idx_credential_alert_details_credential_id ON credential_alert_details(credential_id)',
            'CREATE INDEX IF NOT EXISTS idx_credential_alert_details_domain ON credential_alert_details(domain)',
            'CREATE INDEX IF NOT EXISTS idx_credential_alert_details_country ON credential_alert_details(system_country)',
        ]
        
        for i, index_sql in enumerate(indexes):
            try:
                cursor.execute(index_sql)
                print(f"✓ Index {i+1}/{len(indexes)} created")
            except psycopg2.Error as e:
                print(f"⚠ Warning: Index {i+1} creation failed: {e}")
        
        conn.commit()
        print("✓ All indexes created")
        
        # Check if admin user exists, if not create it
        cursor.execute("SELECT COUNT(*) FROM users WHERE username = 'admin'")
        admin_count = cursor.fetchone()[0]
        
        if admin_count == 0:
            print("Creating default admin user...")
            cursor.execute('''
                INSERT INTO users (username, email, password_hash, role, api_key)
                VALUES ('admin', 'admin@company.com', %s, 'admin', 'api-key-123')
            ''', [hashlib.sha256('Test@2013'.encode()).hexdigest()])
            print("✓ Default admin user created")
        else:
            print("✓ Admin user already exists")
        
        # Insert some default watchlist items if table is empty
        cursor.execute("SELECT COUNT(*) FROM watchlist")
        watchlist_count = cursor.fetchone()[0]
        
        if watchlist_count == 0:
            print("Creating default watchlist items...")
            cursor.execute("SELECT id FROM users WHERE username = 'admin'")
            admin_id = cursor.fetchone()[0]
            
            default_watchlist = [
                ('gmail.com', 'domain', 'high', 'Monitor Gmail credentials'),
                ('admin', 'username', 'critical', 'Monitor admin accounts'),
                ('192.168.', 'ip', 'medium', 'Monitor local network IPs'),
                ('company.com', 'domain', 'high', 'Monitor company domain'),
                ('bank', 'domain', 'critical', 'Monitor banking domains'),
                ('yahoo.com', 'domain', 'medium', 'Monitor Yahoo credentials'),
                ('outlook.com', 'domain', 'medium', 'Monitor Outlook credentials'),
                ('root', 'username', 'critical', 'Monitor root accounts'),
                ('paypal', 'domain', 'critical', 'Monitor PayPal credentials')
            ]
            
            for keyword, field_type, severity, description in default_watchlist:
                cursor.execute('''
                    INSERT INTO watchlist (keyword, field_type, severity, description, created_by)
                    VALUES (%s, %s, %s, %s, %s)
                ''', [keyword, field_type, severity, description, admin_id])
            
            print("✓ Default watchlist items created")
        else:
            print("✓ Watchlist items already exist")

        # Insert Egyptian BIN watchlist items
        cursor.execute("SELECT COUNT(*) FROM card_watchlist")
        card_watchlist_count = cursor.fetchone()[0]
        
        if card_watchlist_count == 0:
            print("Creating Egyptian BIN watchlist items...")
            cursor.execute("SELECT id FROM users WHERE username = 'admin'")
            admin_id = cursor.fetchone()[0]
            
            for bin_number, bin_info in EGYPTIAN_BINS.items():
                cursor.execute('''
                    INSERT INTO card_watchlist (bin_number, bank_name, country, severity, description, created_by)
                    VALUES (%s, %s, %s, %s, %s, %s)
                ''', [bin_number, bin_info['issuer'], bin_info['country'], 'high', 
                     f"Monitor {bin_info['issuer']} {bin_info['card_type']} cards", admin_id])
            
            print(f"✓ {len(EGYPTIAN_BINS)} Egyptian BIN watchlist items created")
        else:
            print("✓ Card watchlist items already exist")
        
        conn.commit()
        print("✓ All default data created")
        
        conn.close()
        return True
        
    except psycopg2.Error as e:
        print(f"✗ Database error: {e}")
        if conn:
            conn.rollback()
            conn.close()
        return False
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        if conn:
            conn.rollback()
            conn.close()
        return False

def verify_tables():
    """Verify all required tables exist and have data"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        required_tables = ['users', 'watchlist', 'alerts', 'credentials', 'system_info', 'cards', 'card_watchlist', 'card_alerts', 'credential_alert_details']
        
        print("\nVerifying tables:")
        for table in required_tables:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                print(f"✓ {table}: {count} records")
            except psycopg2.Error as e:
                print(f"✗ {table}: Error - {e}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"Error verifying tables: {e}")
        return False

def get_db_connection():
    """Get database connection with error handling"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except psycopg2.Error as e:
        logger.error(f"Database connection error: {e}")
        return None

def execute_query(query, params=None, fetch=True):
    """Execute database query with error handling"""
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute(query, params)
        
        if fetch:
            result = cursor.fetchall()
            # Convert RealDictRow objects to regular dicts
            result = [dict(row) for row in result]
        else:
            result = cursor.rowcount
            
        conn.commit()
        return result
    except psycopg2.Error as e:
        logger.error(f"Database query error: {e}")
        conn.rollback()
        return None
    finally:
        conn.close()

def get_bin_info(card_number):
    """Get BIN information for a card number"""
    if not card_number or len(card_number) < 6:
        return None
    
    bin_number = card_number[:6]
    return EGYPTIAN_BINS.get(bin_number)

def check_card_watchlist_matches():
    """Check for card BIN matches in Egyptian watchlist"""
    try:
        logger.info("Starting card watchlist matching check...")
        
        # Get active card watchlist items
        watchlist_query = "SELECT * FROM card_watchlist WHERE is_active = TRUE"
        watchlist_items = execute_query(watchlist_query)
        
        if not watchlist_items:
            logger.info("No active card watchlist items found")
            return
        
        alerts_created = 0
        
        for item in watchlist_items:
            bin_number = item['bin_number']
            
            logger.info(f"Checking card watchlist item: {bin_number} ({item['bank_name']})")
            
            # Check cards table for matching BIN
            check_query = """
                SELECT id, number as card_number, cardholder, created_at, card_type, expiry
                FROM cards 
                WHERE LEFT(number, 6) = %s 
                AND id NOT IN (
                    SELECT card_id FROM card_alerts 
                    WHERE card_watchlist_id = %s
                )
                LIMIT 50
            """
            matches = execute_query(check_query, [bin_number, item['id']])
            
            # Create alerts for matches
            if matches:
                logger.info(f"Found {len(matches)} card matches for BIN {bin_number}")
                for match in matches:
                    try:
                        alert_query = """
                            INSERT INTO card_alerts (card_watchlist_id, matched_bin, card_number, 
                                                   card_id, bank_name, severity, status)
                            VALUES (%s, %s, %s, %s, %s, %s, 'new')
                        """
                        execute_query(alert_query, [
                            item['id'], 
                            bin_number, 
                            match['card_number'],
                            match['id'],
                            item['bank_name'],
                            item['severity']
                        ], fetch=False)
                        alerts_created += 1
                    except Exception as e:
                        logger.error(f"Error creating card alert for match {match['id']}: {e}")
            else:
                logger.info(f"No new card matches found for BIN {bin_number}")
        
        logger.info(f"Card watchlist check completed. Created {alerts_created} new card alerts")
        
    except Exception as e:
        logger.error(f"Error in card watchlist matching: {e}")

def create_enhanced_credential_alert(watchlist_item, credential_data):
    """Create a credential alert with full details in the optimization table"""
    try:
        # First create the basic alert
        alert_query = """
            INSERT INTO alerts (watchlist_id, matched_field, matched_value, 
                              record_type, record_id, severity, status)
            VALUES (%s, %s, %s, 'credential', %s, %s, 'new')
            RETURNING id
        """
        alert_result = execute_query(alert_query, [
            watchlist_item['id'], 
            watchlist_item['field_type'], 
            credential_data.get('matched_value', ''),
            credential_data['id'],
            watchlist_item['severity']
        ])
        
        if not alert_result:
            logger.error(f"Failed to create basic alert for credential {credential_data['id']}")
            return False
            
        alert_id = alert_result[0]['id']
        logger.info(f"Created basic alert {alert_id} for credential {credential_data['id']}")
        
        # Get full credential and system details
        detail_query = """
            SELECT c.*, s.country, s.ip, s.computer_name, s.os_version, s.machine_user
            FROM credentials c
            LEFT JOIN system_info s ON c.system_info_id = s.id
            WHERE c.id = %s
        """
        detail_result = execute_query(detail_query, [credential_data['id']])
        
        if not detail_result:
            logger.warning(f"No details found for credential {credential_data['id']}")
            return True  # Alert was created, just no details to store
            
        details = detail_result[0]
        
        # Handle IP address conversion safely
        system_ip = None
        if details.get('ip'):
            try:
                system_ip = str(details['ip'])
            except Exception as e:
                logger.warning(f"Could not convert IP address: {e}")
                system_ip = None
        
        # Handle country value safely
        safe_country = safe_country_value(details.get('country'))
        
        # Safely handle other text fields that might be too long
        safe_domain = str(details.get('domain', ''))[:255] if details.get('domain') else None
        safe_username = str(details.get('username', ''))[:255] if details.get('username') else None
        safe_password = str(details.get('password', '')) if details.get('password') else None
        safe_stealer_type = str(details.get('stealer_type', ''))[:100] if details.get('stealer_type') else None
        safe_computer_name = str(details.get('computer_name', ''))[:255] if details.get('computer_name') else None
        safe_os_version = str(details.get('os_version', ''))[:255] if details.get('os_version') else None
        safe_machine_user = str(details.get('machine_user', ''))[:255] if details.get('machine_user') else None
        
        # Insert into optimization table with proper error handling
        detail_insert_query = """
            INSERT INTO credential_alert_details (
                alert_id, credential_id, domain, url, username, password,
                stealer_type, system_country, system_ip, computer_name,
                os_version, machine_user
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        detail_params = [
            alert_id,
            details['id'],
            safe_domain,
            str(details.get('url', '')) if details.get('url') else None,
            safe_username,
            safe_password,
            safe_stealer_type,
            safe_country,
            system_ip,  # Use the safely converted IP
            safe_computer_name,
            safe_os_version,
            safe_machine_user
        ]
        
        detail_insert_result = execute_query(detail_insert_query, detail_params, fetch=False)
        
        if detail_insert_result:
            logger.info(f"Successfully created enhanced credential alert {alert_id} with full details")
            return True
        else:
            logger.error(f"Failed to insert details for alert {alert_id}")
            return True  # Alert exists, just details insertion failed
        
    except Exception as e:
        logger.error(f"Error creating enhanced credential alert: {e}")
        return False

def safe_country_value(country_value):
    """Safely process country value to fit database constraints"""
    if not country_value:
        return None
    
    # Convert to string and strip whitespace
    country_str = str(country_value).strip()
    
    # If it's longer than 50 characters, truncate it
    if len(country_str) > 50:
        logger.warning(f"Country value too long, truncating: {country_str[:50]}...")
        return country_str[:50]
    
    return country_str

def backfill_credential_alert_details():
    """Backfill missing credential alert details for existing alerts"""
    try:
        logger.info("Starting backfill of credential alert details...")
        
        # Find alerts that don't have details in the optimization table
        missing_details_query = """
            SELECT a.id as alert_id, a.record_id as credential_id, a.watchlist_id, a.severity
            FROM alerts a
            WHERE a.record_type = 'credential' 
            AND a.id NOT IN (
                SELECT alert_id FROM credential_alert_details WHERE alert_id IS NOT NULL
            )
            ORDER BY a.created_at DESC
            LIMIT 1000
        """
        
        missing_alerts = execute_query(missing_details_query)
        
        if not missing_alerts:
            logger.info("No alerts missing details found")
            return 0
        
        logger.info(f"Found {len(missing_alerts)} alerts missing details")
        success_count = 0
        
        for alert in missing_alerts:
            try:
                # Get full credential and system details
                detail_query = """
                    SELECT c.*, s.country, s.ip, s.computer_name, s.os_version, s.machine_user
                    FROM credentials c
                    LEFT JOIN system_info s ON c.system_info_id = s.id
                    WHERE c.id = %s
                """
                detail_result = execute_query(detail_query, [alert['credential_id']])
                
                if not detail_result:
                    logger.warning(f"No credential found for alert {alert['alert_id']}")
                    continue
                    
                details = detail_result[0]
                
                # Handle IP address conversion safely
                system_ip = None
                if details.get('ip'):
                    try:
                        system_ip = str(details['ip'])
                    except Exception as e:
                        logger.warning(f"Could not convert IP address: {e}")
                        system_ip = None
                
                # Handle country value safely
                safe_country = safe_country_value(details.get('country'))
                
                # Safely handle other text fields that might be too long
                safe_domain = str(details.get('domain', ''))[:255] if details.get('domain') else None
                safe_username = str(details.get('username', ''))[:255] if details.get('username') else None
                safe_password = str(details.get('password', '')) if details.get('password') else None
                safe_stealer_type = str(details.get('stealer_type', ''))[:100] if details.get('stealer_type') else None
                safe_computer_name = str(details.get('computer_name', ''))[:255] if details.get('computer_name') else None
                safe_os_version = str(details.get('os_version', ''))[:255] if details.get('os_version') else None
                safe_machine_user = str(details.get('machine_user', ''))[:255] if details.get('machine_user') else None
                
                # Insert into optimization table
                detail_insert_query = """
                    INSERT INTO credential_alert_details (
                        alert_id, credential_id, domain, url, username, password,
                        stealer_type, system_country, system_ip, computer_name,
                        os_version, machine_user
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                
                detail_params = [
                    alert['alert_id'],
                    details['id'],
                    safe_domain,
                    str(details.get('url', '')) if details.get('url') else None,
                    safe_username,
                    safe_password,
                    safe_stealer_type,
                    safe_country,
                    system_ip,
                    safe_computer_name,
                    safe_os_version,
                    safe_machine_user
                ]
                
                result = execute_query(detail_insert_query, detail_params, fetch=False)
                
                if result:
                    success_count += 1
                    if success_count % 10 == 0:
                        logger.info(f"Backfilled {success_count} alert details so far...")
                else:
                    logger.error(f"Failed to insert details for alert {alert['alert_id']}")
                        
            except Exception as e:
                logger.error(f"Error backfilling alert {alert['alert_id']}: {e}")
                continue
        
        logger.info(f"Backfill completed. Successfully processed {success_count} alerts")
        return success_count
        
    except Exception as e:
        logger.error(f"Error in backfill process: {e}")
        return 0

def check_watchlist_matches():
    """Enhanced watchlist matching with better coverage and optimization table"""
    try:
        logger.info("Starting enhanced watchlist matching check...")
        
        # Get active watchlist items
        watchlist_query = "SELECT * FROM watchlist WHERE is_active = TRUE"
        watchlist_items = execute_query(watchlist_query)
        
        if not watchlist_items:
            logger.info("No active watchlist items found")
            return
        
        alerts_created = 0
        
        for item in watchlist_items:
            keyword = item['keyword'].lower()
            field_type = item['field_type']
            
            logger.info(f"Checking watchlist item: {keyword} ({field_type})")
            
            # Check credentials table based on field type
            if field_type == 'domain':
                check_query = """
                    SELECT id, domain as matched_value, url, username, created_at 
                    FROM credentials 
                    WHERE LOWER(domain) LIKE %s 
                    AND id NOT IN (
                        SELECT record_id FROM alerts 
                        WHERE record_type = 'credential' AND watchlist_id = %s
                    )
                    LIMIT 50
                """
                matches = execute_query(check_query, [f'%{keyword}%', item['id']])
                
            elif field_type == 'username':
                check_query = """
                    SELECT id, username as matched_value, domain, url, created_at 
                    FROM credentials 
                    WHERE LOWER(username) LIKE %s 
                    AND id NOT IN (
                        SELECT record_id FROM alerts 
                        WHERE record_type = 'credential' AND watchlist_id = %s
                    )
                    LIMIT 50
                """
                matches = execute_query(check_query, [f'%{keyword}%', item['id']])
                
            elif field_type == 'ip':
                check_query = """
                    SELECT c.id, CAST(s.ip AS TEXT) as matched_value, c.domain, c.username, c.created_at 
                    FROM credentials c
                    LEFT JOIN system_info s ON c.system_info_id = s.id
                    WHERE CAST(s.ip AS TEXT) LIKE %s 
                    AND c.id NOT IN (
                        SELECT record_id FROM alerts 
                        WHERE record_type = 'credential' AND watchlist_id = %s
                    )
                    LIMIT 50
                """
                matches = execute_query(check_query, [f'%{keyword}%', item['id']])
                
            elif field_type == 'url':
                check_query = """
                    SELECT id, url as matched_value, domain, username, created_at 
                    FROM credentials 
                    WHERE LOWER(url) LIKE %s 
                    AND id NOT IN (
                        SELECT record_id FROM alerts 
                        WHERE record_type = 'credential' AND watchlist_id = %s
                    )
                    LIMIT 50
                """
                matches = execute_query(check_query, [f'%{keyword}%', item['id']])
                
            else:
                logger.warning(f"Unknown field type: {field_type}")
                continue
            
            # Create enhanced alerts for matches
            if matches:
                logger.info(f"Found {len(matches)} matches for {keyword}")
                for match in matches:
                    try:
                        if create_enhanced_credential_alert(item, match):
                            alerts_created += 1
                            logger.info(f"Created enhanced alert for credential {match['id']}")
                    except Exception as e:
                        logger.error(f"Error creating enhanced alert for match {match['id']}: {e}")
            else:
                logger.info(f"No new matches found for {keyword}")
        
        logger.info(f"Enhanced watchlist check completed. Created {alerts_created} new alerts")
        
    except Exception as e:
        logger.error(f"Error in enhanced watchlist matching: {e}")

# ... keep existing code (auth/login endpoint)

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Authentication with database verification"""
    data = request.get_json()
    username = data.get('username', '')
    password = data.get('password', '')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    # Check user in database
    query = "SELECT * FROM users WHERE username = %s AND is_active = TRUE"
    user_result = execute_query(query, [username])
    
    if user_result:
        user = user_result[0]
        # Hash the provided password and compare
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        if user['password_hash'] == password_hash:
            # Update last login
            update_query = "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = %s"
            execute_query(update_query, [user['id']], fetch=False)
            
            # Remove sensitive data
            user_data = {
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'role': user['role'],
                'is_active': user['is_active'],
                'api_key': user['api_key'],
                'created_at': user['created_at'].isoformat() if user['created_at'] else None
            }
            
            return jsonify({
                'access_token': f'jwt-token-{user["id"]}-{datetime.now().timestamp()}',
                'token_type': 'bearer',
                'user': user_data
            })
    
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/stats/overview')
def get_stats():
    """Get overview statistics from database with optional country filtering"""
    try:
        # Get country filter from query parameters
        country_filter = request.args.get('country')
        
        # Base where clause for country filtering
        country_where = ""
        country_params = []
        if country_filter:
            country_where = "WHERE s.country = %s"
            country_params = [country_filter]
        
        # Get total credentials with optional country filter
        cred_query = f"""
            SELECT COUNT(*) as count 
            FROM credentials c
            LEFT JOIN system_info s ON c.system_info_id = s.id
            {country_where}
        """
        cred_result = execute_query(cred_query, country_params)
        total_credentials = cred_result[0]['count'] if cred_result else 0
        
        # Get total cards with optional country filter
        card_query = f"""
            SELECT COUNT(*) as count 
            FROM cards c
            LEFT JOIN system_info s ON c.system_info_id = s.id
            {country_where}
        """
        card_result = execute_query(card_query, country_params)
        total_cards = card_result[0]['count'] if card_result else 0
        
        # Get total systems with optional country filter
        system_query = f"""
            SELECT COUNT(*) as count 
            FROM system_info s
            {country_where}
        """
        system_result = execute_query(system_query, country_params)
        total_systems = system_result[0]['count'] if system_result else 0
        
        # Get credential alerts count (not limited to 100)
        credential_alert_query = """
            SELECT COUNT(*) as count 
            FROM alerts a
            LEFT JOIN credentials c ON a.record_id = c.id AND a.record_type = 'credential'
            LEFT JOIN system_info s ON c.system_info_id = s.id
            WHERE a.status = 'new'
        """
        if country_filter:
            credential_alert_query += " AND s.country = %s"
        
        credential_alert_result = execute_query(credential_alert_query, country_params)
        credential_alerts = credential_alert_result[0]['count'] if credential_alert_result else 0
        
        # Get card alerts count (not limited to 100)
        card_alert_query = """
            SELECT COUNT(*) as count 
            FROM card_alerts ca
            LEFT JOIN cards c ON ca.card_id = c.id
            LEFT JOIN system_info s ON c.system_info_id = s.id
            WHERE ca.status = 'new'
        """
        if country_filter:
            card_alert_query += " AND s.country = %s"
            
        card_alert_result = execute_query(card_alert_query, country_params)
        card_alerts = card_alert_result[0]['count'] if card_alert_result else 0
        
        # Total alerts
        total_alerts = credential_alerts + card_alerts
        
        return jsonify({
            'total_credentials': total_credentials,
            'total_cards': total_cards,
            'total_systems': total_systems,
            'total_alerts': total_alerts,
            'alert_breakdown': {
                'credential_alerts': credential_alerts,
                'card_alerts': card_alerts
            },
            'country_filter': country_filter
        })
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        return jsonify({'error': 'Failed to fetch statistics'}), 500

@app.route('/api/cards/search')
def search_cards():
    """Search cards with filters, bank name filtering, and proper pagination"""
    try:
        # Get query parameters for filtering
        cardholder = request.args.get('cardholder')
        card_type = request.args.get('card_type')
        bin_number = request.args.get('bin_number')
        bank_name = request.args.get('bank_name')  # New bank name filter
        country = request.args.get('country')  # Add country filter support
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        # Pagination parameters with defaults
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 100))
        
        # Ensure per_page is exactly 100 as requested
        per_page = 100
        
        # Calculate offset
        offset = (page - 1) * per_page
        
        # Cap total results to 50,000 records
        max_offset = 50000 - per_page
        if offset > max_offset:
            offset = max_offset
        
        # Build query with filters
        where_conditions = []
        params = []
        
        if cardholder:
            where_conditions.append("LOWER(c.cardholder) LIKE %s")
            params.append(f'%{cardholder.lower()}%')
        
        if card_type:
            where_conditions.append("LOWER(c.card_type) = %s")
            params.append(card_type.lower())
        
        if bin_number:
            where_conditions.append("LEFT(c.number, 6) = %s")
            params.append(bin_number)
        
        if country:
            where_conditions.append("s.country = %s")
            params.append(country)
        
        if date_from:
            where_conditions.append("c.created_at >= %s")
            params.append(date_from)
        
        if date_to:
            where_conditions.append("c.created_at <= %s")
            params.append(date_to + ' 23:59:59')
        
        # Bank name filtering using BIN lookup
        bank_bin_filter = ""
        if bank_name:
            # Find BINs that match the bank name
            matching_bins = []
            for bin_num, bin_info in EGYPTIAN_BINS.items():
                if bank_name.lower() in bin_info['issuer'].lower():
                    matching_bins.append(bin_num)
            
            if matching_bins:
                bin_placeholders = ','.join(['%s'] * len(matching_bins))
                where_conditions.append(f"LEFT(c.number, 6) IN ({bin_placeholders})")
                params.extend(matching_bins)
            else:
                # If no matching BINs found, return empty result
                return jsonify({
                    'results': [],
                    'pagination': {
                        'page': page,
                        'per_page': per_page,
                        'total_count': 0,
                        'total_pages': 0,
                        'has_next': False,
                        'has_prev': False,
                        'max_records': 50000
                    }
                })
        
        where_clause = ""
        if where_conditions:
            where_clause = "WHERE " + " AND ".join(where_conditions)
        
        # Get total count for pagination info (limited to 50k)
        count_query = f"""
            SELECT COUNT(*) as total_count
            FROM (
                SELECT 1
                FROM cards c
                LEFT JOIN system_info s ON c.system_info_id = s.id
                {where_clause}
                LIMIT 50000
            ) as limited_results
        """
        count_result = execute_query(count_query, params)
        total_count = count_result[0]['total_count'] if count_result else 0
        
        # Main search query
        query = f"""
            SELECT c.*, s.country, s.stealer_type, s.machine_user, s.ip
            FROM cards c
            LEFT JOIN system_info s ON c.system_info_id = s.id
            {where_clause}
            ORDER BY c.created_at DESC
            LIMIT %s OFFSET %s
        """
        
        params.extend([per_page, offset])
        result = execute_query(query, params)
        
        # Add BIN information to each card
        if result:
            for card in result:
                bin_info = get_bin_info(card['number'])
                if bin_info:
                    card['bin_info'] = bin_info
                    card['egyptian_bank'] = bin_info['issuer']
                    card['scheme'] = bin_info['scheme']
                    card['is_egyptian'] = bin_info['country'] == 'EG'
                else:
                    card['bin_info'] = None
                    card['egyptian_bank'] = None
                    card['scheme'] = 'Unknown'
                    card['is_egyptian'] = False
                
                # Convert datetime objects to ISO strings
                for key, value in card.items():
                    if isinstance(value, datetime):
                        card[key] = value.isoformat()
        
        # Calculate pagination info
        total_pages = (total_count + per_page - 1) // per_page
        has_next = page < total_pages
        has_prev = page > 1
        
        return jsonify({
            'results': result if result else [],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total_count': total_count,
                'total_pages': total_pages,
                'has_next': has_next,
                'has_prev': has_prev,
                'max_records': 50000
            }
        })
    except Exception as e:
        logger.error(f"Error searching cards: {e}")
        return jsonify({'error': 'Failed to search cards'}), 500

@app.route('/api/card/<int:card_id>')
def get_card_detail(card_id):
    """Get detailed card information"""
    try:
        # Get card details
        card_query = """
            SELECT c.*, s.country, s.stealer_type, s.machine_user, s.ip, s.computer_name,
                   s.os_version, s.hwid, s.language, s.cpu_name, s.ram_size
            FROM cards c
            LEFT JOIN system_info s ON c.system_info_id = s.id
            WHERE c.id = %s
        """
        card_result = execute_query(card_query, [card_id])
        
        if not card_result:
            return jsonify({'error': 'Card not found'}), 404
        
        card = card_result[0]
        
        # Add BIN information
        bin_info = get_bin_info(card['number'])
        if bin_info:
            card['bin_info'] = bin_info
            card['egyptian_bank'] = bin_info['issuer']
            card['scheme'] = bin_info['scheme']
            card['is_egyptian'] = bin_info['country'] == 'EG'
        else:
            card['bin_info'] = None
            card['egyptian_bank'] = None
            card['scheme'] = 'Unknown'
            card['is_egyptian'] = False
        
        # Get related cards from same system
        related_cards_query = """
            SELECT * FROM cards 
            WHERE system_info_id = %s AND id != %s
            LIMIT 10
        """
        related_cards = execute_query(related_cards_query, [card['system_info_id'], card_id])
        
        # Get related credentials from same system
        related_credentials_query = """
            SELECT * FROM credentials 
            WHERE system_info_id = %s
            LIMIT 10
        """
        related_credentials = execute_query(related_credentials_query, [card['system_info_id']])
        
        # Convert datetime objects to ISO strings
        for item in [card] + (related_cards or []) + (related_credentials or []):
            if item:
                for key, value in item.items():
                    if isinstance(value, datetime):
                        item[key] = value.isoformat()
        
        return jsonify({
            'card': card,
            'related_cards': related_cards or [],
            'related_credentials': related_credentials or []
        })
    except Exception as e:
        logger.error(f"Error getting card detail: {e}")
        return jsonify({'error': 'Failed to fetch card details'}), 500

@app.route('/api/cards/stats')
def get_card_stats():
    """Get card statistics for dashboard"""
    try:
        # Get BIN distribution for Egyptian banks
        bin_stats_query = """
            SELECT LEFT(number, 6) as bin_number, COUNT(*) as count
            FROM cards
            WHERE LEFT(number, 6) IN %s
            GROUP BY LEFT(number, 6)
            ORDER BY count DESC
        """
        egyptian_bins = tuple(EGYPTIAN_BINS.keys())
        bin_stats = execute_query(bin_stats_query, [egyptian_bins])
        
        # Add bank information to BIN stats
        bin_data = []
        if bin_stats:
            for stat in bin_stats:
                bin_info = EGYPTIAN_BINS.get(stat['bin_number'], {})
                bin_data.append({
                    'bin_number': stat['bin_number'],
                    'count': stat['count'],
                    'bank_name': bin_info.get('issuer', 'Unknown'),
                    'scheme': bin_info.get('scheme', 'Unknown'),
                    'card_type': bin_info.get('card_type', 'Unknown')
                })
        
        # Get card type distribution
        card_type_query = """
            SELECT card_type, COUNT(*) as count
            FROM cards
            WHERE card_type IS NOT NULL
            GROUP BY card_type
            ORDER BY count DESC
        """
        card_type_stats = execute_query(card_type_query)
        
        # Get timeline data for last 30 days
        timeline_query = """
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM cards
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        """
        timeline_stats = execute_query(timeline_query)
        
        # Convert dates to ISO strings
        if timeline_stats:
            for stat in timeline_stats:
                stat['date'] = stat['date'].isoformat()
        
        # Get top Egyptian banks by card count
        bank_stats = {}
        for bin_number, bin_info in EGYPTIAN_BINS.items():
            bank_name = bin_info['issuer']
            if bank_name not in bank_stats:
                bank_stats[bank_name] = {'count': 0, 'bins': []}
            
            # Find count for this BIN
            bin_count = next((stat['count'] for stat in bin_stats if stat['bin_number'] == bin_number), 0)
            bank_stats[bank_name]['count'] += bin_count
            if bin_count > 0:
                bank_stats[bank_name]['bins'].append(bin_number)
        
        # Convert bank stats to list
        bank_data = []
        for bank_name, stats in bank_stats.items():
            if stats['count'] > 0:
                bank_data.append({
                    'bank_name': bank_name,
                    'count': stats['count'],
                    'bins': stats['bins']
                })
        
        bank_data.sort(key=lambda x: x['count'], reverse=True)
        
        return jsonify({
            'bin_stats': bin_data,
            'card_type_stats': card_type_stats or [],
            'timeline_stats': timeline_stats or [],
            'bank_stats': bank_data
        })
    except Exception as e:
        logger.error(f"Error getting card stats: {e}")
        return jsonify({'error': 'Failed to fetch card statistics'}), 500

@app.route('/api/cards/egyptian')
def get_egyptian_cards():
    """Get Egyptian credit cards with pagination for dashboard"""
    try:
        # Pagination parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 100))
        
        # Ensure per_page is exactly 100 as requested
        per_page = 100
        
        # Calculate offset
        offset = (page - 1) * per_page
        
        # Cap total results to 50,000 records
        max_offset = 50000 - per_page
        if offset > max_offset:
            offset = max_offset
        
        # Get Egyptian BINs
        egyptian_bins = tuple(EGYPTIAN_BINS.keys())
        
        # Get total count for pagination (limited to 50k)
        count_query = """
            SELECT COUNT(*) as total_count
            FROM (
                SELECT 1
                FROM cards c
                LEFT JOIN system_info s ON c.system_info_id = s.id
                WHERE LEFT(c.number, 6) IN %s
                LIMIT 50000
            ) as limited_results
        """
        count_result = execute_query(count_query, [egyptian_bins])
        total_count = count_result[0]['total_count'] if count_result else 0
        
        # Main query for Egyptian cards
        query = """
            SELECT c.*, s.country, s.stealer_type, s.machine_user, s.ip
            FROM cards c
            LEFT JOIN system_info s ON c.system_info_id = s.id
            WHERE LEFT(c.number, 6) IN %s
            ORDER BY c.created_at DESC
            LIMIT %s OFFSET %s
        """
        
        result = execute_query(query, [egyptian_bins, per_page, offset])
        
        # Add BIN information to each card
        if result:
            for card in result:
                bin_info = get_bin_info(card['number'])
                if bin_info:
                    card['bin_info'] = bin_info
                    card['egyptian_bank'] = bin_info['issuer']
                    card['scheme'] = bin_info['scheme']
                    card['is_egyptian'] = True
                else:
                    card['bin_info'] = None
                    card['egyptian_bank'] = None
                    card['scheme'] = 'Unknown'
                    card['is_egyptian'] = False
                
                # Convert datetime objects to ISO strings
                for key, value in card.items():
                    if isinstance(value, datetime):
                        card[key] = value.isoformat()
        
        # Calculate pagination info
        total_pages = (total_count + per_page - 1) // per_page
        has_next = page < total_pages
        has_prev = page > 1
        
        return jsonify({
            'results': result if result else [],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total_count': total_count,
                'total_pages': total_pages,
                'has_next': has_next,
                'has_prev': has_prev,
                'max_records': 50000
            }
        })
    except Exception as e:
        logger.error(f"Error getting Egyptian cards: {e}")
        return jsonify({'error': 'Failed to fetch Egyptian cards'}), 500

@app.route('/api/card-alerts')
def get_card_alerts():
    """Get card alerts from database with no default limit"""
    try:
        # Get query parameters for filtering
        status_filter = request.args.get('status')
        severity_filter = request.args.get('severity')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        # Pagination parameters - no default limit, let frontend control
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 1000))  # Increased default
        
        # Calculate offset
        offset = (page - 1) * per_page
        
        # Check for new card matches before returning alerts
        check_card_watchlist_matches()
        
        # Build query with filters
        where_conditions = []
        params = []
        
        if status_filter:
            where_conditions.append("ca.status = %s")
            params.append(status_filter)
        
        if severity_filter:
            where_conditions.append("ca.severity = %s")
            params.append(severity_filter)
        
        if date_from:
            where_conditions.append("ca.created_at >= %s")
            params.append(date_from)
        
        if date_to:
            where_conditions.append("ca.created_at <= %s")
            params.append(date_to + ' 23:59:59')
        
        where_clause = ""
        if where_conditions:
            where_clause = "WHERE " + " AND ".join(where_conditions)
        
        # Get total count first
        count_query = f"""
            SELECT COUNT(*) as total_count
            FROM card_alerts ca
            LEFT JOIN card_watchlist cw ON ca.card_watchlist_id = cw.id
            LEFT JOIN users u ON ca.reviewed_by = u.id
            {where_clause}
        """
        count_result = execute_query(count_query, params)
        total_count = count_result[0]['total_count'] if count_result else 0
        
        # Main query with pagination
        query = f"""
            SELECT 
                ca.id, ca.card_watchlist_id, ca.matched_bin, ca.card_number,
                ca.card_id, ca.bank_name, ca.severity, ca.status,
                ca.reviewed_by, ca.reviewed_at, ca.created_at,
                cw.bin_number, cw.description,
                u.username as reviewed_by_username
            FROM card_alerts ca
            LEFT JOIN card_watchlist cw ON ca.card_watchlist_id = cw.id
            LEFT JOIN users u ON ca.reviewed_by = u.id
            {where_clause}
            ORDER BY ca.created_at DESC
            LIMIT %s OFFSET %s
        """
        
        params.extend([per_page, offset])
        result = execute_query(query, params)
        
        if result:
            # Convert datetime objects to ISO strings
            for alert in result:
                for key, value in alert.items():
                    if isinstance(value, datetime):
                        alert[key] = value.isoformat()
        
        # Calculate pagination info
        total_pages = (total_count + per_page - 1) // per_page
        has_next = page < total_pages
        has_prev = page > 1
        
        return jsonify({
            'results': result if result else [],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total_count': total_count,
                'total_pages': total_pages,
                'has_next': has_next,
                'has_prev': has_prev
            }
        })
    except Exception as e:
        logger.error(f"Error getting card alerts: {e}")
        return jsonify({'error': 'Failed to fetch card alerts'}), 500

@app.route('/api/card-alerts/<int:alert_id>/resolve', methods=['POST'])
def resolve_card_alert(alert_id):
    """Resolve a card alert"""
    try:
        data = request.get_json() or {}
        user_id = data.get('user_id', 1)
        
        query = """
            UPDATE card_alerts 
            SET status = 'reviewed', reviewed_by = %s, reviewed_at = CURRENT_TIMESTAMP 
            WHERE id = %s
        """
        result = execute_query(query, [user_id, alert_id], fetch=False)
        
        if result and result > 0:
            return jsonify({'message': 'Card alert resolved successfully'})
        else:
            return jsonify({'error': 'Card alert not found'}), 404
    except Exception as e:
        logger.error(f"Error resolving card alert: {e}")
        return jsonify({'error': 'Failed to resolve card alert'}), 500

@app.route('/api/card-alerts/<int:alert_id>/false-positive', methods=['POST'])
def mark_card_alert_false_positive(alert_id):
    """Mark a card alert as false positive"""
    try:
        data = request.get_json() or {}
        user_id = data.get('user_id', 1)
        
        query = """
            UPDATE card_alerts 
            SET status = 'false_positive', reviewed_by = %s, reviewed_at = CURRENT_TIMESTAMP 
            WHERE id = %s
        """
        result = execute_query(query, [user_id, alert_id], fetch=False)
        
        if result and result > 0:
            return jsonify({'message': 'Card alert marked as false positive'})
        else:
            return jsonify({'error': 'Card alert not found'}), 404
    except Exception as e:
        logger.error(f"Error marking card alert as false positive: {e}")
        return jsonify({'error': 'Failed to mark card alert as false positive'}), 500

# ... keep existing code (remaining endpoints)

@app.route('/api/alerts')
def get_alerts():
    """Get alerts from database with enhanced filtering and no default limit"""
    try:
        # Get query parameters for filtering
        status_filter = request.args.get('status')
        severity_filter = request.args.get('severity')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        # Pagination parameters - no default limit, let frontend control
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 1000))  # Increased default
        
        # Calculate offset
        offset = (page - 1) * per_page
        
        # Check for new matches before returning alerts
        check_watchlist_matches()
        
        # Build query with filters
        where_conditions = []
        params = []
        
        if status_filter:
            where_conditions.append("a.status = %s")
            params.append(status_filter)
        
        if severity_filter:
            where_conditions.append("a.severity = %s")
            params.append(severity_filter)
        
        if date_from:
            where_conditions.append("a.created_at >= %s")
            params.append(date_from)
        
        if date_to:
            where_conditions.append("a.created_at <= %s")
            params.append(date_to + ' 23:59:59')
        
        where_clause = ""
        if where_conditions:
            where_clause = "WHERE " + " AND ".join(where_conditions)
        
        # Get total count first
        count_query = f"""
            SELECT COUNT(*) as total_count
            FROM alerts a
            LEFT JOIN watchlist w ON a.watchlist_id = w.id
            LEFT JOIN users u ON a.reviewed_by = u.id
            {where_clause}
        """
        count_result = execute_query(count_query, params)
        total_count = count_result[0]['total_count'] if count_result else 0
        
        # Main query with pagination
        query = f"""
            SELECT 
                a.id, a.watchlist_id, a.matched_field, a.matched_value,
                a.record_type, a.record_id, a.severity, a.status,
                a.reviewed_by, a.reviewed_at, a.created_at,
                w.keyword, w.description, w.field_type,
                u.username as reviewed_by_username
            FROM alerts a
            LEFT JOIN watchlist w ON a.watchlist_id = w.id
            LEFT JOIN users u ON a.reviewed_by = u.id
            {where_clause}
            ORDER BY a.created_at DESC
            LIMIT %s OFFSET %s
        """
        
        params.extend([per_page, offset])
        result = execute_query(query, params)
        
        if result:
            # Convert datetime objects to ISO strings
            for alert in result:
                for key, value in alert.items():
                    if isinstance(value, datetime):
                        alert[key] = value.isoformat()
        
        # Calculate pagination info
        total_pages = (total_count + per_page - 1) // per_page
        has_next = page < total_pages
        has_prev = page > 1
        
        return jsonify({
            'results': result if result else [],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total_count': total_count,
                'total_pages': total_pages,
                'has_next': has_next,
                'has_prev': has_prev
            }
        })
    except Exception as e:
        logger.error(f"Error getting alerts: {e}")
        return jsonify({'error': 'Failed to fetch alerts'}), 500

@app.route('/api/alerts/optimized')
def get_optimized_alerts():
    """Get optimized alerts using the credential_alert_details table for better performance"""
    try:
        # Get query parameters for filtering
        status_filter = request.args.get('status')
        severity_filter = request.args.get('severity')
        country_filter = request.args.get('country')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        # Pagination parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 1000))
        
        # Calculate offset
        offset = (page - 1) * per_page
        
        # Check for new matches before returning alerts
        check_watchlist_matches()
        
        # Build query with filters using the optimized table
        where_conditions = []
        params = []
        
        if status_filter:
            where_conditions.append("a.status = %s")
            params.append(status_filter)
        
        if severity_filter:
            where_conditions.append("a.severity = %s")
            params.append(severity_filter)
        
        if country_filter:
            where_conditions.append("(cad.system_country = %s OR s.country = %s)")
            params.extend([country_filter, country_filter])
        
        if date_from:
            where_conditions.append("a.created_at >= %s")
            params.append(date_from)
        
        if date_to:
            where_conditions.append("a.created_at <= %s")
            params.append(date_to + ' 23:59:59')
        
        where_clause = ""
        if where_conditions:
            where_clause = "WHERE " + " AND ".join(where_conditions)
        
        # Get total count first - includes alerts with and without details
        count_query = f"""
            SELECT COUNT(*) as total_count
            FROM alerts a
            LEFT JOIN credential_alert_details cad ON a.id = cad.alert_id
            LEFT JOIN credentials c ON a.record_id = c.id AND a.record_type = 'credential'
            LEFT JOIN system_info s ON c.system_info_id = s.id
            LEFT JOIN watchlist w ON a.watchlist_id = w.id
            WHERE a.record_type = 'credential'
        """
        
        # Add where clause if exists
        if where_conditions:
            count_query += " AND " + " AND ".join(where_conditions)
        
        count_result = execute_query(count_query, params)
        total_count = count_result[0]['total_count'] if count_result else 0
        
        # Main optimized query - LEFT JOIN to include alerts even without details
        query = f"""
            SELECT 
                a.id, a.watchlist_id, a.matched_field, a.matched_value,
                a.record_type, a.record_id, a.severity, a.status,
                a.reviewed_by, a.reviewed_at, a.created_at,
                w.keyword, w.description, w.field_type,
                u.username as reviewed_by_username,
                -- Optimized details (if available)
                cad.domain as opt_domain, 
                cad.url as opt_url, 
                cad.username as opt_username,
                cad.stealer_type as opt_stealer_type, 
                cad.system_country as opt_country, 
                cad.system_ip as opt_ip,
                cad.computer_name as opt_computer_name, 
                cad.os_version as opt_os_version, 
                cad.machine_user as opt_machine_user,
                -- Fallback details (if optimization missing)
                c.domain as fallback_domain,
                c.url as fallback_url,
                c.username as fallback_username,
                c.stealer_type as fallback_stealer_type,
                s.country as fallback_country,
                s.ip as fallback_ip,
                s.computer_name as fallback_computer_name,
                s.os_version as fallback_os_version,
                s.machine_user as fallback_machine_user
            FROM alerts a
            LEFT JOIN credential_alert_details cad ON a.id = cad.alert_id
            LEFT JOIN credentials c ON a.record_id = c.id AND a.record_type = 'credential'
            LEFT JOIN system_info s ON c.system_info_id = s.id
            LEFT JOIN watchlist w ON a.watchlist_id = w.id
            LEFT JOIN users u ON a.reviewed_by = u.id
            WHERE a.record_type = 'credential'
        """
        
        # Add where clause if exists
        if where_conditions:
            query += " AND " + " AND ".join(where_conditions)
            
        query += " ORDER BY a.created_at DESC LIMIT %s OFFSET %s"
        
        params.extend([per_page, offset])
        result = execute_query(query, params)
        
        if result:
            # Process results to use optimized data when available, fallback otherwise
            for alert in result:
                # Use optimized data if available, otherwise fallback to regular data
                alert['domain'] = alert.get('opt_domain') or alert.get('fallback_domain')
                alert['url'] = alert.get('opt_url') or alert.get('fallback_url')
                alert['credential_username'] = alert.get('opt_username') or alert.get('fallback_username')
                alert['stealer_type'] = alert.get('opt_stealer_type') or alert.get('fallback_stealer_type')
                alert['system_country'] = alert.get('opt_country') or alert.get('fallback_country')
                alert['system_ip'] = str(alert.get('opt_ip') or alert.get('fallback_ip') or '')
                alert['computer_name'] = alert.get('opt_computer_name') or alert.get('fallback_computer_name')
                alert['os_version'] = alert.get('opt_os_version') or alert.get('fallback_os_version')
                alert['machine_user'] = alert.get('opt_machine_user') or alert.get('fallback_machine_user')
                
                # Add flag to indicate if optimized data was used
                alert['used_optimized_data'] = bool(alert.get('opt_domain') is not None)
                
                # Clean up the temporary fields
                keys_to_remove = [k for k in alert.keys() if k.startswith('opt_') or k.startswith('fallback_')]
                for key in keys_to_remove:
                    del alert[key]
                
                # Convert datetime objects to ISO strings
                for key, value in alert.items():
                    if isinstance(value, datetime):
                        alert[key] = value.isoformat()
        
        # Calculate pagination info
        total_pages = (total_count + per_page - 1) // per_page
        has_next = page < total_pages
        has_prev = page > 1
        
        # Count how many used optimized vs fallback data
        optimized_count = sum(1 for alert in result if alert.get('used_optimized_data', False)) if result else 0
        fallback_count = len(result) - optimized_count if result else 0
        
        return jsonify({
            'results': result if result else [],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total_count': total_count,
                'total_pages': total_pages,
                'has_next': has_next,
                'has_prev': has_prev
            },
            'optimization_stats': {
                'optimized_data_used': optimized_count,
                'fallback_data_used': fallback_count,
                'optimization_percentage': round((optimized_count / len(result) * 100) if result else 0, 2)
            },
            'optimized': True,
            'note': 'Uses credential_alert_details table when available, falls back to live data otherwise'
        })
    except Exception as e:
        logger.error(f"Error getting optimized alerts: {e}")
        return jsonify({'error': 'Failed to fetch optimized alerts'}), 500

@app.route('/api/alerts/<int:alert_id>/resolve', methods=['POST'])
def resolve_alert(alert_id):
    """Resolve an alert"""
    try:
        data = request.get_json() or {}
        user_id = data.get('user_id', 1)
        
        query = """
            UPDATE alerts 
            SET status = 'reviewed', reviewed_by = %s, reviewed_at = CURRENT_TIMESTAMP 
            WHERE id = %s
        """
        result = execute_query(query, [user_id, alert_id], fetch=False)
        
        if result and result > 0:
            return jsonify({'message': 'Alert resolved successfully'})
        else:
            return jsonify({'error': 'Alert not found'}), 404
    except Exception as e:
        logger.error(f"Error resolving alert: {e}")
        return jsonify({'error': 'Failed to resolve alert'}), 500

@app.route('/api/alerts/<int:alert_id>/false-positive', methods=['POST'])
def mark_false_positive(alert_id):
    """Mark an alert as false positive"""
    try:
        data = request.get_json() or {}
        user_id = data.get('user_id', 1)
        
        query = """
            UPDATE alerts 
            SET status = 'false_positive', reviewed_by = %s, reviewed_at = CURRENT_TIMESTAMP 
            WHERE id = %s
        """
        result = execute_query(query, [user_id, alert_id], fetch=False)
        
        if result and result > 0:
            return jsonify({'message': 'Alert marked as false positive'})
        else:
            return jsonify({'error': 'Alert not found'}), 404
    except Exception as e:
        logger.error(f"Error marking alert as false positive: {e}")
        return jsonify({'error': 'Failed to mark alert as false positive'}), 500

@app.route('/api/credentials/search')
def search_credentials():
    """Search credentials with filters and proper pagination"""
    try:
        # Get query parameters for filtering
        domain = request.args.get('domain')
        username = request.args.get('username')
        stealer_type = request.args.get('stealer_type')
        country = request.args.get('country')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        # Pagination parameters with defaults
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 100))
        
        # Ensure per_page is exactly 100 as requested
        per_page = 100
        
        # Calculate offset
        offset = (page - 1) * per_page
        
        # Cap total results to 50,000 records
        max_offset = 50000 - per_page
        if offset > max_offset:
            offset = max_offset
        
        # Build query with filters
        where_conditions = []
        params = []
        
        if domain:
            where_conditions.append("(LOWER(c.domain) LIKE %s OR LOWER(c.url) LIKE %s)")
            params.extend([f'%{domain.lower()}%', f'%{domain.lower()}%'])
        
        if username:
            where_conditions.append("LOWER(c.username) LIKE %s")
            params.append(f'%{username.lower()}%')
        
        if stealer_type:
            where_conditions.append("c.stealer_type = %s")
            params.append(stealer_type)
        
        if country:
            where_conditions.append("s.country = %s")
            params.append(country)
        
        if date_from:
            where_conditions.append("c.created_at >= %s")
            params.append(date_from)
        
        if date_to:
            where_conditions.append("c.created_at <= %s")
            params.append(date_to + ' 23:59:59')
        
        where_clause = ""
        if where_conditions:
            where_clause = "WHERE " + " AND ".join(where_conditions)
        
        # Get total count for pagination info (limited to 50k)
        count_query = f"""
            SELECT COUNT(*) as total_count
            FROM (
                SELECT 1
                FROM credentials c
                LEFT JOIN system_info s ON c.system_info_id = s.id
                {where_clause}
                LIMIT 50000
            ) as limited_results
        """
        count_result = execute_query(count_query, params)
        total_count = count_result[0]['total_count'] if count_result else 0
        
        # Main search query
        query = f"""
            SELECT c.*, s.country, s.computer_name, s.os_version, s.language
            FROM credentials c
            LEFT JOIN system_info s ON c.system_info_id = s.id
            {where_clause}
            ORDER BY c.created_at DESC
            LIMIT %s OFFSET %s
        """
        
        params.extend([per_page, offset])
        result = execute_query(query, params)
        
        if result:
            # Convert datetime objects to ISO strings
            for cred in result:
                for key, value in cred.items():
                    if isinstance(value, datetime):
                        cred[key] = value.isoformat()
        
        # Calculate pagination info
        total_pages = (total_count + per_page - 1) // per_page
        has_next = page < total_pages
        has_prev = page > 1
        
        return jsonify({
            'results': result if result else [],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total_count': total_count,
                'total_pages': total_pages,
                'has_next': has_next,
                'has_prev': has_prev,
                'max_records': 50000
            }
        })
    except Exception as e:
        logger.error(f"Error searching credentials: {e}")
        return jsonify({'error': 'Failed to search credentials'}), 500

@app.route('/api/credential/<int:credential_id>')
def get_credential_detail(credential_id):
    """Get detailed credential information"""
    try:
        # Get credential details
        credential_query = """
            SELECT c.*, s.country, s.stealer_type, s.machine_user, s.ip, s.computer_name,
                   s.os_version, s.hwid, s.language, s.cpu_name, s.ram_size
            FROM credentials c
            LEFT JOIN system_info s ON c.system_info_id = s.id
            WHERE c.id = %s
        """
        credential_result = execute_query(credential_query, [credential_id])
        
        if not credential_result:
            return jsonify({'error': 'Credential not found'}), 404
        
        credential = credential_result[0]
        
        # Get related cards from same system
        related_cards_query = """
            SELECT * FROM cards 
            WHERE system_info_id = %s
            LIMIT 10
        """
        related_cards = execute_query(related_cards_query, [credential['system_info_id']])
        
        # Get related credentials from same system
        related_credentials_query = """
            SELECT * FROM credentials 
            WHERE system_info_id = %s AND id != %s
            LIMIT 10
        """
        related_credentials = execute_query(related_credentials_query, [credential['system_info_id'], credential_id])
        
        # Convert datetime objects to ISO strings
        for item in [credential] + (related_cards or []) + (related_credentials or []):
            if item:
                for key, value in item.items():
                    if isinstance(value, datetime):
                        item[key] = value.isoformat()
        
        return jsonify({
            'credential': credential,
            'related_cards': related_cards or [],
            'related_credentials': related_credentials or []
        })
    except Exception as e:
        logger.error(f"Error getting credential detail: {e}")
        return jsonify({'error': 'Failed to fetch credential details'}), 500

@app.route('/api/stats/countries')
def get_country_stats():
    """Get country statistics with optional filtering for dashboard consistency"""
    try:
        # Get country filter from query parameters
        country_filter = request.args.get('country')
        
        if country_filter:
            # If filtering by specific country, return just that country's stats
            query = """
                SELECT s.country, COUNT(*) as count
                FROM system_info s
                WHERE s.country = %s AND s.country IS NOT NULL
                GROUP BY s.country
                ORDER BY count DESC
            """
            result = execute_query(query, [country_filter])
        else:
            # Return all countries
            query = """
                SELECT s.country, COUNT(*) as count
                FROM system_info s
                WHERE s.country IS NOT NULL
                GROUP BY s.country
                ORDER BY count DESC
                LIMIT 20
            """
            result = execute_query(query)
        
        return jsonify(result if result else [])
    except Exception as e:
        logger.error(f"Error getting country stats: {e}")
        return jsonify({'error': 'Failed to fetch country statistics'}), 500

@app.route('/api/stats/stealers')
def get_stealer_stats():
    """Get stealer statistics with optional country filtering"""
    try:
        # Get country filter from query parameters
        country_filter = request.args.get('country')
        
        # Base query with optional country filter
        if country_filter:
            query = """
                SELECT c.stealer_type, COUNT(*) as count
                FROM credentials c
                LEFT JOIN system_info s ON c.system_info_id = s.id
                WHERE c.stealer_type IS NOT NULL AND s.country = %s
                GROUP BY c.stealer_type
                ORDER BY count DESC
                LIMIT 20
            """
            result = execute_query(query, [country_filter])
        else:
            query = """
                SELECT stealer_type, COUNT(*) as count
                FROM credentials
                WHERE stealer_type IS NOT NULL
                GROUP BY stealer_type
                ORDER BY count DESC
                LIMIT 20
            """
            result = execute_query(query)
        
        return jsonify(result if result else [])
    except Exception as e:
        logger.error(f"Error getting stealer stats: {e}")
        return jsonify({'error': 'Failed to fetch stealer statistics'}), 500

@app.route('/api/stats/top-domains')
def get_top_domains():
    """Get top domains statistics"""
    try:
        query = """
            SELECT 
                COALESCE(domain, 
                    CASE 
                        WHEN url LIKE 'http%' THEN 
                            SUBSTRING(url FROM 'https?://(?:www\.)?([^/]+)')
                        ELSE url 
                    END
                ) as domain,
                COUNT(*) as count
            FROM credentials
            WHERE domain IS NOT NULL OR url IS NOT NULL
            GROUP BY COALESCE(domain, 
                    CASE 
                        WHEN url LIKE 'http%' THEN 
                            SUBSTRING(url FROM 'https?://(?:www\.)?([^/]+)')
                        ELSE url 
                    END
                )
            ORDER BY count DESC
            LIMIT 50
        """
        result = execute_query(query)
        return jsonify(result if result else [])
    except Exception as e:
        logger.error(f"Error getting top domains: {e}")
        return jsonify({'error': 'Failed to fetch top domains'}), 500

@app.route('/api/stats/timeline')
def get_timeline_stats():
    """Get timeline statistics with optional country filtering"""
    try:
        # Get country filter from query parameters
        country_filter = request.args.get('country')
        
        # Base query with optional country filter
        if country_filter:
            query = """
                SELECT DATE(c.created_at) as date, COUNT(*) as count
                FROM credentials c
                LEFT JOIN system_info s ON c.system_info_id = s.id
                WHERE c.created_at >= CURRENT_DATE - INTERVAL '30 days'
                AND s.country = %s
                GROUP BY DATE(c.created_at)
                ORDER BY date DESC
            """
            result = execute_query(query, [country_filter])
        else:
            query = """
                SELECT DATE(created_at) as date, COUNT(*) as count
                FROM credentials
                WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY DATE(created_at)
                ORDER BY date DESC
            """
            result = execute_query(query)
        
        if result:
            # Convert dates to ISO strings
            for stat in result:
                stat['date'] = stat['date'].isoformat()
        
        return jsonify(result if result else [])
    except Exception as e:
        logger.error(f"Error getting timeline stats: {e}")
        return jsonify({'error': 'Failed to fetch timeline statistics'}), 500

@app.route('/api/watchlist')
def get_watchlist():
    """Get watchlist items"""
    try:
        query = """
            SELECT w.*, u.username as created_by_username
            FROM watchlist w
            LEFT JOIN users u ON w.created_by = u.id
            ORDER BY w.created_at DESC
        """
        result = execute_query(query)
        
        if result:
            # Convert datetime objects to ISO strings
            for item in result:
                for key, value in item.items():
                    if isinstance(value, datetime):
                        item[key] = value.isoformat()
        
        return jsonify(result if result else [])
    except Exception as e:
        logger.error(f"Error getting watchlist: {e}")
        return jsonify({'error': 'Failed to fetch watchlist'}), 500

@app.route('/api/watchlist', methods=['POST'])
def create_watchlist_item():
    """Create a new watchlist item"""
    try:
        data = request.get_json()
        
        query = """
            INSERT INTO watchlist (keyword, field_type, severity, description, created_by)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING *
        """
        result = execute_query(query, [
            data['keyword'],
            data['field_type'],
            data.get('severity', 'medium'),
            data.get('description', ''),
            data.get('created_by', 1)
        ])
        
        if result:
            item = result[0]
            # Convert datetime objects to ISO strings
            for key, value in item.items():
                if isinstance(value, datetime):
                    item[key] = value.isoformat()
            return jsonify(item)
        else:
            return jsonify({'error': 'Failed to create watchlist item'}), 500
    except Exception as e:
        logger.error(f"Error creating watchlist item: {e}")
        return jsonify({'error': 'Failed to create watchlist item'}), 500

@app.route('/api/watchlist/<int:item_id>', methods=['DELETE'])
def delete_watchlist_item(item_id):
    """Delete a watchlist item"""
    try:
        query = "DELETE FROM watchlist WHERE id = %s"
        result = execute_query(query, [item_id], fetch=False)
        
        if result and result > 0:
            return jsonify({'message': 'Watchlist item deleted successfully'})
        else:
            return jsonify({'error': 'Watchlist item not found'}), 404
    except Exception as e:
        logger.error(f"Error deleting watchlist item: {e}")
        return jsonify({'error': 'Failed to delete watchlist item'}), 500

@app.route('/api/watchlist/bins', methods=['GET'])
def get_bin_watchlist():
    """Get BIN watchlist items"""
    try:
        query = """
            SELECT cw.*, u.username as created_by_username
            FROM card_watchlist cw
            LEFT JOIN users u ON cw.created_by = u.id
            ORDER BY cw.created_at DESC
        """
        result = execute_query(query)
        
        if result:
            # Convert datetime objects to ISO strings
            for item in result:
                for key, value in item.items():
                    if isinstance(value, datetime):
                        item[key] = value.isoformat()
        
        return jsonify(result if result else [])
    except Exception as e:
        logger.error(f"Error getting BIN watchlist: {e}")
        return jsonify({'error': 'Failed to fetch BIN watchlist'}), 500

@app.route('/api/watchlist/bins', methods=['POST'])
def create_bin_watchlist_item():
    """Create a new BIN watchlist item"""
    try:
        data = request.get_json()
        
        query = """
            INSERT INTO card_watchlist (bin_number, bank_name, country, severity, description, created_by)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING *
        """
        result = execute_query(query, [
            data['bin_number'],
            data.get('bank_name', ''),
            data.get('country', 'EG'),
            data.get('severity', 'medium'),
            data.get('description', ''),
            data.get('created_by', 1)
        ])
        
        if result:
            item = result[0]
            # Convert datetime objects to ISO strings
            for key, value in item.items():
                if isinstance(value, datetime):
                    item[key] = value.isoformat()
            return jsonify(item)
        else:
            return jsonify({'error': 'Failed to create BIN watchlist item'}), 500
    except Exception as e:
        logger.error(f"Error creating BIN watchlist item: {e}")
        return jsonify({'error': 'Failed to create BIN watchlist item'}), 500

@app.route('/api/watchlist/bins/upload', methods=['POST'])
def upload_bin_watchlist():
    """Upload BIN watchlist from file or manual input"""
    try:
        # Handle both file upload and manual input
        if 'file' in request.files:
            # File upload
            file = request.files['file']
            if file.filename == '':
                return jsonify({'error': 'No file selected'}), 400
            
            if not file.filename.endswith('.txt'):
                return jsonify({'error': 'Only .txt files are allowed'}), 400
            
            # Read file content
            content = file.read().decode('utf-8')
            lines = content.strip().split('\n')
            
        else:
            # Manual input
            data = request.get_json()
            if not data or 'content' not in data:
                return jsonify({'error': 'No content provided'}), 400
            
            content = data['content']
            lines = content.strip().split('\n')
        
        # Parse lines - expect format: BIN,Scheme,Bank,Country
        created_items = []
        skipped_items = []
        errors = []
        
        for i, line in enumerate(lines, 1):
            line = line.strip()
            if not line or line.startswith('#'):  # Skip empty lines and comments
                continue
            
            if i == 1 and line.lower().startswith('bin,'):  # Skip header line
                continue
            
            try:
                parts = [p.strip() for p in line.split(',')]
                if len(parts) < 4:
                    errors.append(f"Line {i}: Invalid format - expected BIN,Scheme,Bank,Country")
                    continue
                
                bin_number, scheme, bank_name, country = parts[:4]
                
                # Validate BIN number
                if not bin_number.isdigit() or len(bin_number) != 6:
                    errors.append(f"Line {i}: Invalid BIN number - must be 6 digits")
                    continue
                
                # Check if BIN already exists
                check_query = "SELECT COUNT(*) as count FROM card_watchlist WHERE bin_number = %s"
                check_result = execute_query(check_query, [bin_number])
                if check_result and check_result[0]['count'] > 0:
                    skipped_items.append(f"BIN {bin_number} already exists in watchlist")
                    continue
                
                # Create watchlist item
                insert_query = """
                    INSERT INTO card_watchlist (bin_number, bank_name, country, severity, description, created_by)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING *
                """
                result = execute_query(insert_query, [
                    bin_number,
                    bank_name,
                    country.upper(),
                    'high',  # Default severity for uploaded BINs
                    f"Uploaded BIN for {bank_name} ({scheme})",
                    1  # Default user ID
                ])
                
                if result:
                    created_items.append(result[0])
                else:
                    errors.append(f"Line {i}: Failed to create watchlist item for BIN {bin_number}")
                    
            except Exception as e:
                errors.append(f"Line {i}: Error processing line - {str(e)}")
        
        # Convert datetime objects to ISO strings in created items
        for item in created_items:
            for key, value in item.items():
                if isinstance(value, datetime):
                    item[key] = value.isoformat()
        
        return jsonify({
            'success': True,
            'created_count': len(created_items),
            'skipped_count': len(skipped_items),
            'error_count': len(errors),
            'created_items': created_items,
            'skipped_items': skipped_items,
            'errors': errors
        })
        
    except Exception as e:
        logger.error(f"Error uploading BIN watchlist: {e}")
        return jsonify({'error': 'Failed to upload BIN watchlist'}), 500

@app.route('/api/watchlist/bins/<int:item_id>', methods=['DELETE'])
def delete_bin_watchlist_item(item_id):
    """Delete a BIN watchlist item"""
    try:
        query = "DELETE FROM card_watchlist WHERE id = %s"
        result = execute_query(query, [item_id], fetch=False)
        
        if result and result > 0:
            return jsonify({'message': 'BIN watchlist item deleted successfully'})
        else:
            return jsonify({'error': 'BIN watchlist item not found'}), 404
    except Exception as e:
        logger.error(f"Error deleting BIN watchlist item: {e}")
        return jsonify({'error': 'Failed to delete BIN watchlist item'}), 500

@app.route('/api/watchlist/stats')
def get_watchlist_stats():
    """Get watchlist statistics and alert counts"""
    try:
        # Get watchlist items with their alert counts
        watchlist_stats_query = """
            SELECT 
                w.id, w.keyword, w.field_type, w.severity, w.description,
                w.is_active, w.created_at,
                COUNT(a.id) as alert_count,
                COUNT(CASE WHEN a.status = 'new' THEN 1 END) as new_alerts,
                COUNT(CASE WHEN a.status = 'reviewed' THEN 1 END) as reviewed_alerts,
                COUNT(CASE WHEN a.status = 'false_positive' THEN 1 END) as false_positive_alerts
            FROM watchlist w
            LEFT JOIN alerts a ON w.id = a.watchlist_id
            GROUP BY w.id, w.keyword, w.field_type, w.severity, w.description, w.is_active, w.created_at
            ORDER BY alert_count DESC, w.created_at DESC
        """
        
        watchlist_stats = execute_query(watchlist_stats_query)
        
        # Get BIN watchlist items with their alert counts
        bin_watchlist_stats_query = """
            SELECT 
                cw.id, cw.bin_number, cw.bank_name, cw.country, cw.severity, 
                cw.description, cw.is_active, cw.created_at,
                COUNT(ca.id) as alert_count,
                COUNT(CASE WHEN ca.status = 'new' THEN 1 END) as new_alerts,
                COUNT(CASE WHEN ca.status = 'reviewed' THEN 1 END) as reviewed_alerts,
                COUNT(CASE WHEN ca.status = 'false_positive' THEN 1 END) as false_positive_alerts
            FROM card_watchlist cw
            LEFT JOIN card_alerts ca ON cw.id = ca.card_watchlist_id
            GROUP BY cw.id, cw.bin_number, cw.bank_name, cw.country, cw.severity, cw.description, cw.is_active, cw.created_at
            ORDER BY alert_count DESC, cw.created_at DESC
        """
        
        bin_watchlist_stats = execute_query(bin_watchlist_stats_query)
        
        # Get overall alert statistics
        total_credential_alerts_query = "SELECT COUNT(*) as count FROM alerts"
        total_card_alerts_query = "SELECT COUNT(*) as count FROM card_alerts"
        
        total_credential_alerts = execute_query(total_credential_alerts_query)
        total_card_alerts = execute_query(total_card_alerts_query)
        
        credential_alert_count = total_credential_alerts[0]['count'] if total_credential_alerts else 0
        card_alert_count = total_card_alerts[0]['count'] if total_card_alerts else 0
        
        # Convert datetime objects to ISO strings
        if watchlist_stats:
            for item in watchlist_stats:
                for key, value in item.items():
                    if isinstance(value, datetime):
                        item[key] = value.isoformat()
        
        if bin_watchlist_stats:
            for item in bin_watchlist_stats:
                for key, value in item.items():
                    if isinstance(value, datetime):
                        item[key] = value.isoformat()
        
        return jsonify({
            'watchlist_stats': watchlist_stats or [],
            'bin_watchlist_stats': bin_watchlist_stats or [],
            'total_stats': {
                'total_credential_alerts': credential_alert_count,
                'total_card_alerts': card_alert_count,
                'total_alerts': credential_alert_count + card_alert_count,
                'total_watchlist_items': len(watchlist_stats) if watchlist_stats else 0,
                'total_bin_watchlist_items': len(bin_watchlist_stats) if bin_watchlist_stats else 0
            }
        })
    except Exception as e:
        logger.error(f"Error getting watchlist stats: {e}")
        return jsonify({'error': 'Failed to fetch watchlist statistics'}), 500

@app.route('/api/dashboard/comprehensive')
def get_comprehensive_dashboard():
    """Get all dashboard statistics in a single optimized API call"""
    try:
        # Get country filter from query parameters
        country_filter = request.args.get('country')
        
        # Base where clause for country filtering
        country_where = ""
        country_params = []
        if country_filter:
            country_where = "WHERE s.country = %s"
            country_params = [country_filter]
        
        # Get overview statistics
        overview_stats = {}
        
        # Total credentials
        cred_query = f"""
            SELECT COUNT(*) as count 
            FROM credentials c
            LEFT JOIN system_info s ON c.system_info_id = s.id
            {country_where}
        """
        cred_result = execute_query(cred_query, country_params)
        overview_stats['total_credentials'] = cred_result[0]['count'] if cred_result else 0
        
        # Total cards
        card_query = f"""
            SELECT COUNT(*) as count 
            FROM cards c
            LEFT JOIN system_info s ON c.system_info_id = s.id
            {country_where}
        """
        card_result = execute_query(card_query, country_params)
        overview_stats['total_cards'] = card_result[0]['count'] if card_result else 0
        
        # Total systems
        system_query = f"""
            SELECT COUNT(*) as count 
            FROM system_info s
            {country_where}
        """
        system_result = execute_query(system_query, country_params)
        overview_stats['total_systems'] = system_result[0]['count'] if system_result else 0
        
        # Alert statistics with country filtering
        credential_alert_query = """
            SELECT COUNT(*) as count 
            FROM alerts a
            LEFT JOIN credentials c ON a.record_id = c.id AND a.record_type = 'credential'
            LEFT JOIN system_info s ON c.system_info_id = s.id
            WHERE a.status = 'new'
        """
        if country_filter:
            credential_alert_query += " AND s.country = %s"
        
        credential_alert_result = execute_query(credential_alert_query, country_params)
        credential_alerts = credential_alert_result[0]['count'] if credential_alert_result else 0
        
        card_alert_query = """
            SELECT COUNT(*) as count 
            FROM card_alerts ca
            LEFT JOIN cards c ON ca.card_id = c.id
            LEFT JOIN system_info s ON c.system_info_id = s.id
            WHERE ca.status = 'new'
        """
        if country_filter:
            card_alert_query += " AND s.country = %s"
            
        card_alert_result = execute_query(card_alert_query, country_params)
        card_alerts = card_alert_result[0]['count'] if card_alert_result else 0
        
        overview_stats['total_alerts'] = credential_alerts + card_alerts
        overview_stats['alert_breakdown'] = {
            'credential_alerts': credential_alerts,
            'card_alerts': card_alerts
        }
        
        # Get stealer statistics with country filtering
        if country_filter:
            stealer_query = """
                SELECT c.stealer_type, COUNT(*) as count
                FROM credentials c
                LEFT JOIN system_info s ON c.system_info_id = s.id
                WHERE c.stealer_type IS NOT NULL AND s.country = %s
                GROUP BY c.stealer_type
                ORDER BY count DESC
                LIMIT 10
            """
            stealer_stats = execute_query(stealer_query, [country_filter])
        else:
            stealer_query = """
                SELECT stealer_type, COUNT(*) as count
                FROM credentials
                WHERE stealer_type IS NOT NULL
                GROUP BY stealer_type
                ORDER BY count DESC
                LIMIT 10
            """
            stealer_stats = execute_query(stealer_query)
        
        # Get timeline statistics with country filtering
        if country_filter:
            timeline_query = """
                SELECT DATE(c.created_at) as date, COUNT(*) as count
                FROM credentials c
                LEFT JOIN system_info s ON c.system_info_id = s.id
                WHERE c.created_at >= CURRENT_DATE - INTERVAL '30 days'
                AND s.country = %s
                GROUP BY DATE(c.created_at)
                ORDER BY date DESC
                LIMIT 30
            """
            timeline_stats = execute_query(timeline_query, [country_filter])
        else:
            timeline_query = """
                SELECT DATE(created_at) as date, COUNT(*) as count
                FROM credentials
                WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY DATE(created_at)
                ORDER BY date DESC
                LIMIT 30
            """
            timeline_stats = execute_query(timeline_query)
        
        # Convert dates to ISO strings
        if timeline_stats:
            for stat in timeline_stats:
                stat['date'] = stat['date'].isoformat()
        
        # Get country distribution
        if country_filter:
            country_query = """
                SELECT s.country, COUNT(*) as count
                FROM system_info s
                WHERE s.country = %s AND s.country IS NOT NULL
                GROUP BY s.country
            """
            country_stats = execute_query(country_query, [country_filter])
        else:
            country_query = """
                SELECT s.country, COUNT(*) as count
                FROM system_info s
                WHERE s.country IS NOT NULL
                GROUP BY s.country
                ORDER BY count DESC
                LIMIT 10
            """
            country_stats = execute_query(country_query)
        
        # Get top domains with country filtering
        if country_filter:
            domain_query = """
                SELECT 
                    COALESCE(c.domain, 
                        CASE 
                            WHEN c.url LIKE 'http%' THEN 
                                SUBSTRING(c.url FROM 'https?://(?:www\.)?([^/]+)')
                            ELSE c.url 
                        END
                    ) as domain,
                    COUNT(*) as count
                FROM credentials c
                LEFT JOIN system_info s ON c.system_info_id = s.id
                WHERE (c.domain IS NOT NULL OR c.url IS NOT NULL) AND s.country = %s
                GROUP BY COALESCE(c.domain, 
                        CASE 
                            WHEN c.url LIKE 'http%' THEN 
                                SUBSTRING(c.url FROM 'https?://(?:www\.)?([^/]+)')
                            ELSE c.url 
                        END
                    )
                ORDER BY count DESC
                LIMIT 10
            """
            domain_stats = execute_query(domain_query, [country_filter])
        else:
            domain_query = """
                SELECT 
                    COALESCE(domain, 
                        CASE 
                            WHEN url LIKE 'http%' THEN 
                                SUBSTRING(url FROM 'https?://(?:www\.)?([^/]+)')
                            ELSE url 
                        END
                    ) as domain,
                    COUNT(*) as count
                FROM credentials
                WHERE domain IS NOT NULL OR url IS NOT NULL
                GROUP BY COALESCE(domain, 
                        CASE 
                            WHEN url LIKE 'http%' THEN 
                                SUBSTRING(url FROM 'https?://(?:www\.)?([^/]+)')
                            ELSE url 
                        END
                    )
                ORDER BY count DESC
                LIMIT 10
            """
            domain_stats = execute_query(domain_query)
        
        # Compile comprehensive response
        response = {
            'overview': overview_stats,
            'stealer_distribution': stealer_stats or [],
            'timeline': timeline_stats or [],
            'country_distribution': country_stats or [],
            'top_domains': domain_stats or [],
            'filters': {
                'country': country_filter
            },
            'metadata': {
                'generated_at': datetime.now().isoformat(),
                'optimized': True,
                'single_call': True
            }
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error getting comprehensive dashboard: {e}")
        return jsonify({'error': 'Failed to fetch comprehensive dashboard data'}), 500

@app.route('/api/export/credentials')
def export_credentials():
    """Export credentials to CSV format"""
    try:
        # Get the same filters as search
        domain = request.args.get('domain')
        username = request.args.get('username')
        stealer_type = request.args.get('stealer_type')
        country = request.args.get('country')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        # Build query with filters (same logic as search)
        where_conditions = []
        params = []
        
        if domain:
            where_conditions.append("(LOWER(c.domain) LIKE %s OR LOWER(c.url) LIKE %s)")
            params.extend([f'%{domain.lower()}%', f'%{domain.lower()}%'])
        
        if username:
            where_conditions.append("LOWER(c.username) LIKE %s")
            params.append(f'%{username.lower()}%')
        
        if stealer_type:
            where_conditions.append("c.stealer_type = %s")
            params.append(stealer_type)
        
        if country:
            where_conditions.append("s.country = %s")
            params.append(country)
        
        if date_from:
            where_conditions.append("c.created_at >= %s")
            params.append(date_from)
        
        if date_to:
            where_conditions.append("c.created_at <= %s")
            params.append(date_to + ' 23:59:59')
        
        where_clause = ""
        if where_conditions:
            where_clause = "WHERE " + " AND ".join(where_conditions)
        
        # Query for export (limit to 10,000 records for performance)
        query = f"""
            SELECT 
                c.id, c.domain, c.url, c.username, c.password,
                c.stealer_type, c.created_at,
                s.country, s.computer_name, s.os_version, s.machine_user, s.ip
            FROM credentials c
            LEFT JOIN system_info s ON c.system_info_id = s.id
            {where_clause}
            ORDER BY c.created_at DESC
            LIMIT 10000
        """
        
        result = execute_query(query, params)
        
        if not result:
            return jsonify({'error': 'No data found to export'}), 404
        
        # Create CSV content
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'ID', 'Domain', 'URL', 'Username', 'Password', 
            'Stealer Type', 'Created Date', 'Country', 
            'Computer Name', 'OS Version', 'Machine User', 'IP'
        ])
        
        # Write data rows
        for row in result:
            writer.writerow([
                row.get('id', ''),
                row.get('domain', ''),
                row.get('url', ''),
                row.get('username', ''),
                row.get('password', ''),
                row.get('stealer_type', ''),
                row.get('created_at', '').isoformat() if row.get('created_at') else '',
                row.get('country', ''),
                row.get('computer_name', ''),
                row.get('os_version', ''),
                row.get('machine_user', ''),
                row.get('ip', '')
            ])
        
        # Create response
        csv_data = output.getvalue()
        output.close()
        
        response = make_response(csv_data)
        response.headers['Content-Type'] = 'text/csv'
        response.headers['Content-Disposition'] = f'attachment; filename=credentials_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        
        return response
        
    except Exception as e:
        logger.error(f"Error exporting credentials: {e}")
        return jsonify({'error': 'Failed to export credentials'}), 500

@app.route('/api/health')
def health_check():
    """Enhanced health check endpoint to verify database connectivity and optimization status"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({
                'status': 'unhealthy', 
                'database': 'disconnected',
                'timestamp': datetime.now().isoformat()
            }), 500
        
        cursor = conn.cursor()
        
        # Basic database connectivity test
        cursor.execute("SELECT 1")
        cursor.fetchone()
        
        # Check credential alert optimization status
        optimization_status = {}
        try:
            # Get total credential alerts
            cursor.execute("SELECT COUNT(*) FROM alerts WHERE record_type = 'credential'")
            total_alerts = cursor.fetchone()[0]
            
            # Get alerts with optimization details
            cursor.execute("""
                SELECT COUNT(DISTINCT a.id) 
                FROM alerts a 
                INNER JOIN credential_alert_details cad ON a.id = cad.alert_id
                WHERE a.record_type = 'credential'
            """)
            alerts_with_details = cursor.fetchone()[0]
            
            # Calculate optimization status
            missing_details = total_alerts - alerts_with_details
            coverage_percentage = (alerts_with_details / total_alerts * 100) if total_alerts > 0 else 100
            
            optimization_status = {
                'total_credential_alerts': total_alerts,
                'alerts_with_optimization': alerts_with_details,
                'alerts_missing_optimization': missing_details,
                'optimization_coverage_percentage': round(coverage_percentage, 2),
                'status': 'complete' if missing_details == 0 else 'partial'
            }
            
        except Exception as e:
            optimization_status = {
                'status': 'error',
                'error': str(e)
            }
        
        # Check table existence
        table_status = {}
        required_tables = ['alerts', 'credentials', 'cards', 'watchlist', 'card_watchlist', 'credential_alert_details']
        
        for table in required_tables:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                table_status[table] = {'exists': True, 'record_count': count}
            except:
                table_status[table] = {'exists': False, 'record_count': 0}
        
        conn.close()
        
        # Determine overall health
        overall_status = 'healthy'
        if optimization_status.get('status') == 'error':
            overall_status = 'degraded'
        elif optimization_status.get('optimization_coverage_percentage', 0) < 50:
            overall_status = 'degraded'
        
        return jsonify({
            'status': overall_status,
            'database': 'connected',
            'optimization': optimization_status,
            'tables': table_status,
            'timestamp': datetime.now().isoformat(),
            'version': '2.0.0',
            'features': {
                'credential_alert_optimization': True,
                'country_filtering': True,
                'bin_upload': True,
                'comprehensive_dashboard': True
            }
        })
        
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return jsonify({
            'status': 'unhealthy', 
            'database': 'error',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/maintenance/backfill-alerts', methods=['POST'])
def trigger_backfill_alerts():
    """Maintenance endpoint to backfill missing credential alert details"""
    try:
        logger.info("Manual backfill triggered via API")
        
        # Check authentication (in production, add proper auth)
        auth_header = request.headers.get('Authorization')
        if not auth_header or 'admin' not in auth_header.lower():
            return jsonify({'error': 'Admin access required'}), 403
        
        # Run the backfill process
        success_count = backfill_credential_alert_details()
        
        return jsonify({
            'success': True,
            'message': f'Backfill completed successfully',
            'alerts_processed': success_count,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in backfill endpoint: {e}")
        return jsonify({'error': 'Failed to run backfill process'}), 500

@app.route('/api/maintenance/alert-details-status')
def get_alert_details_status():
    """Get status of credential alert details table"""
    try:
        # Get total alerts
        total_alerts_query = "SELECT COUNT(*) as count FROM alerts WHERE record_type = 'credential'"
        total_alerts_result = execute_query(total_alerts_query)
        total_alerts = total_alerts_result[0]['count'] if total_alerts_result else 0
        
        # Get alerts with details
        alerts_with_details_query = """
            SELECT COUNT(DISTINCT a.id) as count 
            FROM alerts a 
            INNER JOIN credential_alert_details cad ON a.id = cad.alert_id
            WHERE a.record_type = 'credential'
        """
        alerts_with_details_result = execute_query(alerts_with_details_query)
        alerts_with_details = alerts_with_details_result[0]['count'] if alerts_with_details_result else 0
        
        # Get alerts missing details
        missing_details = total_alerts - alerts_with_details
        
        # Calculate percentage
        coverage_percentage = (alerts_with_details / total_alerts * 100) if total_alerts > 0 else 0
        
        # Get sample of missing alerts
        missing_sample_query = """
            SELECT a.id, a.created_at, a.severity, w.keyword 
            FROM alerts a
            LEFT JOIN watchlist w ON a.watchlist_id = w.id
            WHERE a.record_type = 'credential' 
            AND a.id NOT IN (
                SELECT alert_id FROM credential_alert_details WHERE alert_id IS NOT NULL
            )
            ORDER BY a.created_at DESC
            LIMIT 5
        """
        missing_sample = execute_query(missing_sample_query)
        
        # Convert dates to strings
        if missing_sample:
            for alert in missing_sample:
                if alert.get('created_at'):
                    alert['created_at'] = alert['created_at'].isoformat()
        
        return jsonify({
            'total_credential_alerts': total_alerts,
            'alerts_with_details': alerts_with_details,
            'alerts_missing_details': missing_details,
            'coverage_percentage': round(coverage_percentage, 2),
            'missing_sample': missing_sample or [],
            'status': 'complete' if missing_details == 0 else 'incomplete',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting alert details status: {e}")
        return jsonify({'error': 'Failed to get status'}), 500

@app.route('/api/maintenance/force-watchlist-check', methods=['POST'])
def force_watchlist_check():
    """Force a watchlist check to create new alerts"""
    try:
        logger.info("Manual watchlist check triggered via API")
        
        # Check authentication (in production, add proper auth)
        auth_header = request.headers.get('Authorization')
        if not auth_header or 'admin' not in auth_header.lower():
            return jsonify({'error': 'Admin access required'}), 403
        
        # Run watchlist matching
        check_watchlist_matches()
        
        return jsonify({
            'success': True,
            'message': 'Watchlist check completed',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in force watchlist check: {e}")
        return jsonify({'error': 'Failed to run watchlist check'}), 500

@app.route('/api/maintenance/fix-schema', methods=['POST'])
def fix_database_schema():
    """Fix database schema issues and clean up problematic data"""
    try:
        logger.info("Manual schema fix triggered via API")
        
        # Check authentication (in production, add proper auth)
        auth_header = request.headers.get('Authorization')
        if not auth_header or 'admin' not in auth_header.lower():
            return jsonify({'error': 'Admin access required'}), 403
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor()
        fixes_applied = []
        
        try:
            # Check and fix system_country column length
            cursor.execute("""
                SELECT character_maximum_length 
                FROM information_schema.columns 
                WHERE table_name = 'credential_alert_details' 
                AND column_name = 'system_country'
            """)
            result = cursor.fetchone()
            
            if result and result[0] == 10:
                cursor.execute("ALTER TABLE credential_alert_details ALTER COLUMN system_country TYPE VARCHAR(50)")
                fixes_applied.append("Updated system_country column from VARCHAR(10) to VARCHAR(50)")
                logger.info("Fixed system_country column length")
            else:
                fixes_applied.append("system_country column already has adequate length")
            
            # Clean up any existing problematic data
            cursor.execute("""
                UPDATE credential_alert_details 
                SET system_country = LEFT(system_country, 50) 
                WHERE LENGTH(system_country) > 50
            """)
            updated_rows = cursor.rowcount
            if updated_rows > 0:
                fixes_applied.append(f"Truncated {updated_rows} country values that were too long")
                
            # Clean up other potentially problematic fields
            field_fixes = [
                ("domain", 255),
                ("username", 255),
                ("stealer_type", 100),
                ("computer_name", 255),
                ("os_version", 255),
                ("machine_user", 255)
            ]
            
            for field_name, max_length in field_fixes:
                cursor.execute(f"""
                    UPDATE credential_alert_details 
                    SET {field_name} = LEFT({field_name}, %s) 
                    WHERE LENGTH({field_name}) > %s
                """, [max_length, max_length])
                
                updated_rows = cursor.rowcount
                if updated_rows > 0:
                    fixes_applied.append(f"Truncated {updated_rows} {field_name} values that were too long")
            
            conn.commit()
            
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Schema fixes completed',
            'fixes_applied': fixes_applied,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in schema fix endpoint: {e}")
        return jsonify({'error': f'Failed to fix schema: {str(e)}'}), 500

# Initialize database only once in main process
if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
    print("✓ Running in reloader main process")
    
    # Test connection first
    if test_connection():
        existing_tables = check_existing_tables()
        
        if create_missing_tables():
            print("\n✓ Database setup completed successfully!")
            verify_tables()
            
            # Auto-populate credential alert details on startup
            print("\n🔄 Checking credential alert details optimization...")
            try:
                # Check status first
                total_alerts_query = "SELECT COUNT(*) as count FROM alerts WHERE record_type = 'credential'"
                total_alerts_result = execute_query(total_alerts_query)
                total_alerts = total_alerts_result[0]['count'] if total_alerts_result else 0
                
                alerts_with_details_query = """
                    SELECT COUNT(DISTINCT a.id) as count 
                    FROM alerts a 
                    INNER JOIN credential_alert_details cad ON a.id = cad.alert_id
                    WHERE a.record_type = 'credential'
                """
                alerts_with_details_result = execute_query(alerts_with_details_query)
                alerts_with_details = alerts_with_details_result[0]['count'] if alerts_with_details_result else 0
                
                missing_details = total_alerts - alerts_with_details
                
                if missing_details > 0:
                    print(f"🔄 Found {missing_details} alerts missing optimization details")
                    print("🔄 Running automatic backfill process...")
                    
                    # Run limited backfill on startup (max 100 to not slow down startup)
                    backfill_query = """
                        SELECT a.id as alert_id, a.record_id as credential_id, a.watchlist_id, a.severity
                        FROM alerts a
                        WHERE a.record_type = 'credential' 
                        AND a.id NOT IN (
                            SELECT alert_id FROM credential_alert_details WHERE alert_id IS NOT NULL
                        )
                        ORDER BY a.created_at DESC
                        LIMIT 100
                    """
                    
                    missing_alerts = execute_query(backfill_query)
                    backfilled_count = 0
                    
                    if missing_alerts:
                        for alert in missing_alerts:
                            try:
                                detail_query = """
                                    SELECT c.*, s.country, s.ip, s.computer_name, s.os_version, s.machine_user
                                    FROM credentials c
                                    LEFT JOIN system_info s ON c.system_info_id = s.id
                                    WHERE c.id = %s
                                """
                                detail_result = execute_query(detail_query, [alert['credential_id']])
                                
                                if detail_result:
                                    details = detail_result[0]
                                    
                                    # Handle IP address conversion safely
                                    system_ip = None
                                    if details.get('ip'):
                                        try:
                                            system_ip = str(details['ip'])
                                        except:
                                            system_ip = None
                                    
                                    # Handle country value safely
                                    safe_country = safe_country_value(details.get('country'))
                                    
                                    # Safely handle other text fields that might be too long
                                    safe_domain = str(details.get('domain', ''))[:255] if details.get('domain') else None
                                    safe_username = str(details.get('username', ''))[:255] if details.get('username') else None
                                    safe_password = str(details.get('password', '')) if details.get('password') else None
                                    safe_stealer_type = str(details.get('stealer_type', ''))[:100] if details.get('stealer_type') else None
                                    safe_computer_name = str(details.get('computer_name', ''))[:255] if details.get('computer_name') else None
                                    safe_os_version = str(details.get('os_version', ''))[:255] if details.get('os_version') else None
                                    safe_machine_user = str(details.get('machine_user', ''))[:255] if details.get('machine_user') else None
                                    
                                    detail_insert_query = """
                                        INSERT INTO credential_alert_details (
                                            alert_id, credential_id, domain, url, username, password,
                                            stealer_type, system_country, system_ip, computer_name,
                                            os_version, machine_user
                                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                                    """
                                    
                                    result = execute_query(detail_insert_query, [
                                        alert['alert_id'], details['id'], safe_domain,
                                        str(details.get('url', '')) if details.get('url') else None, 
                                        safe_username, safe_password,
                                        safe_stealer_type, safe_country, system_ip,
                                        safe_computer_name, safe_os_version, 
                                        safe_machine_user
                                    ], fetch=False)
                                    
                                    if result:
                                        backfilled_count += 1
                                        
                            except Exception as e:
                                continue
                    
                    print(f"✓ Automatically backfilled {backfilled_count} alert details on startup")
                    if missing_details > 100:
                        print(f"⚠ {missing_details - 100} alerts still need backfilling (use /api/maintenance/backfill-alerts)")
                else:
                    print("✓ All credential alerts have optimization details")
                    
            except Exception as e:
                print(f"⚠ Error during startup backfill: {e}")
        else:
            print("\n✗ Database setup failed!")
        
    else:
        print("✗ Database connection failed - please check your configuration")

if __name__ == '__main__':
    print("Starting Flask backend server with PostgreSQL integration...")
    print("Backend will run on http://localhost:5000")
    print("Database configuration:")
    print(f"  Host: {DB_CONFIG['host']}")
    print(f"  Database: {DB_CONFIG['database']}")
    print(f"  User: {DB_CONFIG['user']}")
    print(f"  Port: {DB_CONFIG['port']}")
    print("Login credentials: admin / Test@2013")
    
    # Test database connection on startup
    if test_connection():
        existing_tables = check_existing_tables()
        
        # Create missing tables
        if create_missing_tables():
            print("\n✓ Database setup completed successfully!")
            
            # Verify everything is working
            verify_tables()
            
            print("\n🚀 Your Flask app should now work without database errors!")
            print("Login credentials: admin / Test@2013")
        else:
            print("\n✗ Database setup failed!")
    else:
        print("✗ Database connection failed - please check your configuration")
    
    app.run(debug=True, port=5000, host='0.0.0.0')
