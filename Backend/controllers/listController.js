const List = require('../models/List');
const Agent = require('../models/Agent');
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
    const distributedRecords = distributeRecords(records, agents, req.user._id);

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

    let query = {};
    if (uploadBatch) query.uploadBatch = uploadBatch;
    if (agentId) query.agent = agentId;

    const lists = await List.find(query)
      .populate('agent', 'name email mobileNumber')
      .populate('uploadedBy', 'email')
      .sort({ createdAt: -1 });

    // Group by agent
    //Here we are reorganizing the existing data for the frontend to display it in a more readable format
    const groupedByAgent = lists.reduce((acc, list) => {
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
    const batches = await List.distinct('uploadBatch');
    
    const batchDetails = await Promise.all(
      batches.map(async (batch) => {
        const count = await List.countDocuments({ uploadBatch: batch });
        const firstRecord = await List.findOne({ uploadBatch: batch })
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

// Helper function to distribute records among agents
const distributeRecords = (records, agents, uploadedBy) => {
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

module.exports = {
  uploadList,
  getLists,
  getUploadBatches,
  getMyTasks
};

