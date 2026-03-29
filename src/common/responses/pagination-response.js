class PaginationResponse {
  static send({
    res,
    message = 'Success',
    data = [],
    page,
    limit,
    total,
    statusCode = 200,
  }) {
    const totalPages = Math.ceil(total / limit);

    return res.status(statusCode).json({
      success: true,
      message,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  }
}

module.exports = PaginationResponse;