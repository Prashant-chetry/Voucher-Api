const { Router } = require('express');
const { default: VoucherController } = require('../controllers/voucher/index');
const { default: auth } = require('../middleware/auth');
const voucherRouter = Router();
voucherRouter.get('/list', auth, new VoucherController().vouchersInfo);
voucherRouter.post('/generate', auth, new VoucherController().generateVoucher);
voucherRouter.post('/redeem', new VoucherController().redeemVoucher);

module.exports.default = voucherRouter;
