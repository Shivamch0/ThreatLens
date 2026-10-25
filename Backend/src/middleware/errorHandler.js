export function errorHandler(error, _req, res, _next) {
  const status = error.statusCode || (error.name === 'ValidationError' ? 400 : error.code === 11000 ? 409 : 500);
  if (status >= 500) console.error(error.message);
  res.status(status).json({ success: false, message: status >= 500 ? 'Internal server error' : error.message });
}
