const List = require('../models/List');
const Agent = require('../models/Agent');
const SubAgent = require('../models/SubAgent');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

/**
 * Upload CSV/Excel file and distribute lists to agents
 * @route POST /api/lists/upload
 * @access Private
 */
const uploadList = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();

    // Validate file type
    if (!['.csv', '.xlsx', '.xls'].includes(fileExtension)) {
      fs.unlinkSync(filePath); // Delete uploaded file
      return res.status(400).json({
        success: false,
        message: 'Invalid file format. Only CSV, XLSX, and XLS files are allowed'
      });
    }

    let records = [];

    // Parse CSV file
    if (fileExtension === '.csv') {
      records = await parseCSV(filePath);
    } 
    // Parse Excel file
    else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      records = await parseExcel(filePath);
    }

    // Validate records
    if (records.length === 0) {
      fs.unlinkSync(filePath); // Delete uploaded file
      return res.status(400).json({
        success: false,
        message: 'File is empty or contains no valid records'
      });
    }

    // Validate record structure
    const validationError = validateRecords(records);
    if (validationError) {
      fs.unlinkSync(filePath); // Delete uploaded file
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    // Remove duplicate records within the file
    const originalCount = records.length;
    console.log('📊 [ADMIN UPLOAD] Before deduplication:', originalCount, 'records');
    records = removeDuplicates(records);
    let duplicatesRemoved = originalCount - records.length;
    console.log('✅ [ADMIN UPLOAD] After file deduplication:', records.length, 'unique records');
    console.log('🗑️ [ADMIN UPLOAD] Duplicates within file removed:', duplicatesRemoved);

    // Remove records that already exist in the database
    const beforeDbCheck = records.length;
    records = await removeDatabaseDuplicates(records);
    const dbDuplicatesRemoved = beforeDbCheck - records.length;
    duplicatesRemoved += dbDuplicatesRemoved;
    console.log('✅ [ADMIN UPLOAD] After database check:', records.length, 'new unique records');
    console.log('🗑️ [ADMIN UPLOAD] Duplicates in database removed:', dbDuplicatesRemoved);
    console.log('📦 [ADMIN UPLOAD] Total duplicates removed:', duplicatesRemoved);

    // Check if any records remain after deduplication
    if (records.length === 0) {
      fs.unlinkSync(filePath); // Delete uploaded file
      return res.status(400).json({
        success: false,
        message: 'All records in the file already exist in the database. No new records to add.'
      });
    }

    // Get all active agents
    const agents = await Agent.find({ isActive: true }).select('_id');

    if (agents.length === 0) {
      fs.unlinkSync(filePath); // Delete uploaded file
      return res.status(400).json({
        success: false,
        message: 'No active agents found. Please create agents first.'
      });
    }

    // Distribute records among agents
    const distributedRecords = distributeRecords(records, agents, req.user._id, 'User');

    // Save all records to database
    const savedRecords = await List.insertMany(distributedRecords);

    // Delete uploaded file after processing
    fs.unlinkSync(filePath);

    // Get distribution summary
    const distributionSummary = await getDistributionSummary(distributedRecords[0].uploadBatch);

    res.status(201).json({
      success: true,
      message: 'File uploaded and distributed successfully',
      data: {
        totalRecords: savedRecords.length,
        agentsCount: agents.length,
        duplicatesRemoved,
        distributionSummary
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    console.error('Error stack:', error.stack);
    // Clean up uploaded file in case of error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while uploading file'
    });
  }
};

/**
 * Get distributed lists for all agents
 * @route GET /api/lists
 * @access Private
 */
const getLists = async (req, res) => {
  try {
    const { uploadBatch, agentId } = req.query;

    // Admin can only see lists uploaded by admin (User model)
    let query = { uploadedByModel: 'User' };
    if (uploadBatch) query.uploadBatch = uploadBatch;
    if (agentId) query.agent = agentId;

    const lists = await List.find(query)
      .populate('agent', 'name email mobileNumber')
      .populate('uploadedBy', 'email')
      .sort({ createdAt: -1 });

    // Group by agent
    //Here we are reorganizing the existing data for the frontend to display it in a more readable format
    const groupedByAgent = lists.reduce((acc, list) => {
      // Skip if agent is not populated (shouldn't happen with the query filter, but just in case)
      if (!list.agent) return acc;
      
      const agentId = list.agent._id.toString();
      if (!acc[agentId]) {
        acc[agentId] = {
          agent: list.agent,
          lists: []
        };
      }
      acc[agentId].lists.push({
        _id: list._id,
        firstName: list.firstName,
        phone: list.phone,
        notes: list.notes,
        uploadBatch: list.uploadBatch,
        createdAt: list.createdAt
      });
      return acc;
    }, {});

    res.json({
      success: true,
      count: lists.length,
      data: Object.values(groupedByAgent)
    });
  } catch (error) {
    console.error('Get lists error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching lists'
    });
  }
};

