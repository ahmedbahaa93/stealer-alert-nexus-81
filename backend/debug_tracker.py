#!/usr/bin/env python3
"""
Debug script to investigate data_change_tracker issues
"""

import psycopg2
from datetime import datetime
import time

# Database configuration (update these)
DB_CONFIG = {
    'host': 'localhost',
    'database': 'stealer_analysis',
    'user': 'stealer_user',
    'password': 'Test@2013',
    'port': 5432
}

def get_db_connection():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"Database connection failed: {e}")
        return None

def debug_tracker_status():
    """Check the current status of data_change_tracker"""
    conn = get_db_connection()
    if not conn:
        return
    
    cursor = conn.cursor()
    
    print("🔍 Current Data Change Tracker Status")
    print("=" * 60)
    
    # Get current tracker data
    cursor.execute("""
        SELECT table_name, last_insert, insert_count 
        FROM data_change_tracker 
        ORDER BY table_name
    """)
    
    results = cursor.fetchall()
    
    for table_name, last_insert, insert_count in results:
        print(f"📊 {table_name:15} | {last_insert} | {insert_count:3} inserts")
    
    print("\n🔍 Checking for suspicious patterns...")
    
    # Check if all timestamps are identical (this shouldn't happen)
    cursor.execute("""
        SELECT last_insert, COUNT(*) as count
        FROM data_change_tracker 
        GROUP BY last_insert
        HAVING COUNT(*) > 1
    """)
    
    identical_timestamps = cursor.fetchall()
    if identical_timestamps:
        print("⚠️  WARNING: Found identical timestamps across multiple tables:")
        for timestamp, count in identical_timestamps:
            print(f"   {timestamp} appears in {count} tables")
    else:
        print("✅ All timestamps are unique (good)")
    
    # Check if triggers exist
    print("\n🔍 Checking database triggers...")
    cursor.execute("""
        SELECT trigger_name, event_object_table, action_statement
        FROM information_schema.triggers 
        WHERE trigger_name LIKE '%_insert_trigger'
        ORDER BY trigger_name
    """)
    
    triggers = cursor.fetchall()
    expected_triggers = [
        'credential_insert_trigger',
        'card_insert_trigger', 
        'system_insert_trigger',
        'watchlist_insert_trigger',
        'card_watchlist_insert_trigger'
    ]
    
    found_triggers = [t[0] for t in triggers]
    
    for expected in expected_triggers:
        if expected in found_triggers:
            print(f"✅ {expected}")
        else:
            print(f"❌ {expected} - MISSING!")
    
    # Check recent inserts to actual tables
    print("\n🔍 Checking recent activity in monitored tables...")
    tables_to_check = ['credentials', 'cards', 'system_info', 'watchlist', 'card_watchlist']
    
    for table in tables_to_check:
        try:
            if table in ['credentials', 'cards']:
                cursor.execute(f"SELECT MAX(created_at) FROM {table}")
            elif table == 'system_info':
                cursor.execute(f"SELECT MAX(created_at) FROM {table}")
            else:  # watchlist tables
                cursor.execute(f"SELECT MAX(created_at) FROM {table}")
            
            result = cursor.fetchone()
            last_real_insert = result[0] if result[0] else "No data"
            print(f"📊 {table:15} | Last real insert: {last_real_insert}")
            
        except Exception as e:
            print(f"❌ {table:15} | Error: {e}")
    
    conn.close()

def reset_tracker_to_real_data():
    """Reset tracker to match actual table data"""
    conn = get_db_connection()
    if not conn:
        return
    
    cursor = conn.cursor()
    
    print("\n🔧 Resetting tracker to match real data...")
    
    try:
        # Update credentials tracker
        cursor.execute("""
            UPDATE data_change_tracker 
            SET last_insert = (SELECT COALESCE(MAX(created_at), CURRENT_TIMESTAMP) FROM credentials),
                insert_count = (SELECT COUNT(*) FROM credentials)
            WHERE table_name = 'credentials'
        """)
        
        # Update cards tracker  
        cursor.execute("""
            UPDATE data_change_tracker 
            SET last_insert = (SELECT COALESCE(MAX(created_at), CURRENT_TIMESTAMP) FROM cards),
                insert_count = (SELECT COUNT(*) FROM cards)
            WHERE table_name = 'cards'
        """)
        
        # Update system_info tracker
        cursor.execute("""
            UPDATE data_change_tracker 
            SET last_insert = (SELECT COALESCE(MAX(created_at), CURRENT_TIMESTAMP) FROM system_info),
                insert_count = (SELECT COUNT(*) FROM system_info)
            WHERE table_name = 'system_info'
        """)
        
        # Update watchlist tracker
        cursor.execute("""
            UPDATE data_change_tracker 
            SET last_insert = (SELECT COALESCE(MAX(created_at), CURRENT_TIMESTAMP) FROM watchlist),
                insert_count = (SELECT COUNT(*) FROM watchlist)
            WHERE table_name = 'watchlist'
        """)
        
        # Update card_watchlist tracker
        cursor.execute("""
            UPDATE data_change_tracker 
            SET last_insert = (SELECT COALESCE(MAX(created_at), CURRENT_TIMESTAMP) FROM card_watchlist),
                insert_count = (SELECT COUNT(*) FROM card_watchlist)
            WHERE table_name = 'card_watchlist'
        """)
        
        conn.commit()
        print("✅ Tracker reset to match real data")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Error resetting tracker: {e}")
    
    conn.close()

def test_individual_trigger(table_name):
    """Test if a trigger works correctly by simulating an insert"""
    conn = get_db_connection()
    if not conn:
        return
    
    cursor = conn.cursor()
    
    print(f"\n🧪 Testing {table_name} trigger...")
    
    # Get current tracker state
    cursor.execute("""
        SELECT last_insert, insert_count 
        FROM data_change_tracker 
        WHERE table_name = %s
    """, [table_name])
    
    before = cursor.fetchone()
    print(f"Before: {before}")
    
    try:
        # Try to simulate a small change to test trigger
        if table_name == 'watchlist':
            # Insert and immediately delete a test record
            cursor.execute("""
                INSERT INTO watchlist (keyword, field_type, severity, description)
                VALUES ('trigger-test', 'domain', 'low', 'Test trigger')
                RETURNING id
            """)
            test_id = cursor.fetchone()[0]
            
            # Check tracker
            cursor.execute("""
                SELECT last_insert, insert_count 
                FROM data_change_tracker 
                WHERE table_name = %s
            """, [table_name])
            after = cursor.fetchone()
            print(f"After insert: {after}")
            
            # Clean up
            cursor.execute("DELETE FROM watchlist WHERE id = %s", [test_id])
            
        conn.commit()
        print(f"✅ {table_name} trigger appears to be working")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ {table_name} trigger test failed: {e}")
    
    conn.close()

if __name__ == "__main__":
    print("🔍 Data Change Tracker Debugger")
    print("================================")
    
    while True:
        print("\nOptions:")
        print("1. Check tracker status")
        print("2. Reset tracker to real data")
        print("3. Test watchlist trigger")
        print("4. Exit")
        
        choice = input("\nSelect option (1-4): ").strip()
        
        if choice == '1':
            debug_tracker_status()
        elif choice == '2':
            reset_tracker_to_real_data()
        elif choice == '3':
            test_individual_trigger('watchlist')
        elif choice == '4':
            break
        else:
            print("Invalid option")