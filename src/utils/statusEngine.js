export const calculateStatus = (req, matchedFile, expiryDate, deadlineStr) => {
  if (!matchedFile) {
    return req.mandatory ? "Missing" : "Not provided";
  }

  if (req.has_expiry) {
    if (!expiryDate) {
      return "Expiry date needed";
    }

    const expiry = new Date(expiryDate);
    const deadline = new Date(deadlineStr);

    if (expiry < deadline) {
      return "Expired";
    }
  }

  return "OK";
};

export const isBlockingStatus = (status) => {
  return status === "Missing" || status === "Expiry date needed" || status === "Expired";
};