const pool = require("./db");

const analyticsRepository = {
  // ⚡ UPDATED STAGE 3: Computes financial totals isolated strictly to the active user account
  async getOverviewMetrics(activeUserId) {
    if (!activeUserId)
      throw new Error("Authentication credential token required.");

    // SQL DATA SHEET ENGINE: Computes pending, collected, and customer row metrics all in one pass
    const queryText = `
            SELECT 
                COALESCE(SUM(CASE WHEN i.status = 'pending' THEN ii.quantity * ii.unit_amount_cents ELSE 0 END), 0)::INT AS total_outstanding_cents,
                COALESCE(SUM(CASE WHEN i.status = 'paid' THEN ii.quantity * ii.unit_amount_cents ELSE 0 END), 0)::INT AS total_collected_cents,
                (SELECT COUNT(*)::INT FROM clients WHERE user_id = $1) AS total_clients_count
            FROM invoices i
            LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
            WHERE i.user_id = $1;
        `;

    try {
      const result = await pool.query(queryText, [activeUserId]);
      const [metrics] = result.rows; // Extracts the single calculation dictionary card
      return metrics;
    } catch (error) {
      throw new Error(
        `Failed to calculate business database analytics telemetry: ${error.message}`,
      );
    }
  },
};

module.exports = analyticsRepository;
