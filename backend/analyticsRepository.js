const pool = require("./db");

const analyticsRepository = {
  // Calculates top-level business statistics directly inside the database
  async getOverviewMetrics() {
    const queryText = `
            SELECT 
                COALESCE(SUM(ui.quantity * ui.unit_amount_cents) FILTER (WHERE i.status = 'pending'), 0) as total_outstanding_cents,
                COALESCE(SUM(ui.quantity * ui.unit_amount_cents) FILTER (WHERE i.status = 'paid'), 0) as total_collected_cents,
                (SELECT COUNT(*) FROM clients) as total_clients_count
            FROM invoices i
            JOIN invoice_items ui ON i.id = ui.invoice_id;
        `;

    const result = await pool.query(queryText);

    // Use array destructuring to return the single object row cleanly
    const [metrics] = result.rows;
    return metrics;
  },
};

module.exports = analyticsRepository;
