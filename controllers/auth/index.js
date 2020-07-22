const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Joi = require('@hapi/joi');
const Users = require('../../db/users/collection').default;
const { default: HttpError } = require('../../common/HttpError');

class AuthenticationController {
  hashPassword(password, round, cb) {
    bcrypt.hash(password, round, function (err, encrypted) {
      cb(err, encrypted);
    });
  }
  async comparePassword(password, hashedPassword) {
    return;
  }
  async register(req, res, next) {
    const { email, password, secondPassword } = req.body;
    if (password !== secondPassword) {
      return next(new HttpError(false, 'Bad Request', 400));
    }
    const { error } = Joi.object({
      email: Joi.string().required().email(),
      password: Joi.string().required().max(100).min(6),
      secondPassword: Joi.ref('password'),
    }).validate({ email, password, secondPassword });
    if (error) {
      return res.status(400).json({ success: false, message: 'Bad request', error });
    }
    const user = await Users.findOne({ username: email }, { username: 1 }).lean();
    console.log(user);
    if (user) return res.status(403).json({ success: false, message: 'user already exists' });
    try {
      await new Users({
        username: email,
        password,
      }).save();
      return res.status(200).json({ success: true, message: 'user created successfully' });
    } catch (error) {
      console.debug(error);
      return next(new HttpError());
    }
  }
  async logIn(req, res, next) {
    const { email, password, secondPassword } = req.body;
    if (password !== secondPassword) {
      return next(new HttpError(false, 'Bad Request', 400));
    }
    const { error } = Joi.object({
      email: Joi.string().required().email(),
      password: Joi.string().required().max(100).min(6),
      secondPassword: Joi.ref('password'),
    }).validate({ email, password, secondPassword });
    if (error) {
      return res.status(400).json({ success: false, message: 'Bad request', error });
    }

    try {
      const user = await Users.findOne({ username: email }).exec();
      if (!user) return res.status(403).json({ success: false, message: "user doesn't exists" });
      console.debug(user);
      const match = await bcrypt.compare(password, (user || {}).password || '');
      if (!match) return res.status(403).json({ success: false, message: "user password doesn't match" });
      const tokenExists = [...((user || {}).tokens || [])].pop();
      if (Object.keys(tokenExists || {}).length) {
        const { exp: tokenExistsExpiresIn } = jwt.verify((tokenExists || {}).token || '', process.env.jwtSecret || '');
        if (new Date(tokenExistsExpiresIn).getTime() >= new Date().getTime()) {
          return res.status(200).json({
            success: true,
            message: 're-login successfully',
            data: { accessToken: (tokenExists || {}).token, expiresIn: (tokenExists || {}).expiresIn },
          });
        }
      }
      const iat = new Date().getTime(),
        exp = new Date().setDate(new Date().getDate() + 2);
      const accessToken = jwt.sign({ iss: process.env.ISS, sub: (user || {})._id, iat, exp }, process.env.jwtSecret || '');
      ((user || {}).tokens || {}).push({
        token: accessToken,
        expiresIn: new Date(exp),
        createdAt: new Date(iat),
      });
      await user.save();
      return res.status(200).json({ success: true, message: 'login successfully', data: { accessToken, expiresIn: new Date(exp) } });
    } catch (error) {
      console.debug(error);
      return next(new HttpError());
    }
  }
}
module.exports.default = AuthenticationController;
