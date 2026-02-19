/**
 * Standardised JSON response helpers
 */

const success = (res, data = null, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const created = (res, data = null, message = "Created successfully") => {
  return success(res, data, message, 201);
};

const paginated = (res, { rows, count, page, limit }, message = "Success") => {
  return res.status(200).json({
    success: true,
    message,
    data: rows,
    pagination: {
      total: count,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(count / limit),
    },
  });
};

module.exports = { success, created, paginated };
