import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

export async function debugSQLite() {
  console.log('🔍 [DEBUG] Starting SQLite diagnostics...');

  const platform = Capacitor.getPlatform();
  console.log('🔍 [DEBUG] Platform:', platform);

  try {
    // Test 1: Check if SQLite is available
    console.log('🔍 [DEBUG] Test 1: Checking SQLite availability...');
    if (!CapacitorSQLite) {
      console.error('❌ [DEBUG] CapacitorSQLite is not available!');
      return false;
    }
    console.log('✅ [DEBUG] CapacitorSQLite is available');

    // Test 2: Initialize web store (for web platform)
    if (platform === 'web') {
      console.log('🔍 [DEBUG] Test 2: Initializing web store...');
      try {
        await CapacitorSQLite.initWebStore();
        console.log('✅ [DEBUG] Web store initialized');
      } catch (error) {
        console.error('❌ [DEBUG] Web store initialization failed:', error);
        return false;
      }
    }

    // Test 3: Create connection
    console.log('🔍 [DEBUG] Test 3: Creating SQLite connection...');
    const sqlite = new SQLiteConnection(CapacitorSQLite);
    const db = await sqlite.createConnection(
      'test_debug_db',
      false,
      'no-encryption',
      1,
      false
    );
    console.log('✅ [DEBUG] Connection created');

    // Test 4: Open database
    console.log('🔍 [DEBUG] Test 4: Opening database...');
    await db.open();
    console.log('✅ [DEBUG] Database opened');

    // Test 5: Create test table
    console.log('🔍 [DEBUG] Test 5: Creating test table...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS test_users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL
      );
    `);
    console.log('✅ [DEBUG] Test table created');

    // Test 6: Insert test data
    console.log('🔍 [DEBUG] Test 6: Inserting test data...');
    const testId = 'test-' + Date.now();
    await db.run(
      'INSERT INTO test_users (id, name, email) VALUES (?, ?, ?)',
      [testId, 'Test User', 'test@example.com']
    );
    console.log('✅ [DEBUG] Test data inserted');

    // Test 7: Query test data
    console.log('🔍 [DEBUG] Test 7: Querying test data...');
    const result = await db.query('SELECT * FROM test_users WHERE id = ?', [testId]);
    console.log('✅ [DEBUG] Query result:', result);

    if (result.values && result.values.length > 0) {
      console.log('✅ [DEBUG] Data retrieved:', result.values[0]);
    }

    // Test 8: Clean up
    console.log('🔍 [DEBUG] Test 8: Cleaning up...');
    await db.execute('DROP TABLE test_users;');
    await db.close();
    console.log('✅ [DEBUG] Cleanup completed');

    console.log('🎉 [DEBUG] All SQLite tests passed!');
    return true;

  } catch (error) {
    console.error('❌ [DEBUG] SQLite test failed:', error);
    console.error('❌ [DEBUG] Error details:', JSON.stringify(error, null, 2));
    return false;
  }
}