/**
 * Get unique upload batches
 * @route GET /api/lists/batches
 * @access Private
 */
const getUploadBatches = async (req, res) => {
  try {
    // Admin can only see batches uploaded by admin (User model)
    const batches = await List.distinct('uploadBatch', { uploadedByModel: 'User' });
    
    const batchDetails = await Promise.all(
      batches.map(async (batch) => {
        const count = await List.countDocuments({ 
          uploadBatch: batch,
          uploadedByModel: 'User'
        });
        const firstRecord = await List.findOne({ 
          uploadBatch: batch,
          uploadedByModel: 'User'
        })
          .populate('uploadedBy', 'email')
          .sort({ createdAt: 1 });
        
        return {
          batchId: batch,
          recordCount: count,
          uploadedBy: firstRecord?.uploadedBy?.email || 'Unknown',
          uploadedAt: firstRecord?.createdAt
        };
      })
    );

    res.json({
      success: true,
      data: batchDetails.sort((a, b) => b.uploadedAt - a.uploadedAt)
    });
  } catch (error) {
    console.error('Get batches error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching batches'
    });
  }
};

/**
 * Get agent's assigned tasks (for agent dashboard)
 * @route GET /api/lists/my-tasks
 * @access Private (Agent only)
 */
const getMyTasks = async (req, res) => {
  try {
    // This endpoint is for agents only
    if (req.userType !== 'agent') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This endpoint is for agents only.'
      });
    }

    const agentId = req.user._id;

    // Get all tasks assigned to this agent
    const tasks = await List.find({ agent: agentId })
      .populate('uploadedBy', 'email')
      .sort({ createdAt: -1 });

    // Group by upload batch for better organization
    const groupedTasks = tasks.reduce((acc, task) => {
      const batchId = task.uploadBatch;
      if (!acc[batchId]) {
        acc[batchId] = {
          batchId,
          uploadedBy: task.uploadedBy?.email || 'Unknown',
          uploadedAt: task.createdAt,
          tasks: []
        };
      }
      acc[batchId].tasks.push({
        _id: task._id,
        firstName: task.firstName,
        phone: task.phone,
        notes: task.notes,
        createdAt: task.createdAt
      });
      return acc;
    }, {});

    res.json({
      success: true,
      count: tasks.length,
      data: Object.values(groupedTasks)
    });
  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching tasks'
    });
  }
};

// Helper function to parse CSV file
const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const records = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        records.push({
          firstName: data.FirstName || data.firstName || data.first_name || '',
          phone: data.Phone || data.phone || '',
          notes: data.Notes || data.notes || ''
        });
      })
      .on('end', () => resolve(records))
      .on('error', (error) => reject(error));
  });
};

// Helper function to parse Excel file
const parseExcel = (filePath) => {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);

    const records = jsonData.map(row => ({
      firstName: row.FirstName || row.firstName || row.first_name || '',
      phone: String(row.Phone || row.phone || ''),
      notes: row.Notes || row.notes || ''
    }));

    return records;
  } catch (error) {
    throw new Error('Error parsing Excel file');
  }
};

// Helper function to validate records
const validateRecords = (records) => {
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    
    if (!record.firstName || !record.firstName.trim()) {
      return `Row ${i + 1}: FirstName is required`;
    }
    
    if (!record.phone || !record.phone.trim()) {
      return `Row ${i + 1}: Phone is required`;
    }
  }
  return null;
};

// Helper function to remove duplicate records
const removeDuplicates = (records) => {
  const uniqueRecords = [];
  const seenFirstNames = new Set();
  const seenPhones = new Set();
  const seenNotes = new Set();

  for (const record of records) {
    // Normalize values for comparison (trim and lowercase)
    const firstName = record.firstName.trim().toLowerCase();
    const phone = record.phone.trim().toLowerCase();
    const notes = record.notes.trim().toLowerCase();
    
    // Check if any of the fields have been seen before
    const isDuplicate = 
      seenFirstNames.has(firstName) || 
      seenPhones.has(phone) || 
      (notes && seenNotes.has(notes));
    
    if (!isDuplicate) {
      // Add to unique records using original (non-lowercase) values
      uniqueRecords.push(record);
      
      // Track seen values
      seenFirstNames.add(firstName);
      seenPhones.add(phone);
      if (notes) {
        seenNotes.add(notes);
      }
    }
  }

  return uniqueRecords;
};

