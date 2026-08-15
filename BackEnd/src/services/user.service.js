import { calculateAge } from '../utils/calculateAge.js';
import { sendEmailTemplate } from '../utils/templateHandler.js';
import { EMAIL_TEMPLATES, EMAIL_SUBJECTS, ErrorMessages, CLIENT } from '../utils/constants.js';
import User from '../models/user.model.js';
import Module from '../models/module.js';
import userAccess from '../models/userAccess.model.js';
import { logger } from '../utils/logger.js';

// Service to create a new user
export const createUser = async (userData) => {
  const user = new User(userData);
  const password = Math.random().toString(36).slice(-8);
  user.password = password;
  // send welcome email if email is provided
  if (user.email) {
    // const MailData = { name: user.name, email: user.email };
    // await sendEmailTemplate({ data: MailData, templateName: EMAIL_TEMPLATES.WELCOME, subject: EMAIL_SUBJECTS.WELCOME });
    // logger.info(`Welcome email sent to: ${user.email}`);
  }
  // send SMS with the generated password
  // Assuming you have a function to send SMS
  // await sendSMS(user.mobileNumber, `Your password is: ${password}`);

  const codePrefix = `${CLIENT.USER_CODE_PREFIX}`;

  // Find the last patient with today's code prefix
  const lastuser = await User.findOne({ userCode: { $regex: `^${codePrefix}` } })
    .sort({ userCode: -1 });

  let sequence = 1;
  if (lastuser && lastuser.userCode) {
    // Extract sequence number from last code
    const lastSeq = parseInt(lastuser.userCode.slice(-3), 10);
    sequence = lastSeq + 1;
  }

  user.userCode = `${codePrefix}${sequence.toString().padStart(3, '0')}`;

  return await user.save();
};

// Service to resend OTP
export const resendOTP = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error(ErrorMessages.USER_NOT_FOUND);
  }
  user.otp = generateOTP();
  await user.save();
  // send OTP via SMS
  // Assuming you have a function to send SMS
  // await sendSMS(user.mobileNumber, `Your OTP is: ${user.otp}`);
  logger.info(`OTP resent to: ${user.mobileNumber}`);
  return user;
};

// Service to Verify OTP
export const verifyCode = async (userId, otp) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error(ErrorMessages.USER_NOT_FOUND);
  }
  if (user.otp === otp && user.otpExpiresAt > new Date()) {
    user.status = true; // Mark user as verified
    await user.save();
    logger.info(`OTP verified for user with ID: ${userId}`);
    return true;
  } else {
    logger.warn(`OTP verification failed for user with ID: ${userId}`);
    return false;
  }
};

// Service to find if a user already exists by mobile number or email
export const findUserExists = async (userData) => {
  const { mobileNumber, email } = userData;
  return await User.findOne({ $or: [{ mobileNumber }, { email }] });
};

// Service to login a user
export const loginUser = async (mobileNumber, password) => {
  const user = await User.findOne({ mobileNumber });
  if (!user) {
    throw new Error(ErrorMessages.INVALID_USERNAME);
  }
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new Error(ErrorMessages.INVALID_PASSWORD);
  }
  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
};

//
export const getModules = async () => {
  try {
    const menuList = await Module.aggregate([
      {
        $match: { status: true } // only active menus
      },
      {
        $group: {
          _id: "$parentModule",
          icon: { $first: "$parentIcon" },
          list: {
            $push: {
              _id: "$_id",
              pageName: "$pageName",
              pageUrl: "$pageUrl",
              pageCode: "$pageCode",
              icon: "$icon",
              activeIcon: "$activeIcon",
              displayorder: "$displayorder"
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          parentModule: "$_id",
          icon: 1,
          list: 1
        }
      }
    ]);
 
    return menuList;
  } catch (error) {
    logger.error('Error fetching modules:', error);
    throw new Error(ErrorMessages.SERVER_ERROR);
  }
};

// service to get access module list of a user
export const getAccessModules = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error(ErrorMessages.USER_NOT_FOUND);
  }
  // userACcessModules is table with userId and ModuleId

  return user.accessModules;
};

// service to submit access module list of a user
export const submitAccessModule = async (userId, moduleIds) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error(ErrorMessages.USER_NOT_FOUND);
  }
  // Validate moduleIds is an array 
  if (!Array.isArray(moduleIds)) {
    throw new Error('moduleIds must be an array');
  }

  // Validate each moduleId object
  moduleIds.forEach(mod => {
    if (
      !mod.moduleId ||
      typeof mod.read !== 'boolean' ||
      typeof mod.write !== 'boolean'
    ) {
      throw new Error('Each module must have moduleId, read, and write properties');
    }
  });

  // Remove existing access for this user
  await userAccess.deleteMany({ userId: userId });

  // Add new access modules for this user
  await userAccess.insertMany(
    moduleIds.map(mod => ({
      userId: userId,
      moduleId: mod.moduleId,
      read: mod.read,
      write: mod.write
    }))
  );
 
  return user;
};