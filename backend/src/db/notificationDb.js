const db = require('../config/dbPgConfig');

class NotificationDb {
    // 🔹 Inserir nova notificação
    static async insert(model) {
        const conn = await db.connect();
        const { user_id, type, title, message, related_id } = model;

        const query = `
            INSERT INTO notifications (user_id, type, title, message, related_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;

        const result = await conn.query(query, [user_id, type, title, message, related_id]);
        conn.release();
        return result.rows[0];
    }

    // 🔹 Buscar notificações de um usuário
    static async findByUser(user_id) {
        const conn = await db.connect();
        const query = `
            SELECT * FROM notifications
            WHERE user_id = $1
            ORDER BY created_at DESC;
        `;
        const result = await conn.query(query, [user_id]);
        conn.release();
        return result.rows;
    }

    // 🔹 Marcar notificação como lida
    static async markAsRead(notification_id, user_id) {
        const conn = await db.connect();
        const query = `
            UPDATE notifications
            SET read = true, updated_at = NOW()
            WHERE notification_id = $1 AND user_id = $2
            RETURNING *;
        `;
        const result = await conn.query(query, [notification_id, user_id]);
        conn.release();
        return result.rows[0];
    }
}

module.exports = NotificationDb;
