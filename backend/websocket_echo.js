exports.handler = async (event) => {
  const { connectionId } = event.requestContext;
  // Return the connection ID to the client
  return { statusCode: 200, body: JSON.stringify({ connectionId }) };
};