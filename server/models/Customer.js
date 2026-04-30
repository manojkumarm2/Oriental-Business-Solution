const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    spouse: { type: String, default: '' },
    mobile: { type: String, required: true },
    email: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    invoiceDate: { type: String, default: '' },
    filingDate: { type: String, default: '' },
    draftSentDate: { type: String, default: '' },
    invoiceNo: { type: String, default: '' },
    invoiceAmount: { type: String, default: '' },
    paymentReceived: { type: String, default: '' },
    dob: { type: String, default: '' },
    workStatus: { type: String, default: '' },
    dueDate: { type: String, default: '' },
    updatedBy: { type: String, default: '' },
    latestComment: { type: String, default: '' },
    status: { type: String, default: 'Pending' },
    familyDetails: { type: String, default: '' },
    history: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Customer', CustomerSchema);
