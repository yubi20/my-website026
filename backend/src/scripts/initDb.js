import { initDatabaseSchema, checkDbConnection } from '../config/db.js';

const run = async () => {
  console.log('🔄 Initializing Banana Game MySQL Database...');
  try {
    await initDatabaseSchema();
    await checkDbConnection();
    console.log('🎉 Banana Game Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
};

run();
