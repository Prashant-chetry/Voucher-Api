const crypto = require('crypto');
const { default: HttpError } = require('../../common/HttpError');
const { default: Vouchers } = require('../../db/vouchers/collection');
const bcrypt = require('bcrypt');
const Joi = require('@hapi/joi');

class VoucherController {
  async generateVoucher(req, res, next) {
    const user = req.user;
    const { email, amount } = req.body;
    if (!user._id) {
      return res.status(401).json({ success: false, message: 'user not authorized' });
    }
    const { error } = Joi.object({
      email: Joi.string().email().required(),
      amount: Joi.number().required().less(10000000),
    }).validate({ email, amount });
    if (error) {
      return res.status(400).json({ success: false, message: 'error', error });
    }
    try {
      const pin = Math.random().toString().substring(2).slice(0, 4);
      const pinEncrypt = await bcrypt.hash(pin, 10),
        code = crypto.randomBytes(5).toString('hex');
      console.log(code, code.length);
      const doc = await new Vouchers({
        pin: pinEncrypt,
        code: `VCD${code}`,
        createdBy: user._id,
        email,
        status: 'active',
        redeemAmount: amount,
      }).save();
      return res.status(200).json({
        success: true,
        message: 'voucher created successfully',
        data: {
          code: doc.code,
          status: doc.status,
          email,
          pin,
          amount,
        },
      });
    } catch (error) {
      console.log(error);
      return next(new HttpError());
    }
  }
  async redeemVoucher(req, res, next) {
    const { email, pin, redeemAmount } = req.body;
    const { error } = Joi.object({
      email: Joi.string().email().required(),
      pin: Joi.string().required().regex(/^\d+$/).length(4),
      redeemAmount: Joi.number().required(),
    }).validate({ email, pin, redeemAmount });
    if (error) {
      return res.status(400).json({ success: false, message: 'error', error });
    }
    try {
      const doc = await Vouchers.findOne({ email, redeemAmount: { $lte: redeemAmount } }).exec();
      if (!doc) return res.status(404).json({ success: false, message: 'voucher not found' });
      const match = await bcrypt.compare(pin, doc.pin || '');
      if (!match) return res.status(400).json({ success: false, message: 'invalid pin' });
      const curRedeemAmount = doc.redeemAmount - redeemAmount;
      doc.set({ redeemAmount: curRedeemAmount, status: !curRedeemAmount ? 'redeemed' : 'partially redeemed' });
      doc.activity.push({ amount: redeemAmount });
      await doc.save();
      return res.status(200).json({ success: true, message: 'redeemed success', data: { redeem: doc.redeemAmount, voucher: doc } });
    } catch (error) {
      return next(new HttpError());
    }
  }
  async vouchersInfo(req, res, next) {
    const user = req.user;
    if (!user._id) {
      return res.status(401).json({ success: false, message: 'user not authorized' });
    }
    const {
      date: { to, from },
      status,
      email,
    } = req.body || {};
    const { error } = Joi.object({
      from: Joi.date().required(),
      to: Joi.date().greater(Joi.ref('from')).required(),
      email: Joi.string().email().required(),
      status: Joi.string().valid('redeemed', 'active', 'partially redeemed').required(),
    }).validate({ to, from, email, status });
    try {
      const docs = await Vouchers.find({ createdAt: { $gte: new Date(from), $lte: new Date(to) }, status, email }).lean();
      if (!docs.length) {
        return res.status(404).json({ success: false, message: 'voucher not found' });
      }
      return res.status(200).json({ success: true, message: 'voucher found', data: docs });
    } catch (error) {
      return next(new HttpError());
    }
  }
}

module.exports.default = VoucherController;
