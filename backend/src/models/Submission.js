const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  producerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  productionData: {
    productionDate: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    location: {
      type: String,
      required: true
    }
  },
  price: {
    type: String,
    required: true
  },
  tokenId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Submission', submissionSchema);
