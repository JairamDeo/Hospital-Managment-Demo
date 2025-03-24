// src/utils/response.js

export const customResponse = (res, message, statusCode = 200, data = null) => {
    return res.status(statusCode).json({
      message: message,
      status_code: statusCode,
      res: data
    });
  };
  