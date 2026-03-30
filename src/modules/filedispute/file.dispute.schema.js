export const validateFileDisputePayload = (body) => {
  const {
    userName,
    userPhone,
    userRole,
    userQuery,
    userAddress,
    userService,
  } = body;

  if (!userName || !userPhone || !userRole || !userQuery || !userAddress) {
    return {
      valid: false,
      message:
        "userName, userPhone, userRole, userQuery, and userAddress are required",
    };
  }

  return {
    valid: true,
    data: {
      userName: String(userName).trim(),
      userPhone: String(userPhone).trim(),
      userRole: String(userRole).trim(),
      userQuery: String(userQuery).trim(),
      userAddress: String(userAddress).trim(),
      userService: userService ? String(userService).trim() : "Loan Settlement",
    },
  };
};