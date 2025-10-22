const errorHandling = (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;

  // Log the error for server-side monitoring
  console.error(`
[❌ ERROR LOG]
Time     : ${timestamp}
Method   : ${method}
Endpoint : ${url}
Name     : ${err.name}
Message  : ${err.message}
Stack    : ${err.stack || 'No stack trace available'}
-------------------------------
`);

  let statusCode = err.statusCode || err.status || 500;
  let responseMessage = err.message || "Internal Server Error";
  let errorDetails = []; // This will map to the 'errors' array in the response

  // Handle specific, known error types
  switch (err.name) {
    case "SequelizeValidationError":
      statusCode = 400;
      responseMessage = "Validation Failed";
      errorDetails = err.errors.map((e) => ({
        field: e.path,
        message: e.message,
        type: e.type,
      }));
      break;
    case "SequelizeUniqueConstraintError":
      statusCode = 409; // 409 Conflict is more appropriate for unique constraints
      responseMessage = "Data Conflict";
      const uniqueField = err.fields ? Object.keys(err.fields)[0] : undefined;
      errorDetails = [{
        message: `The value for '${uniqueField || 'a unique field'}' already exists.`,
        field: uniqueField,
      }];
      break;
    case "SequelizeForeignKeyConstraintError":
      statusCode = 400;
      responseMessage = "Related Data Error";
      errorDetails = [{
        message: "A related record could not be found or does not exist.",
        field: err.fields ? Object.keys(err.fields)[0] : undefined
      }];
      break;
    case "SequelizeDatabaseError":
      statusCode = 400;
      responseMessage = "Database Error";
      // Avoid leaking specific SQL errors in the response
      errorDetails = [{ message: "A database operation failed due to invalid input or structure." }];
      break;
    // Handle generic or custom errors
    default:
      // For client errors (4xx), the primary message is often specific and useful.
      // For server errors (5xx), we use a generic message to avoid leaking implementation details.
      if (statusCode >= 500) {
        responseMessage = "Internal Server Error";
      }
      // Add the original error message to the details array if it's not already there.
      if (err.message) {
        errorDetails.push({ message: err.message });
      }
      break;
  }

  // Ensure the errors array is never empty for a consistent response structure.
  if (errorDetails.length === 0) {
    errorDetails.push({ message: responseMessage });
  }

  const errorResponse = {
    status: "Failed",
    message: responseMessage,
    errors: errorDetails,
  };

  // Add stack trace in development environment for easier debugging
  if (process.env.NODE_ENV === "development") {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandling;