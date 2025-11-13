// backend/src/db/messageDb.js

const db = require('../config/dbPgConfig');

class MessageDb {
    
    // Enviar uma nova mensagem
    static async insert(model) {
        const conn = await db.connect();
        const { sender_id, receiver_id, content, transaction_id } = model;

        const query = `
            INSERT INTO messages (sender_id, receiver_id, content, transaction_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;

        const result = await conn.query(query, [sender_id, receiver_id, content, transaction_id]);
        conn.release();
        return result.rows[0];
    }

    // Buscar a conversa entre dois usuários e suporta soft delete
    static async getConversation(model) {
        const conn = await db.connect();
        const { user_id, receiver_id } = model;

        const query = `
            SELECT * FROM messages
            WHERE (sender_id = $1 AND receiver_id = $2 AND is_deleted_by_sender = FALSE)
            OR (sender_id = $2 AND receiver_id = $1 AND is_deleted_by_receiver = FALSE)
            ORDER BY sent_at ASC;
        `;

        const result = await conn.query(query, [user_id, receiver_id]);
        conn.release();
        return result.rows;
    }
    
    // Obter mensagem por ID
    // Necessário para o modelo de soft delete verificar se o usuário é o sender ou receiver
    static async getById(model) {
        const conn = await db.connect();
        const { message_id } = model;
        const query = 'SELECT * FROM messages WHERE message_id = $1;';
        const result = await conn.query(query, [message_id]);
        conn.release();
        return result.rows[0];
    }

    // Faz um UPDATE em vez de DELETE para o soft delete
    static async deleteMessage(model) {
        const conn = await db.connect();
        const { message_id, user_id, is_sender } = model;
        
        let query;
        if (is_sender) {
            query = `
                UPDATE messages
                SET is_deleted_by_sender = TRUE, updated_at = CURRENT_TIMESTAMP
                WHERE message_id = $1 AND sender_id = $2
                RETURNING *;
            `;
        } else {
            query = `
                UPDATE messages
                SET is_deleted_by_receiver = TRUE, updated_at = CURRENT_TIMESTAMP
                WHERE message_id = $1 AND receiver_id = $2
                RETURNING *;
            `;
        }

        const result = await conn.query(query, [message_id, user_id]);
        conn.release();
        return result.rowCount > 0;
    }

    // Obter mensagem por ID
    static async getById(model) {
        const conn = await db.connect();
        const { message_id } = model;
        const query = 'SELECT * FROM messages WHERE message_id = $1;';
        const result = await conn.query(query, [message_id]);
        conn.release();
        return result.rows[0];
    }
}

module.exports = MessageDb;