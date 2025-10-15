const mongoose = require('mongoose');
require('dotenv').config();

// Import List model
const List = require('./models/List');

const cleanupDuplicates = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    console.log('\n🧹 Starting database cleanup...\n');

    // Get all lists from database, sorted by creation date (keep oldest)
    const allLists = await List.find({}).sort({ createdAt: 1 });
    console.log(`📊 Total records in database: ${allLists.length}\n`);

    const seenFirstNames = new Map();
    const seenPhones = new Map();
    const seenNotes = new Map();
    const duplicateIds = [];

    for (const list of allLists) {
      const firstName = list.firstName.trim().toLowerCase();
      const phone = list.phone.trim().toLowerCase();
      const notes = list.notes.trim().toLowerCase();

      let isDuplicate = false;
      let reason = [];

      // Check firstName
      if (seenFirstNames.has(firstName)) {
        isDuplicate = true;
        reason.push(`firstName: ${list.firstName}`);
      }

      // Check phone
      if (seenPhones.has(phone)) {
        isDuplicate = true;
        reason.push(`phone: ${list.phone}`);
      }

      // Check notes
      if (notes && seenNotes.has(notes)) {
        isDuplicate = true;
        reason.push(`notes: ${list.notes}`);
      }

      if (isDuplicate) {
        duplicateIds.push(list._id);
        console.log(`❌ Duplicate found [${reason.join(', ')}] - ID: ${list._id}`);
      } else {
        // Track this record as the first occurrence
        seenFirstNames.set(firstName, list._id);
        seenPhones.set(phone, list._id);
        if (notes) {
          seenNotes.set(notes, list._id);
        }
      }
    }

    // Delete all duplicate records
    if (duplicateIds.length > 0) {
      console.log(`\n🗑️  Deleting ${duplicateIds.length} duplicate records...\n`);
      await List.deleteMany({ _id: { $in: duplicateIds } });
      console.log(`✅ Successfully removed ${duplicateIds.length} duplicate records\n`);
    } else {
      console.log('\n✅ No duplicates found! Database is clean.\n');
    }

    const remainingCount = await List.countDocuments();
    console.log(`📊 Final count: ${remainingCount} unique records remaining\n`);

    // Close connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
};

// Run cleanup
cleanupDuplicates();

