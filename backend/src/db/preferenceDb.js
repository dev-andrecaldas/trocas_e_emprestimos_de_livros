const db = require('../config/dbPgConfig');

class PreferenceDb {
    // Obter o ID do tipo de preferência pelo nome
    static async getTypeId(model) {
        const conn = await db.connect();
        const { type_name } = model;
        const query = 'SELECT type_id FROM preference_types WHERE type_name = $1;';
        const result = await conn.query(query, [type_name]);
        conn.release();
        return result.rows[0];
    }

    // Inserir uma nova preferência de usuário
    static async insertUserPreference(model) {
        const conn = await db.connect();
        const { user_id, type_id, preference_value } = model;
        const query = `
            INSERT INTO user_preferences (user_id, type_id, preference_value)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const result = await conn.query(query, [user_id, type_id, preference_value]);
        conn.release();
        return result.rows[0];
    }

    // Obter todas as preferências de um usuário
    static async getByUser(model) {
        const conn = await db.connect();
        const { user_id } = model;
        const query = `
            SELECT 
                up.*,
                pt.type_name
            FROM user_preferences up
            JOIN preference_types pt ON up.type_id = pt.type_id
            WHERE up.user_id = $1
            ORDER BY pt.type_name, up.preference_value;
        `;
        const result = await conn.query(query, [user_id]);
        conn.release();
        return result.rows;
    }

    // Deletar preferência
    static async deletePreference(model) {
        const conn = await db.connect();
        const { user_id, user_pref_id } = model;
        const query = 'DELETE FROM user_preferences WHERE user_pref_id = $1 AND user_id = $2 RETURNING *;';
        const result = await conn.query(query, [user_pref_id, user_id]);
        conn.release();
        return result.rowCount > 0;
    }
}
module.exports = PreferenceDb;