// Helper function to remove records that already exist in the database
const removeDatabaseDuplicates = async (records) => {
  const uniqueRecords = [];

  for (const record of records) {
    // Normalize values for comparison
    const firstName = record.firstName.trim();
    const phone = record.phone.trim();
    const notes = record.notes.trim();

    // Escape special regex characters
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Check if any record exists in database with matching firstName, phone, or notes
    const existingRecord = await List.findOne({
      $or: [
        { firstName: { $regex: new RegExp(`^${escapeRegex(firstName)}$`, 'i') } },
        { phone: { $regex: new RegExp(`^${escapeRegex(phone)}$`, 'i') } },
        ...(notes ? [{ notes: { $regex: new RegExp(`^${escapeRegex(notes)}$`, 'i') } }] : [])
      ]
    });

    // Only add if no duplicate found in database
    if (!existingRecord) {
      uniqueRecords.push(record);
    } else {
      console.log(`⚠️ Skipping duplicate: ${firstName} (${phone}) - already exists in database`);
    }
  }

  return uniqueRecords;
};

// Helper function to distribute records among agents
const distributeRecords = (records, agents, uploadedBy, uploadedByModel) => {
  const uploadBatch = Date.now().toString();
  const agentCount = agents.length;
  const recordsPerAgent = Math.floor(records.length / agentCount);
  const remainder = records.length % agentCount;

  const distributedRecords = [];
  let recordIndex = 0;

  for (let i = 0; i < agentCount; i++) {
    // Calculate how many records this agent should get
    const recordsForThisAgent = recordsPerAgent + (i < remainder ? 1 : 0);

    for (let j = 0; j < recordsForThisAgent; j++) {
      if (recordIndex < records.length) {
        distributedRecords.push({
          firstName: records[recordIndex].firstName.trim(),
          phone: records[recordIndex].phone.trim(),
          notes: records[recordIndex].notes.trim(),
          agent: agents[i]._id,
          uploadedBy,
          uploadedByModel,
          uploadBatch
        });
        recordIndex++;
      }
    }
  }

  return distributedRecords;
};

// Helper function to get distribution summary
const getDistributionSummary = async (uploadBatch) => {
  const summary = await List.aggregate([
    { $match: { uploadBatch } },
    {
      $group: {
        _id: '$agent',
        count: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'agents',
        localField: '_id',
        foreignField: '_id',
        as: 'agentInfo'
      }
    },
    {
      $unwind: '$agentInfo'
    },
    {
      $project: {
        agentName: '$agentInfo.name',
        agentEmail: '$agentInfo.email',
        recordCount: '$count'
      }
    }
  ]);

  return summary;
};

/**
 * Upload CSV/Excel file and distribute lists to sub-agents (Agent upload)
 * @route POST /api/lists/agent-upload
 * @access Private (Agent only)
 */
