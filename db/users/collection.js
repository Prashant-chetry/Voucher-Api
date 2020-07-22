const { Schema, model } = require('mongoose');
const bcrypt = require('bcrypt');

const tokenSchema = new Schema(
  {
    token: {
      type: String,
      trim: true,
    },
    expiresIn: {
      type: Date,
      default: new Date(),
    },
  },
  {
    _id: false,
    timestamps: true,
  }
);

const userSchema = new Schema(
  {
    username: {
      type: String,
      min: 6,
      max: 100,
      trim: true,
      index: true,
      required: true,
    },
    password: {
      type: String,
      min: 6,
      max: 100,
      required: true,
    },
    tokens: {
      type: [tokenSchema],
    },
    methods: {
      type: String,
      enum: ['jwt', 'google'],
      required: true,
      default: 'jwt',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'users',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'users',
    },
    removed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
userSchema.pre('save', async function (next) {
  const user = this;
  if (user.password && user.isModified('password')) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    user.password = hashedPassword;
    return next();
  }
  return next();
});

const Users = model('users', userSchema);
module.exports.default = Users;
