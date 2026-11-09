const clientRepository = require("./clientRepository");
const { AppError } = require("./errors");

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const E164_RE = /^\+[1-9]\d{7,14}$/;

// Stores phone numbers as E.164 (+12015551234), which Twilio requires.
// Assumption: a bare 10-digit number is a US number.
function normalizePhone(raw) {
  if (raw == null || String(raw).trim() === "") return null;
  let compact = String(raw).replace(/[\s().-]/g, "");
  if (/^\d{10}$/.test(compact)) compact = `+1${compact}`;
  if (!E164_RE.test(compact)) {
    throw new AppError("Phone number must look like +12015551234", 400);
  }
  return compact;
}

const clientService = {
  async registerClient(activeUserId, name, email, phoneNumber) {
    const cleanName = typeof name === "string" ? name.trim() : "";
    const cleanEmail =
      typeof email === "string" ? email.toLowerCase().trim() : "";

    if (!cleanName || cleanName.length > 255) {
      throw new AppError("Client name is required (max 255 characters)", 400);
    }
    if (!EMAIL_RE.test(cleanEmail) || cleanEmail.length > 255) {
      throw new AppError("A valid client email is required", 400);
    }
    const cleanPhone = normalizePhone(phoneNumber);

    try {
      return await clientRepository.create(
        activeUserId,
        cleanName,
        cleanEmail,
        cleanPhone,
      );
    } catch (error) {
      // The unique constraint (user_id, email) is the real duplicate guard
      if (error.code === "23505") {
        throw new AppError(
          "A client account with this email is already registered.",
          409,
          "DUPLICATE_EMAIL",
        );
      }
      throw error;
    }
  },

  async listClients(activeUserId) {
    return clientRepository.findAll(activeUserId);
  },
};

module.exports = clientService;
