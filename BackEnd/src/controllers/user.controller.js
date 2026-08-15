import { generateToken } from '../utils/tokenUtil.js';
import { customResponse } from '../utils/response.js';
import logger from '../utils/logger.js';
import { ErrorMessages,USER_MESSAGES } from '../utils/constants.js';
import { createUser, findUserExists, loginUser, resendOTP, verifyCode,getModules,submitAccessModule } from '../services/user.service.js';



// Controller to register a new user
export const registerUser = async (req, res) => {
    try {
      
      const userData = req.body;
      console.log('User Data:', userData);
      // 4. Check if mobile number/email already exists
      const existingUser = await findUserExists(userData);
      if (existingUser) {
        logger.warn(`Hey, this mobile <number />
        <email /> is already registered: ${userData.mobileNumber}, ${userData.email}`);
        return customResponse(res, USER_MESSAGES.MOBILE_ALREADY_REGISTERED, 400);
      }
      
      // 5. Save new User
      const user = await createUser(userData);
      logger.info(`New User registered with ID: ${user._id}`);
  
    
      // 7. Send Verification OTP via Mobile Number
      const otp = Math.floor(1000 + Math.random() * 9000);
      user.otp = otp;
      user.otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
      await user.save();
      logger.info(`Verification OTP sent to ${user.mobileNumber}`);
      
      // 8. Send success response
      return customResponse(res, USER_MESSAGES.REGISTER_SUCCESS, 201, { user });
  
    } catch (error) {

      logger.error('Error registering user:', error);
      return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
    }
  };

// Controller to resend OTP
export const resendOTPController = async (req, res) => {
    try {   
        const userId = req.params.id;
        const user = await resendOTP(userId);
        if (!user) {
            logger.warn(`User not found with ID: ${userId}`);
            return customResponse(res, ErrorMessages.USER_NOT_FOUND, 404);
        }
        logger.info(`OTP resent for user with ID: ${userId}`);
        return customResponse(res, USER_MESSAGES.OTP_RESENT, 200);
    } catch (error) {
        logger.error('Error resending OTP:', error);
        return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
    }
};

// Controller to verify OTP
export const verifyOTPController = async (req, res) => {
    try {
        const userId = req.params.id;
        const otp = req.body.otp;
        const isVerified = await verifyCode(userId, otp);
        if (isVerified) {
            logger.info(`OTP verified for user with ID: ${userId}`);
            return customResponse(res, USER_MESSAGES.OTP_VERIFIED, 200);
        } else {
            logger.warn(`OTP verification failed for user with ID: ${userId}`);
            return customResponse(res, USER_MESSAGES.OTP_VERIFICATION_FAILED, 400);
        }
    } catch (error) {
        if (error.message === ErrorMessages.USER_NOT_FOUND) {
            logger.warn(`User not found with ID: ${req.params.id}`);
            return customResponse(res, ErrorMessages.USER_NOT_FOUND, 404);
        }
        logger.error('Error verifying OTP:', error);
        return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
    }
};

// Controller to login a user
export const loginUserController = async (req, res) => {
  try {
    const { mobileNumber, password } = req.body;
    const user = await loginUser(mobileNumber, password);
    logger.info(`User logged in with ID: ${user._id}`);
    const token = generateToken(user._id);
    return customResponse(res, USER_MESSAGES.LOGIN_SUCCESS, 200, { token, user });
  } catch (error) {
    logger.error('Error logging in user:', error);
    if (error.message === ErrorMessages.INVALID_USERNAME) {
      return customResponse(res, ErrorMessages.INVALID_USERNAME, 401);
    }
    else if (error.message === ErrorMessages.INVALID_PASSWORD) {
      return customResponse(res, ErrorMessages.INVALID_PASSWORD, 401);
    }
    // Handle other errors
    logger.error('Unexpected error during user login:', error);
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);    
  }  
};

// get module list 
export const getModuleList = async (req, res) => {
  try {
    const modules = await getModules();
    if (!modules || modules.length === 0) {
      logger.warn(`No modules found `);
      return customResponse(res, USER_MESSAGES.NO_MODULES_FOUND, 404);
    }
    logger.info(`Modules found `);
    return customResponse(res, USER_MESSAGES.MODULES_FOUND, 200, { modules });
  } catch (error) {
    logger.error('Error fetching module list:', error);
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
}

//submit access module list of a user
export const postAccessModuleController = async (req, res) => {
  try {
    const userId = req.params.id; // Assuming user ID is available in req.user
    const { moduleIds } = req.body; // Expecting an array of module IDs in the request body
    const accessModules = await submitAccessModule(userId, moduleIds);
    logger.info(`Access modules submitted for user with ID: ${userId}`);
    return customResponse(res, USER_MESSAGES.ACCESS_MODULES_SUBMITTED, 200, { accessModules });
  } catch (error) {
    logger.error('Error submitting access modules:', error);
    return customResponse(res, ErrorMessages.SERVER_ERROR, 500);
  }
};

