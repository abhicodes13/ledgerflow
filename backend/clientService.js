const clientRepository = require("./clientRepository");

const clientService = {
  async registerClient(name, email) {
    const cleanEmail = email.toLowerCase().trim();

    const existingClient = await clientRepository.findByEmail(cleanEmail);
    if (existingClient) {
      const error = new Error(
        "A client account with this email is already registered.",
      );
      error.code = "DUPLICATE_EMAIL";
      throw error;
    }
    const finalizedClient = await clientRepository.create(name, cleanEmail);
    return finalizedClient;
  },
};

module.exports = clientService;
