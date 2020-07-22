const jwt = require('jsonwebtoken');
const { default: Users } = require('../db/users/collection');
const Joi = require('@hapi/joi');
const { default: HttpError } = require('../common/HttpError');
const { isValidObjectId } = require('mongoose');

const authMiddleware = async function (req, res, next) {
  let authKey = req.headers.authentication;
  const { error } = Joi.string().required().validate(authKey);
  if (error) {
    return res.status(401).json({ success: false, message: 'not valid token', error });
  }
  authKey = (authKey || {}).replace('Bearer ', '');

  if (!authKey) return res.status(401).json({ success: false, message: 'authentication failed' });
  try {
    const token = jwt.verify(authKey.toString(), process.env.jwtSecret || '');
    if (!token || !isValidObjectId((token || {}).sub) || (token || {}).iss !== process.env.ISS) {
      return res.status(401).json({ success: false, message: 'authentication failed' });
    }
    console.debug({ 'tokens.token': authKey, 'tokens.createdAt': new Date(token.iat) });
    const user = await Users.findOne({ _id: (token || {}).sub, 'tokens.token': authKey }).exec();
    if (!user) return res.status(401).json({ success: false, message: 'no user found - try registering' });
    const tokens = (user || {}).tokens;
    const expiresIn = ((tokens || {}).pop() || {}).expiresIn;
    if (new Date().getTime() > new Date(expiresIn || '').getTime()) return res.status(401).json({ success: false, message: 'token expired' });
    req.user = user;
    req.authInfo = 'Bearer ' + authKey;
    return next();
  } catch (error) {
    console.log(error);
    return next(new HttpError());
  }
};
module.exports.default = authMiddleware;
