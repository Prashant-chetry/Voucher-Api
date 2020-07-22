const { Schema, model } = require('mongoose');
const usageActivitySchema = new Schema(
  {
    // use: {
    //   type: String,
    //   trim: true,
    //   maxlength: 20,
    // },
    amount: {
      type: Number,
      trim: true,
    },
  },
  { timestamps: true }
);
const voucherSchema = new Schema(
  {
    code: {
      type: String,
      maxlength: 13,
      minlength: 10,
      index: true,
      required: true,
      trim: true,
    },
    pin: {
      type: String,
      required: true,
      trim: true,
    },
    redeemAmount: {
      type: Number,
      maxlength: 10,
      trim: true,
    },
    email: {
      type: String,
      min: 4,
      max: 100,
      index: true,
      trim: true,
      required: true,
    },
    status: {
      type: String,
      enum: ['redeemed', 'active', 'partially redeemed'],
    },
    activity: {
      type: [usageActivitySchema],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'users',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'users',
    },
    expiresAt: {
      type: Date,
      default: new Date(new Date().setDate(new Date().getDate() + 1)),
    },
  },
  { timestamps: true }
);

const Vouchers = model('vouchers', voucherSchema);
module.exports.default = Vouchers;
