const TransactionDb = require('../db/transactionDb');

class Transaction {
    
    // Criar nova transação
    static insert(model) {
        return TransactionDb.insert(model);
    }
    
    // Buscar transações do usuário
    static selectByUser(model) {
        return TransactionDb.selectByUser(model);
    }
    
    // Buscar transação por ID
    static selectById(model) {
        return TransactionDb.selectById(model);
    }
    
    // Atualizar status da transação
    static updateStatus(model) {
        return TransactionDb.updateStatus(model);
    }
    
    // Verificar transação
    static checkTransaction(model) {
        return TransactionDb.checkTransaction(model);
    }
    
    // Verificar se já existe solicitação pendente
    static checkExistingRequest(model) {
        return TransactionDb.checkExistingRequest(model);
    }
    
    // Buscar transações por status
    static selectByStatus(model) {
        return TransactionDb.selectByStatus(model);
    }
    
    // Deletar transação (cancelar)
    static delete(model) {
        return TransactionDb.delete(model);
    }

    // --- MÉTODOS NOVOS ADICIONADOS ---

    // NOVO: Verificar se o usuário tem uma troca ativa (para a "Trava")
    static findActiveTradeByUser(model) {
        return TransactionDb.findActiveTradeByUser(model);
    }
    
    // NOVO: Confirmar o recebimento de um livro
    static confirmReceipt(model) {
        return TransactionDb.confirmReceipt(model);
    }
    
    // NOVO: Checar se a transação está completa (ambos confirmaram)
    static checkAndCompleteTransaction(model) {
        return TransactionDb.checkAndCompleteTransaction(model);
    }

    // --- FIM DOS MÉTODOS NOVOS ---
    
    // Validar dados da transação
    static validateTransactionData(model) {
        const errors = [];
        
        if (!model.book_id || isNaN(model.book_id)) {
            errors.push('ID do livro é obrigatório e deve ser um número');
        }
        
        if (!model.transaction_type || !this.isValidTransactionType(model.transaction_type)) {
            errors.push('Tipo de transação inválido');
        }
        
        // Esta validação agora é feita no Controller, pois a "trava" é mais importante
        // if (model.transaction_type === 'troca' && (!model.offered_book_id || isNaN(model.offered_book_id))) {
        //     errors.push('Para trocas, é necessário informar o livro oferecido');
        // }
        
        if (model.request_message && model.request_message.length > 500) {
            errors.push('Mensagem de solicitação muito longa (máximo 500 caracteres)');
        }
        
        return errors;
    }
    
    // Validar tipo de transação
    static isValidTransactionType(type) {
        const validTypes = ['troca', 'emprestimo'];
        return validTypes.includes(type);
    }
    
    // Validar status da transação
    static isValidStatus(status) {
        const validStatuses = ['pendente', 'aceito', 'recusado', 'concluido', 'cancelado'];
        return validStatuses.includes(status);
    }
    
    // Preparar dados para inserção
    static prepareTransactionData(data, requester_id, owner_id) {
        return {
            book_id: parseInt(data.book_id),
            requester_id: requester_id,
            owner_id: owner_id,
            offered_book_id: data.offered_book_id ? parseInt(data.offered_book_id) : null,
            transaction_type: data.transaction_type,
            request_message: data.request_message?.trim() || null
        };
    }
    
    // Verificar se usuário pode aceitar/recusar transação
    static canModifyTransaction(transaction, user_id) {
        return transaction && transaction.owner_id === user_id && transaction.status === 'pendente';
    }
    
    // Verificar se usuário pode cancelar transação
    static canCancelTransaction(transaction, user_id) {
        return transaction && transaction.requester_id === user_id && transaction.status === 'pendente';
    }
    
    // Obter próximos status possíveis
    static getNextStatuses(currentStatus, userRole) {
        const statusMap = {
            'pendente': {
                'owner': ['aceito', 'recusado'],
                'requester': ['cancelado']
            },
            'aceito': {
                // Modificado para suportar confirmação
                'owner': ['confirmar_recebimento'],
                'requester': ['confirmar_recebimento']
            }
        };
        
        return statusMap[currentStatus]?.[userRole] || [];
    }
}

module.exports = Transaction;