require('dotenv').config();
const { sequelize, Review } = require('./models');

async function syncReviewTable() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('✓ Connected to database');
        
        console.log('Dropping and recreating Review table...');
        await Review.sync({ force: true });
        console.log('✓ Review table synced successfully!');
        
        // Verify table exists
        const [results] = await sequelize.query("SHOW TABLES LIKE 'Reviews'");
        if (results.length > 0) {
            console.log('✓ Review table confirmed in database');
            
            // Show table structure
            const [structure] = await sequelize.query("DESCRIBE Reviews");
            console.log('\nReview table structure:');
            structure.forEach(col => {
                console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''}`);
            });
        }
        
        await sequelize.close();
        console.log('\n✓ Done!');
        process.exit(0);
    } catch (error) {
        console.error('✗ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

syncReviewTable();