const agentUploadList = async (req, res) => {
  try {
    // This endpoint is for agents only
    if (req.userType !== 'agent') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This endpoint is for agents only.'
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();

    // Validate file type
    if (!['.csv', '.xlsx', '.xls'].includes(fileExtension)) {
      fs.unlinkSync(filePath); // Delete uploaded file
      return res.status(400).json({
        success: false,
        message: 'Invalid file format. Only CSV, XLSX, and XLS files are allowed'
      });
    }

    let records = [];

    // Parse CSV file
    if (fileExtension === '.csv') {
      records = await parseCSV(filePath);
    } 
    // Parse Excel file
    else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      records = await parseExcel(filePath);
    }

    // Validate records
    if (records.length === 0) {
      fs.unlinkSync(filePath); // Delete uploaded file
      return res.status(400).json({
        success: false,
        message: 'File is empty or contains no valid records'
      });
    }

    // Validate record structure
    const validationError = validateRecords(records);
    if (validationError) {
      fs.unlinkSync(filePath); // Delete uploaded file
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    // Remove duplicate records within the file
    const originalCount = records.length;
    console.log('📊 [AGENT UPLOAD] Before deduplication:', originalCount, 'records');
    records = removeDuplicates(records);
    let duplicatesRemoved = originalCount - records.length;
    console.log('✅ [AGENT UPLOAD] After file deduplication:', records.length, 'unique records');
    console.log('🗑️ [AGENT UPLOAD] Duplicates within file removed:', duplicatesRemoved);

    // Remove records that already exist in the database
    const beforeDbCheck = records.length;
    records = await removeDatabaseDuplicates(records);
    const dbDuplicatesRemoved = beforeDbCheck - records.length;
    duplicatesRemoved += dbDuplicatesRemoved;
    console.log('✅ [AGENT UPLOAD] After database check:', records.length, 'new unique records');
    console.log('🗑️ [AGENT UPLOAD] Duplicates in database removed:', dbDuplicatesRemoved);
    console.log('📦 [AGENT UPLOAD] Total duplicates removed:', duplicatesRemoved);

    // Check if any records remain after deduplication
    if (records.length === 0) {
      fs.unlinkSync(filePath); // Delete uploaded file
      return res.status(400).json({
        success: false,
        message: 'All records in the file already exist in the database. No new records to add.'
      });
    }

    // Get all active sub-agents for this agent
    const subAgents = await SubAgent.find({ 
      parentAgent: req.user._id, 
      isActive: true 
    }).select('_id');

    if (subAgents.length === 0) {
      fs.unlinkSync(filePath); // Delete uploaded file
      return res.status(400).json({
        success: false,
        message: 'No active sub-agents found. Please create sub-agents first.'
      });
    }

    // Distribute records among sub-agents
    const distributedRecords = distributeRecordsToSubAgents(
      records, 
      subAgents, 
      req.user._id
    );

    // Save all records to database
    const savedRecords = await List.insertMany(distributedRecords);

    // Delete uploaded file after processing
    fs.unlinkSync(filePath);

    // Get distribution summary
    const distributionSummary = await getSubAgentDistributionSummary(
      distributedRecords[0].uploadBatch
    );

    res.status(201).json({
      success: true,
      message: 'File uploaded and distributed successfully',
      data: {
        totalRecords: savedRecords.length,
        subAgentsCount: subAgents.length,
        duplicatesRemoved,
        distributionSummary
      }
    });
  } catch (error) {
    console.error('Agent upload error:', error);
    console.error('Error stack:', error.stack);
    // Clean up uploaded file in case of error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while uploading file'
    });
  }
};

/**
 * Get distributed lists to sub-agents for the logged-in agent
 * @route GET /api/lists/my-uploads
 * @access Private (Agent only)
 */
const getMyUploads = async (req, res) => {
  try {
    // This endpoint is for agents only
    if (req.userType !== 'agent') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This endpoint is for agents only.'
      });
    }

    const { uploadBatch } = req.query;
    const agentId = req.user._id;

    let query = { 
      uploadedBy: agentId,
      uploadedByModel: 'Agent'
    };
    if (uploadBatch) query.uploadBatch = uploadBatch;

    const lists = await List.find(query)
      .populate('subAgent', 'name email mobileNumber')
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    // Group by sub-agent
    const groupedBySubAgent = lists.reduce((acc, list) => {
      const subAgentId = list.subAgent._id.toString();
      if (!acc[subAgentId]) {
        acc[subAgentId] = {
          subAgent: list.subAgent,
          lists: []
        };
      }
      acc[subAgentId].lists.push({
        _id: list._id,
        firstName: list.firstName,
        phone: list.phone,
        notes: list.notes,
        uploadBatch: list.uploadBatch,
        createdAt: list.createdAt
      });
      return acc;
    }, {});

    res.json({
      success: true,
      count: lists.length,
      data: Object.values(groupedBySubAgent)
    });
  } catch (error) {
    console.error('Get my uploads error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching uploads'
    });
  }
};

/**
 * Get unique upload batches for agent uploads
 * @route GET /api/lists/my-batches
 * @access Private (Agent only)
 */
const getMyUploadBatches = async (req, res) => {
  try {
    // This endpoint is for agents only
    if (req.userType !== 'agent') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This endpoint is for agents only.'
      });
    }

    const agentId = req.user._id;

    const batches = await List.distinct('uploadBatch', { 
      uploadedBy: agentId,
      uploadedByModel: 'Agent'
    });
    
    const batchDetails = await Promise.all(
      batches.map(async (batch) => {
        const count = await List.countDocuments({ 
          uploadBatch: batch,
          uploadedBy: agentId,
          uploadedByModel: 'Agent'
        });
        const firstRecord = await List.findOne({ 
          uploadBatch: batch,
          uploadedBy: agentId,
          uploadedByModel: 'Agent'
        })
          .populate('uploadedBy', 'name email')
          .sort({ createdAt: 1 });
        
        return {
          batchId: batch,
          recordCount: count,
          uploadedBy: firstRecord?.uploadedBy?.name || firstRecord?.uploadedBy?.email || 'Unknown',
          uploadedAt: firstRecord?.createdAt
        };
      })
    );

    res.json({
      success: true,
      data: batchDetails.sort((a, b) => b.uploadedAt - a.uploadedAt)
    });
  } catch (error) {
    console.error('Get my batches error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching batches'
    });
  }
};

