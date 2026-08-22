/**
 * Centralised API response helpers.
 * Ensures a consistent JSON envelope across all endpoints.
 */

/** 200 success */
const sendSuccess = (res, data = {}, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({ success: true, message, data });
};

/** 201 created */
const sendCreated = (res, data = {}, message = 'Created successfully') => {
  sendSuccess(res, data, message, 201);
};

/** 400 bad request */
const sendBadRequest = (res, message = 'Bad request') => {
  res.status(400).json({ success: false, message });
};

/** 401 unauthorized */
const sendUnauthorized = (res, message = 'Unauthorized') => {
  res.status(401).json({ success: false, message });
};

/** 403 forbidden */
const sendForbidden = (res, message = 'Forbidden') => {
  res.status(403).json({ success: false, message });
};

/** 404 not found */
const sendNotFound = (res, message = 'Resource not found') => {
  res.status(404).json({ success: false, message });
};

/** Paginated list response */
const sendPaginated = (res, data, total, page, limit, message = 'Success') => {
  res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit),
    },
  });
};

module.exports = { sendSuccess, sendCreated, sendBadRequest, sendUnauthorized, sendForbidden, sendNotFound, sendPaginated };
