const db = require('../config/dbPgConfig'); // Verifique o caminho da sua conexão

class BookDb {
    
    // Inserir novo livro
    static async insert(model) {
        const conn = await db.connect();
        
        const {
            title, author, publisher, isbn, description, condition,
            exchange_available, loan_available, owner_id,
            publication_year, 
            main_genre,       
            cover_image_url,
            available 
        } = model;
        
        const query = `
            INSERT INTO books 
            (title, author, publisher, isbn, description, condition, 
            exchange_available, loan_available, owner_id, 
            publication_year, main_genre, cover_image_url, available) 
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) 
            RETURNING *`; 
        
        const result = await conn.query(query, [
            title, author, publisher, isbn, description, condition,
            exchange_available, loan_available, owner_id,
            publication_year, main_genre, cover_image_url, available ?? true // Garante um valor default
        ]);
        conn.release();
        
        const newBook = result.rows[0];
        // Mapeia nomes de colunas para o frontend, se necessário (exemplo)
        if (newBook) {
            newBook.id = newBook.book_id;
            newBook.year = newBook.publication_year; 
            newBook.genre = newBook.main_genre;
            newBook.img = newBook.cover_image_url;
            newBook.ownerId = newBook.owner_id;
        }
        return newBook;
    }
    
    // Buscar todos os livros
    static async selectAll(model = {}) {
        const conn = await db.connect();
        
        let query = `
            SELECT 
                b.*, 
                b.book_id AS id, 
                b.publication_year AS year, 
                b.main_genre AS genre, 
                b.cover_image_url AS img,
                b.owner_id AS "ownerId",  -- Corrigido para camelCase
                u.username as owner_name 
            FROM books b 
            JOIN users u ON b.owner_id = u.user_id 
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 0;
    
        if (model.search) {
            paramCount++;
            query += ` AND (b.title ILIKE $${paramCount} OR b.author ILIKE $${paramCount})`;
            params.push(`%${model.search}%`);
        }
        if (model.type === 'troca') query += ` AND b.exchange_available = true`;
        if (model.type === 'emprestimo') query += ` AND b.loan_available = true`;
        // if (model.owner_id) { // Filtro por dono, se necessário
        //     paramCount++;
        //     query += ` AND b.owner_id = $${paramCount}`;
        //     params.push(model.owner_id);
        // }
        
        // Adicionando filtro para livros disponíveis na busca geral?
        // query += ` AND b.available = true`; // Descomente se quiser filtrar aqui também

        query += ` ORDER BY b.created_at DESC`;
    
        const result = await conn.query(query, params);
        conn.release();
        // Mapeia nomes das colunas consistentemente (opcional, mas bom)
        return result.rows.map(row => ({
            ...row,
            id: row.book_id,
            year: row.publication_year,
            genre: row.main_genre,
            img: row.cover_image_url,
            ownerId: row.owner_id // Garante camelCase
        }));
    }
        
    // Buscar livro por ID
    static async selectById(model) {
        const conn = await db.connect();
        const book_id = model.book_id;
        
        const query = `
            SELECT 
                b.*, 
                b.book_id AS id, 
                b.publication_year AS year,
                b.main_genre AS genre,
                b.cover_image_url AS img,
                u.username AS owner_name, 
                u.email AS owner_email,
                b.owner_id AS "ownerId" -- Corrigido para camelCase
            FROM books b 
            JOIN users u ON b.owner_id = u.user_id 
            WHERE b.book_id = $1
        `;
        
        const result = await conn.query(query, [book_id]);
        conn.release();
        const book = result.rows[0];
         // Mapeia nomes das colunas consistentemente
        if (book) {
            book.id = book.book_id;
            book.year = book.publication_year;
            book.genre = book.main_genre;
            book.img = book.cover_image_url;
            book.ownerId = book.owner_id;
        }
        return book;
    }
    
    // Atualizar livro
    static async update(model) {
        const conn = await db.connect();
        
        const {
            book_id, title, author, publisher, isbn, description, condition,
            exchange_available, loan_available, available, owner_id,
            publication_year, main_genre, cover_image_url
        } = model;

        // Monta a query dinamicamente apenas com os campos fornecidos (melhor prática)
        const fieldsToUpdate = [];
        const values = [];
        let paramIndex = 1;

        if (title !== undefined) { fieldsToUpdate.push(`title = $${paramIndex++}`); values.push(title); }
        if (author !== undefined) { fieldsToUpdate.push(`author = $${paramIndex++}`); values.push(author); }
        if (publisher !== undefined) { fieldsToUpdate.push(`publisher = $${paramIndex++}`); values.push(publisher); }
        if (isbn !== undefined) { fieldsToUpdate.push(`isbn = $${paramIndex++}`); values.push(isbn); }
        if (description !== undefined) { fieldsToUpdate.push(`description = $${paramIndex++}`); values.push(description); }
        if (condition !== undefined) { fieldsToUpdate.push(`condition = $${paramIndex++}`); values.push(condition); }
        if (exchange_available !== undefined) { fieldsToUpdate.push(`exchange_available = $${paramIndex++}`); values.push(exchange_available); }
        if (loan_available !== undefined) { fieldsToUpdate.push(`loan_available = $${paramIndex++}`); values.push(loan_available); }
        if (available !== undefined) { fieldsToUpdate.push(`available = $${paramIndex++}`); values.push(available); }
        if (publication_year !== undefined) { fieldsToUpdate.push(`publication_year = $${paramIndex++}`); values.push(publication_year); }
        if (main_genre !== undefined) { fieldsToUpdate.push(`main_genre = $${paramIndex++}`); values.push(main_genre); }
        if (cover_image_url !== undefined) { fieldsToUpdate.push(`cover_image_url = $${paramIndex++}`); values.push(cover_image_url); }

        if (fieldsToUpdate.length === 0) {
            conn.release();
            // Retorna o livro existente se nada for alterado? Ou um erro?
            // Vamos buscar e retornar o livro existente para consistência
             return await this.selectById({ book_id });
        }
        
        fieldsToUpdate.push(`updated_at = NOW()`); // Sempre atualiza timestamp

        const query = `
            UPDATE books SET 
                ${fieldsToUpdate.join(', ')}
            WHERE book_id = $${paramIndex++} AND owner_id = $${paramIndex++}
            RETURNING *
        `;
        
        values.push(book_id, owner_id);
        
        const result = await conn.query(query, values);
        conn.release();
        
        const updatedBook = result.rows[0];
        // Mapeia nomes das colunas consistentemente
         if (updatedBook) {
            updatedBook.id = updatedBook.book_id;
            updatedBook.year = updatedBook.publication_year;
            updatedBook.genre = updatedBook.main_genre;
            updatedBook.img = updatedBook.cover_image_url;
            updatedBook.ownerId = updatedBook.owner_id;
        }
        return updatedBook;
    }
    
    // Deletar livro
    static async delete(model) {
        const conn = await db.connect();
        const book_id = model.book_id;
        const owner_id = model.owner_id;
        const query = 'DELETE FROM books WHERE book_id = $1 AND owner_id = $2';
        const result = await conn.query(query, [book_id, owner_id]);
        conn.release();
        return result.rowCount > 0;
    }
    
    // Verificar propriedade do livro
    static async checkOwnership(model) {
        const conn = await db.connect();
        const book_id = model.book_id;
        const owner_id = model.owner_id;
        const query = 'SELECT owner_id FROM books WHERE book_id = $1';
        const result = await conn.query(query, [book_id]);
        conn.release();
        if (result.rows.length === 0) {
            return { exists: false, isOwner: false };
        }
        return {
            exists: true,
            isOwner: result.rows[0].owner_id === owner_id
        };
    }
    
    // Buscar livros do usuário
    static async selectByOwner(model) {
        const conn = await db.connect();
        const owner_id = model.owner_id;
        
        const query = `
            SELECT 
                b.*, 
                b.book_id AS id, 
                b.publication_year AS year, 
                b.main_genre AS genre,
                b.cover_image_url AS img,
                b.owner_id AS "ownerId" -- Corrigido para camelCase
            FROM books b
            WHERE b.owner_id = $1 
            ORDER BY b.created_at DESC
        `;
        
        const result = await conn.query(query, [owner_id]);
        conn.release();
        // Mapeia nomes das colunas consistentemente
         return result.rows.map(row => ({
            ...row,
            id: row.book_id,
            year: row.publication_year,
            genre: row.main_genre,
            img: row.cover_image_url,
            ownerId: row.owner_id
        }));
    }

    // --- MÉTODO NOVO ADICIONADO ---
    // NOVO: Atualizar o status 'available' de um livro
    static async updateAvailability(model) {
        const conn = await db.connect();
        const book_id = model.book_id;
        const available = model.available; // Será true ou false

        // Validação básica
        if (typeof book_id !== 'number' || typeof available !== 'boolean') {
            conn.release();
            throw new Error("ID do livro e status 'available' são obrigatórios e devem ter tipos corretos.");
        }

        const query = `
            UPDATE books 
            SET available = $1, updated_at = NOW() 
            WHERE book_id = $2
            RETURNING book_id, available; 
        `; // Retorna só o necessário

        try {
            const result = await conn.query(query, [available, book_id]);
            conn.release();
            return result.rows[0]; // Retorna { book_id: ..., available: ... } ou undefined
        } catch (error) {
            conn.release();
            console.error(`Erro ao atualizar disponibilidade do livro ${book_id}:`, error);
            throw error; // Re-lança o erro para o controller tratar
        }
    }
    // --- FIM DO MÉTODO NOVO ---
}

module.exports = BookDb;