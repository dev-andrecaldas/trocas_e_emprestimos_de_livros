const BookDb = require('../db/bookDb'); // Verifique se já está importado

class Book {
    
    // Criar novo livro
    static insert(model) {
        return BookDb.insert(model);
    }
    
    // Listar todos os livros
    static selectAll(model) {
        return BookDb.selectAll(model);
    }
    
    // Buscar livro por ID
    static selectById(model) {
        return BookDb.selectById(model);
    }
    
    // Atualizar livro
    static update(model) {
        return BookDb.update(model);
    }
    
    // Deletar livro
    static delete(model) {
        return BookDb.delete(model);
    }
    
    // Verificar propriedade do livro
    static checkOwnership(model) {
        return BookDb.checkOwnership(model);
    }
    
    // Buscar livros do usuário
    static selectByOwner(model) {
        return BookDb.selectByOwner(model);
    }
    
    // Validar dados do livro
    static validateBookData(model) {
        const errors = [];
        
        if (!model.title || model.title.trim().length === 0) {
            errors.push('Título é obrigatório');
        }
        
        if (!model.author || model.author.trim().length === 0) {
            errors.push('Autor é obrigatório');
        }
        
        if (model.condition && !this.isValidCondition(model.condition)) {
            errors.push('Condição inválida');
        }
        
        if (model.isbn && model.isbn.trim().length > 0 && !this.isValidISBN(model.isbn)) { // Verifica se não está vazio antes de validar
            errors.push('ISBN inválido');
        }
        
        if (model.exchange_available !== undefined && typeof model.exchange_available !== 'boolean') {
            errors.push('exchange_available deve ser boolean');
        }
        
        if (model.loan_available !== undefined && typeof model.loan_available !== 'boolean') {
            errors.push('loan_available deve ser boolean');
        }
        
        return errors;
    }
    
    // Validar condição do livro
    static isValidCondition(condition) {
        const validConditions = ['novo', 'usado - bom', 'usado - razoável', 'usado - ruim'];
        return validConditions.includes(condition);
    }
    
    // Validar ISBN (formato básico)
    static isValidISBN(isbn) {
        const cleanISBN = isbn.replace(/[-\s]/g, '');
        return /^(\d{9}X|\d{10}|\d{13})$/.test(cleanISBN);
    }
    
    // Preparar dados para inserção/atualização
    static prepareBookData(data, owner_id) {
        return {
            title: data.title?.trim(),
            author: data.author?.trim(),
            publication_year: data.year || null, 
            main_genre: data.genre?.trim() || null,
            cover_image_url: data.img?.trim() || 'em desenvolvimento', // Pode querer um placeholder melhor
            publisher: data.publisher?.trim() || null,
            isbn: data.isbn?.trim() || null,
            description: data.description?.trim() || null,
            condition: data.condition,
            exchange_available: Boolean(data.exchange_available),
            loan_available: Boolean(data.loan_available),
            available: data.available !== undefined ? Boolean(data.available) : true, // Default true
            owner_id: owner_id
        };
    }

    // --- MÉTODO NOVO ADICIONADO ---
    // NOVO: Atalho para chamar a atualização de disponibilidade no DB
    static updateAvailability(model) {
        // Simplesmente repassa a chamada para o BookDb
        return BookDb.updateAvailability(model);
    }
    // --- FIM DO MÉTODO NOVO ---
}

module.exports = Book;