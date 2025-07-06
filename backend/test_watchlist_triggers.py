#!/usr/bin/env python3
"""
Test script for new watchlist triggers functionality.
Tests that adding new watchlist items triggers appropriate checks.
"""

import requests
import time
import json
from datetime import datetime

BASE_URL = "http://localhost:5001"

def test_watchlist_triggers():
    """Test that new watchlist items trigger appropriate checks"""
    print("🧪 Testing Watchlist Triggers")
    print("=" * 50)
    
    try:
        # 1. Get initial status
        print("\n1. Getting initial status...")
        response = requests.get(f"{BASE_URL}/api/maintenance/data-change-status")
        if response.status_code == 200:
            initial_status = response.json()
            print(f"✓ Initial status retrieved")
            initial_watchlist_check = initial_status['last_checks']['watchlist_check']
            initial_card_watchlist_check = initial_status['last_checks']['card_watchlist_check']
            print(f"  - Credential watchlist check: {initial_watchlist_check}")
            print(f"  - BIN watchlist check: {initial_card_watchlist_check}")
        else:
            print(f"❌ Failed to get initial status: {response.status_code}")
            return
        
        # 2. Add a new credential watchlist item
        print("\n2. Adding new credential watchlist item...")
        new_watchlist_item = {
            "keyword": "test-trigger-domain.com",
            "field_type": "domain",
            "severity": "medium",
            "description": "Test trigger for automatic watchlist checking"
        }
        
        response = requests.post(f"{BASE_URL}/api/watchlist", json=new_watchlist_item)
        if response.status_code == 201:
            watchlist_item = response.json()
            print(f"✓ Added credential watchlist item with ID: {watchlist_item['id']}")
        else:
            print(f"❌ Failed to add credential watchlist item: {response.status_code}")
            print(f"Response: {response.text}")
            return
        
        # 3. Wait for trigger to process
        print("\n3. Waiting for triggers to process...")
        time.sleep(2)
        
        # 4. Check if watchlist check was triggered
        print("\n4. Checking if credential watchlist was triggered...")
        response = requests.get(f"{BASE_URL}/api/maintenance/data-change-status")
        if response.status_code == 200:
            new_status = response.json()
            new_watchlist_check = new_status['last_checks']['watchlist_check']
            
            if new_watchlist_check != initial_watchlist_check:
                print(f"✅ SUCCESS: Credential watchlist check was triggered!")
                print(f"  - Before: {initial_watchlist_check}")
                print(f"  - After:  {new_watchlist_check}")
            else:
                print(f"⚠️  WARNING: Credential watchlist check timestamp unchanged")
                print(f"  - Timestamp: {new_watchlist_check}")
        else:
            print(f"❌ Failed to check status: {response.status_code}")
        
        # 5. Add a new BIN watchlist item  
        print("\n5. Adding new BIN watchlist item...")
        new_bin_item = {
            "bin_number": "999999",
            "severity": "high",
            "description": "Test trigger for BIN watchlist checking"
        }
        
        response = requests.post(f"{BASE_URL}/api/watchlist/bins", json=new_bin_item)
        if response.status_code == 201:
            bin_item = response.json()
            print(f"✓ Added BIN watchlist item with ID: {bin_item['id']}")
        else:
            print(f"❌ Failed to add BIN watchlist item: {response.status_code}")
            print(f"Response: {response.text}")
            # Continue with cleanup even if this fails
        
        # 6. Wait for trigger to process
        print("\n6. Waiting for BIN triggers to process...")
        time.sleep(2)
        
        # 7. Check if BIN watchlist check was triggered
        print("\n7. Checking if BIN watchlist was triggered...")
        response = requests.get(f"{BASE_URL}/api/maintenance/data-change-status")
        if response.status_code == 200:
            final_status = response.json()
            final_card_watchlist_check = final_status['last_checks']['card_watchlist_check']
            
            if final_card_watchlist_check != initial_card_watchlist_check:
                print(f"✅ SUCCESS: BIN watchlist check was triggered!")
                print(f"  - Before: {initial_card_watchlist_check}")
                print(f"  - After:  {final_card_watchlist_check}")
            else:
                print(f"⚠️  WARNING: BIN watchlist check timestamp unchanged")
                print(f"  - Timestamp: {final_card_watchlist_check}")
        else:
            print(f"❌ Failed to check final status: {response.status_code}")
        
        # 8. Show tracking data
        print("\n8. Final tracking data:")
        if 'tracking_data' in final_status:
            for item in final_status['tracking_data']:
                print(f"  - {item['table_name']}: {item['insert_count']} inserts, last: {item['last_insert']}")
        
        # 9. Cleanup - delete test items
        print("\n9. Cleaning up test data...")
        try:
            # Delete credential watchlist item
            response = requests.delete(f"{BASE_URL}/api/watchlist/{watchlist_item['id']}")
            if response.status_code == 200:
                print(f"✓ Deleted credential watchlist item {watchlist_item['id']}")
            else:
                print(f"⚠️  Could not delete credential watchlist item: {response.status_code}")
            
            # Delete BIN watchlist item if it was created
            if 'bin_item' in locals():
                response = requests.delete(f"{BASE_URL}/api/watchlist/bins/{bin_item['id']}")
                if response.status_code == 200:
                    print(f"✓ Deleted BIN watchlist item {bin_item['id']}")
                else:
                    print(f"⚠️  Could not delete BIN watchlist item: {response.status_code}")
                    
        except Exception as e:
            print(f"⚠️  Cleanup error: {e}")
        
        print("\n🎉 Watchlist trigger test completed!")
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_watchlist_triggers()