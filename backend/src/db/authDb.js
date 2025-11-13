const db = require('../config/dbPgConfig');

class AuthDb {

    // ===========================
    // Inserir novo usuário
    // ===========================
    static async insert(model) {
        const conn = await db.connect();
        const { username, email, password, full_name } = model;

        const query = `
            INSERT INTO users (username, email, password, full_name)
            VALUES ($1, $2, $3, $4)
            RETURNING user_id, username, email, full_name
        `;

        const result = await conn.query(query, [username, email, password, full_name]);
        conn.release();
        return result.rows[0];
    }

    // ===========================
    // Buscar usuário por email
    // ===========================
    static async findByEmail(model) {
        const conn = await db.connect();
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await conn.query(query, [model.email]);
        conn.release();
        return result.rows[0];
    }

    // ===========================
    // Buscar usuário por username
    // ===========================
    static async findByUsername(model) {
        const conn = await db.connect();
        const query = 'SELECT * FROM users WHERE username = $1';
        const result = await conn.query(query, [model.username]);
        conn.release();
        return result.rows[0];
    }

    // ===========================
    // Verificar se email ou username já existem
    // ===========================
    static async checkExisting(model) {
        const conn = await db.connect();
        const { email, username } = model;
        const query = `
            SELECT user_id, email, username
            FROM users
            WHERE email = $1 OR username = $2
        `;
        const result = await conn.query(query, [email, username]);
        conn.release();
        return result.rows;
    }

    // ===========================
    // Buscar usuário por ID
    // ===========================
    static async findById(model) {
        const conn = await db.connect();
        const query = `
            SELECT 
                u.user_id, u.username, u.email, u.full_name, u.password, u.created_at,
                u.bio, u.city, u.state, u.profile_picture_url,
                COALESCE(
                    (SELECT ARRAY_AGG(up.preference_value)
                     FROM user_preferences up
                     WHERE up.user_id = u.user_id
                       AND up.type_id = 1),
                    '{}'::text[]
                ) AS preferences
            FROM users u
            WHERE u.user_id = $1
            GROUP BY u.user_id;
        `;
        const result = await conn.query(query, [model.user_id]);
        conn.release();
        return result.rows[0];
    }

    // ===========================
    // Atualizar perfil do usuário
    // ===========================
    static async updateProfile(model) {
        const conn = await db.connect();
        const { user_id, full_name, profile_picture_url, bio, city, state, preferences } = model;
        const genre_type_id = 1;

        try {
            await conn.query('BEGIN');

            // Atualiza tabela users
            const updateUserQuery = `
                UPDATE users SET
                    full_name = COALESCE($1, full_name),
                    profile_picture_url = COALESCE($2, profile_picture_url),
                    bio = COALESCE($3, bio),
                    city = COALESCE($4, city),
                    state = COALESCE($5, state),
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = $6;
            `;
            await conn.query(updateUserQuery, [full_name, profile_picture_url, bio, city, state, user_id]);

            // Deleta preferências antigas de gênero
            await conn.query(
                'DELETE FROM user_preferences WHERE user_id = $1 AND type_id = $2',
                [user_id, genre_type_id]
            );

            // Insere novas preferências de gênero
            if (preferences && preferences.length > 0) {
                const insertPrefsQuery = `
                    INSERT INTO user_preferences (user_id, type_id, preference_value)
                    SELECT $1, $2, unnest($3::text[]);
                `;
                await conn.query(insertPrefsQuery, [user_id, genre_type_id, preferences]);
            }

            await conn.query('COMMIT');

            // Retorna usuário atualizado
            return await this.findById({ user_id });

        } catch (e) {
            await conn.query('ROLLBACK');
            console.error('Erro na transação de updateProfile:', e);
            throw e;
        } finally {
            conn.release();
        }
    }

    // ===========================
    // Atualizar senha do usuário
    // ===========================
    static async updatePassword(model) {
        const conn = await db.connect();
        const { user_id, new_hashed_password } = model;

        const query = `
            UPDATE users SET
                password = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $2
            RETURNING user_id, username, email, updated_at;
        `;

        const result = await conn.query(query, [new_hashed_password, user_id]);
        conn.release();
        return result.rows[0];
    }

    // ===========================
    // Deletar usuário
    // ===========================
    static async deleteUser(model) {
        const conn = await db.connect();
        const query = 'DELETE FROM users WHERE user_id = $1 RETURNING *;';
        const result = await conn.query(query, [model.user_id]);
        conn.release();
        return result.rowCount > 0;
    }

}

module.exports = AuthDb;