const db = require('../config/dbPgConfig');

class FeedDb {
    // Inserir um novo post
    static async insertPost(model) {
        const conn = await db.connect();
        const { user_id, content, post_type, related_book_id } = model;

        const query = `
            INSERT INTO feed_posts (user_id, content, post_type, related_book_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;

        const result = await conn.query(query, [user_id, content, post_type, related_book_id]);
        conn.release();
        return result.rows[0];
    }

    // Obter todos os posts do feed (usando a view detalhada)
    static async getAll() {
        const conn = await db.connect();
        const query = 'SELECT * FROM feed_posts_detailed ORDER BY created_at DESC;';
        const result = await conn.query(query);
        conn.release();
        return result.rows;
    }

    // Obter um post por ID (usando a view detalhada)
    static async getById(model) {
        const conn = await db.connect();
        const { post_id } = model;
        const query = 'SELECT * FROM feed_posts_detailed WHERE post_id = $1;';
        const result = await conn.query(query, [post_id]);
        conn.release();
        return result.rows[0];
    }

    // Atualizar o conteúdo de um post
    static async updatePost(model) {
        const conn = await db.connect();
        const { post_id, user_id, content, post_type, related_book_id } = model;

        const query = `
            UPDATE feed_posts
            SET 
                content = $1,
                post_type = COALESCE($2, post_type),
                related_book_id = COALESCE($3, related_book_id),
                updated_at = CURRENT_TIMESTAMP
            WHERE post_id = $4 AND user_id = $5
            RETURNING *;
        `;

        const result = await conn.query(query, [content, post_type, related_book_id, post_id, user_id]);
        conn.release();
        return result.rows[0];
    }

    // Deletar um post
    static async deletePost(model) {
        const conn = await db.connect();
        const { post_id, user_id } = model;
        const query = 'DELETE FROM feed_posts WHERE post_id = $1 AND user_id = $2;';
        const result = await conn.query(query, [post_id, user_id]);
        conn.release();
        return result.rowCount > 0;
    }

    // Verificar se um usuário é o dono de um post
    static async checkPostOwnership(model) {
        const conn = await db.connect();
        const { post_id, user_id } = model;
        const query = 'SELECT post_id FROM feed_posts WHERE post_id = $1 AND user_id = $2;';
        const result = await conn.query(query, [post_id, user_id]);
        conn.release();
        return result.rows.length > 0;
    }

    // Verificar se o usuário já curtiu um post
    static async hasLiked(model) {
        const conn = await db.connect();
        const { post_id, user_id } = model;
        const query = 'SELECT like_id FROM likes WHERE post_id = $1 AND user_id = $2;';
        const result = await conn.query(query, [post_id, user_id]);
        conn.release();
        return result.rows.length > 0;
    }

    // Adicionar uma curtida
    static async insertLike(model) {
        const conn = await db.connect();
        const { post_id, user_id } = model;
        const query = 'INSERT INTO likes (post_id, user_id) VALUES ($1, $2) RETURNING *;';
        const result = await conn.query(query, [post_id, user_id]);
        conn.release();
        return result.rows[0];
    }

    // Remover uma curtida
    static async deleteLike(model) {
        const conn = await db.connect();
        const { post_id, user_id } = model;
        const query = 'DELETE FROM likes WHERE post_id = $1 AND user_id = $2;';
        const result = await conn.query(query, [post_id, user_id]);
        conn.release();
        return result.rowCount > 0;
    }

    // Adicionar um comentário
    static async insertComment(model) {
        const conn = await db.connect();
        const { post_id, user_id, content } = model;
        const query = 'INSERT INTO comments (post_id, user_id, content) VALUES ($1, $2, $3) RETURNING *;';
        const result = await conn.query(query, [post_id, user_id, content]);
        conn.release();
        return result.rows[0];
    }

    // Obter comentários de um post por ID
    static async getCommentsByPostId(model) {
        const conn = await db.connect();
        const { post_id } = model;
        const query = `
            SELECT c.*, u.username, u.profile_picture_url
            FROM comments c
            JOIN users u ON c.user_id = u.user_id
            WHERE c.post_id = $1
            ORDER BY c.created_at ASC;
        `;
        const result = await conn.query(query, [post_id]);
        conn.release();
        return result.rows;
    }
}

module.exports = FeedDb;