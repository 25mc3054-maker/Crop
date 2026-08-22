exports.handler = async (event) => {
  // Auto-confirm the user so they don't need to enter a code manually
  event.response.autoConfirmUser = true;

  // Auto-verify phone number to skip OTP verification step
  if (event.request.userAttributes.hasOwnProperty("phone_number")) {
    event.response.autoVerifyPhone = true;
  }
  return event;
};