// Helper function to distribute records among sub-agents
const distributeRecordsToSubAgents = (records, subAgents, uploadedBy) => {
  const uploadBatch = Date.now().toString();
  const subAgentCount = subAgents.length;
  const recordsPerSubAgent = Math.floor(records.length / subAgentCount);
  const remainder = records.length % subAgentCount;

  const distributedRecords = [];
  let recordIndex = 0;

  for (let i = 0; i < subAgentCount; i++) {
    // Calculate how many records this sub-agent should get
    const recordsForThisSubAgent = recordsPerSubAgent + (i < remainder ? 1 : 0);

    for (let j = 0; j < recordsForThisSubAgent; j++) {
      if (recordIndex < records.length) {
        distributedRecords.push({
          firstName: records[recordIndex].firstName.trim(),
          phone: records[recordIndex].phone.trim(),
          notes: records[recordIndex].notes.trim(),
          subAgent: subAgents[i]._id,
          uploadedBy,
          uploadedByModel: 'Agent',
          uploadBatch
        });
        recordIndex++;
      }
    }
  }

  return distributedRecords;
};

// Helper function to get distribution summary for sub-agents
const getSubAgentDistributionSummary = async (uploadBatch) => {
  const summary = await List.aggregate([
    { $match: { uploadBatch } },
    {
      $group: {
        _id: '$subAgent',
        count: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'subagents',
        localField: '_id',
        foreignField: '_id',
        as: 'subAgentInfo'
      }
    },
    {
      $unwind: '$subAgentInfo'
    },
    {
      $project: {
        subAgentName: '$subAgentInfo.name',
        subAgentEmail: '$subAgentInfo.email',
        recordCount: '$count'
      }
    }
  ]);

  return summary;
};

/**
 * Remove duplicate records from database
 * @route DELETE /api/lists/remove-duplicates
 * @access Private (Admin only)
 */
const removeDuplicatesFromDatabase = async (req, res) => {
  try {
    // This endpoint is for admin only
    if (req.userType !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This endpoint is for admin only.'
      });
    }

    console.log('🧹 Starting database cleanup...');

    // Get all lists from database
    const allLists = await List.find({}).sort({ createdAt: 1 });
    console.log(`📊 Total records in database: ${allLists.length}`);

    const seenFirstNames = new Map();
    const seenPhones = new Map();
    const seenNotes = new Map();
    const duplicateIds = [];

    for (const list of allLists) {
      const firstName = list.firstName.trim().toLowerCase();
      const phone = list.phone.trim().toLowerCase();
      const notes = list.notes.trim().toLowerCase();

      let isDuplicate = false;

      // Check firstName
      if (seenFirstNames.has(firstName)) {
        isDuplicate = true;
        console.log(`❌ Duplicate firstName found: ${list.firstName} (ID: ${list._id})`);
      }

      // Check phone
      if (seenPhones.has(phone)) {
        isDuplicate = true;
        console.log(`❌ Duplicate phone found: ${list.phone} (ID: ${list._id})`);
      }

      // Check notes
      if (notes && seenNotes.has(notes)) {
        isDuplicate = true;
        console.log(`❌ Duplicate notes found: ${list.notes} (ID: ${list._id})`);
      }

      if (isDuplicate) {
        duplicateIds.push(list._id);
      } else {
        // Track this record
        seenFirstNames.set(firstName, list._id);
        seenPhones.set(phone, list._id);
        if (notes) {
          seenNotes.set(notes, list._id);
        }
      }
    }

    // Delete all duplicate records
    if (duplicateIds.length > 0) {
      await List.deleteMany({ _id: { $in: duplicateIds } });
      console.log(`✅ Removed ${duplicateIds.length} duplicate records`);
    }

    const remainingCount = await List.countDocuments();
    console.log(`📊 Remaining unique records: ${remainingCount}`);

    res.json({
      success: true,
      message: 'Database cleanup completed successfully',
      data: {
        totalRecords: allLists.length,
        duplicatesRemoved: duplicateIds.length,
        remainingRecords: remainingCount
      }
    });
  } catch (error) {
    console.error('Remove duplicates error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing duplicates'
    });
  }
};

module.exports = {
  uploadList,
  getLists,
  getUploadBatches,
  getMyTasks,
  agentUploadList,
  getMyUploads,
  getMyUploadBatches,
  removeDuplicatesFromDatabase
};

