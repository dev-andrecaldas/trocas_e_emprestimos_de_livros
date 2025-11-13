const { validationResult } = require('express-validator');
const Transaction = require('../models/transaction');
const Notification = require('../models/notification');
const Book = require('../models/book'); // Garanta que está importado

class TransactionController {
    
    // 🔹 Criar transação (Como estava antes, com suas regras)
    static async createTransaction(req, res) {
        try {
            const validationErrors = Transaction.validateTransactionData(req.body);
            if (validationErrors.length > 0) {
                return res.status(400).json({ errors: validationErrors });
            }

            const userId = req.user.user_id; 
            const { book_id, transaction_type, offered_book_id } = req.body;

            const targetBook = await Book.selectById({ book_id: parseInt(book_id) });
            if (!targetBook) return res.status(404).json({ message: 'Livro desejado não encontrado.' });
            if (targetBook.owner_id === userId) return res.status(400).json({ message: 'Você não pode solicitar seu próprio livro.' });

            if (transaction_type === 'troca') {
                const activeTrade = await Transaction.findActiveTradeByUser({ user_id: userId });
                if (activeTrade) return res.status(403).json({ message: "Você já possui uma troca em andamento. Finalize-a antes de iniciar uma nova." });
                if (!offered_book_id) return res.status(400).json({ message: 'Para trocas, é necessário informar o livro oferecido.' });
                
                // Validação extra: O livro oferecido existe e pertence ao solicitante?
                const offeredBook = await Book.selectById({ book_id: parseInt(offered_book_id) });
                if (!offeredBook) return res.status(404).json({ message: 'Livro oferecido não encontrado.' });
                if (offeredBook.owner_id !== userId) return res.status(403).json({ message: 'Você não é o dono do livro que está oferecendo.' });
                 if (!offeredBook.available) return res.status(400).json({ message: 'O livro oferecido não está disponível para troca.' });
                 if (offeredBook.book_id === targetBook.book_id) return res.status(400).json({ message: 'Não pode oferecer o mesmo livro que está solicitando.' });
            }

             if (!targetBook.available) return res.status(400).json({ message: 'O livro solicitado não está disponível no momento.' });

            const transactionData = Transaction.prepareTransactionData(req.body, userId, targetBook.owner_id);
            const newTransaction = await Transaction.insert(transactionData);

            let notificationMessage = '';
            if (transaction_type === 'emprestimo') {
                notificationMessage = `O usuário ${req.user.username} solicitou o empréstimo do seu livro: "${targetBook.title}".`;
            } else if (transaction_type === 'troca') {
                const offeredBook = await Book.selectById({ book_id: parseInt(offered_book_id) }); // Já validamos que existe
                notificationMessage = `O usuário ${req.user.username} quer trocar o livro "${offeredBook.title}" pelo seu livro: "${targetBook.title}".`;
            }

            await Notification.create(
                targetBook.owner_id,
                'transaction_request',
                'Nova solicitação de livro',
                notificationMessage,
                newTransaction.transaction_id
            );

            res.status(201).json(newTransaction);
        } catch (error) {
            console.error('Erro ao criar transação:', error);
            res.status(500).json({ message: 'Erro interno do servidor.' });
        }
    }

    // 🔹 Listar transações (Como estava antes, com filtro de status)
    static async getUserTransactions(req, res) {
        try {
            const userId = req.user.user_id; 
            const status = req.query.status; 

            let transactions;
            if (status) {
                transactions = await Transaction.selectByStatus({ user_id: userId, status: status });
            } else {
                transactions = await Transaction.selectByUser({ user_id: userId });
            }
            
            res.status(200).json(transactions);
        } catch (error) {
            console.error('Erro ao buscar transações:', error);
            res.status(500).json({ message: 'Erro interno do servidor.' });
        }
    }

    // 🔹 Aceitar transação (MODIFICADO - Chama Book.updateAvailability)
    static async acceptTransaction(req, res) {
        try {
            const userId = req.user.user_id;
            const { id } = req.params;
            const transaction_id = parseInt(id);

            const transaction = await Transaction.selectById({ transaction_id });
            if (!transaction) return res.status(404).json({ message: 'Transação não encontrada.' });

            if (!Transaction.canModifyTransaction(transaction, userId)) {
                return res.status(403).json({ message: 'Você não tem permissão para aceitar esta transação.' });
            }

            // --- LÓGICA DE DISPONIBILIDADE (INÍCIO) ---
            await Book.updateAvailability({ book_id: transaction.book_id, available: false });
            if (transaction.transaction_type === 'troca' && transaction.offered_book_id) {
                await Book.updateAvailability({ book_id: transaction.offered_book_id, available: false });
            }
            // --- LÓGICA DE DISPONIBILIDADE (FIM) ---

            const updatedTransaction = await Transaction.updateStatus({
                transaction_id: transaction_id,
                status: 'aceito',
                owner_id: userId
            });

            await Notification.create(
                transaction.requester_id,
                'transaction_accepted', 'Solicitação aceita',
                `Sua solicitação pelo livro "${transaction.book_title || 'livro'}" foi aceita!`,
                transaction.transaction_id
            );

            res.status(200).json(updatedTransaction);
        } catch (error) {
            console.error('Erro ao aceitar transação:', error);
            // Rollback (desfazer) da disponibilidade seria ideal aqui, mas é complexo
            res.status(500).json({ message: 'Erro interno do servidor.' });
        }
    }

    // 🔹 Recusar transação (MODIFICADO - Chama Book.updateAvailability)
    static async rejectTransaction(req, res) {
        try {
            const userId = req.user.user_id;
            const { id } = req.params;
            const transaction_id = parseInt(id);

            const transaction = await Transaction.selectById({ transaction_id });
            if (!transaction) return res.status(404).json({ message: 'Transação não encontrada.' });
            
            if (!Transaction.canModifyTransaction(transaction, userId)) {
                return res.status(403).json({ message: 'Você não tem permissão para recusar esta transação.' });
            }
            
            // --- LÓGICA DE DISPONIBILIDADE (INÍCIO) ---
            // Só libera os livros se o status atual NÃO for 'recusado' ou 'cancelado' (evita liberar duas vezes)
            if (transaction.status !== 'recusado' && transaction.status !== 'cancelado') {
                await Book.updateAvailability({ book_id: transaction.book_id, available: true });
                if (transaction.transaction_type === 'troca' && transaction.offered_book_id) {
                    await Book.updateAvailability({ book_id: transaction.offered_book_id, available: true });
                }
            }
            // --- LÓGICA DE DISPONIBILIDADE (FIM) ---

            const updatedTransaction = await Transaction.updateStatus({
                transaction_id: transaction_id,
                status: 'recusado',
                owner_id: userId
            });

            await Notification.create(
                transaction.requester_id,
                'transaction_rejected', 'Solicitação recusada',
                `Sua solicitação pelo livro "${transaction.book_title || 'livro'}" foi recusada.`,
                transaction.transaction_id
            );

            res.status(200).json(updatedTransaction);
        } catch (error) {
            console.error('Erro ao recusar transação:', error);
            res.status(500).json({ message: 'Erro interno do servidor.' });
        }
    }

    // 🔹 Cancelar transação (MODIFICADO - Chama Book.updateAvailability)
    static async cancelTransaction(req, res) {
        try {
            const userId = req.user.user_id;
            const { id } = req.params;
            const transaction_id = parseInt(id);

            const transaction = await Transaction.selectById({ transaction_id });
            if (!transaction) return res.status(404).json({ message: 'Transação não encontrada.' });

            if (!Transaction.canCancelTransaction(transaction, userId)) {
                return res.status(403).json({ message: 'Você não pode cancelar esta transação.' });
            }

            // --- LÓGICA DE DISPONIBILIDADE (INÍCIO) ---
            // Só libera os livros se a transação já tinha sido ACEITA
            if (transaction.status === 'aceito') {
                await Book.updateAvailability({ book_id: transaction.book_id, available: true });
                if (transaction.transaction_type === 'troca' && transaction.offered_book_id) {
                    await Book.updateAvailability({ book_id: transaction.offered_book_id, available: true });
                }
            }
            // --- LÓGICA DE DISPONIBILIDADE (FIM) ---

            // Você pode querer ATUALIZAR para status 'cancelado' em vez de DELETAR
            // await Transaction.updateStatus({ transaction_id: transaction_id, status: 'cancelado', owner_id: ??? }); // Precisaria ajustar updateStatus
            await Transaction.delete({ transaction_id: transaction_id, requester_id: userId });

            await Notification.create(
                transaction.owner_id,
                'transaction_canceled', 'Solicitação cancelada',
                `O usuário ${req.user.username || 'solicitante'} cancelou a solicitação do livro "${transaction.book_title || 'livro'}".`,
                transaction.transaction_id
            );

            res.status(200).json({ message: 'Transação cancelada com sucesso.' });
        } catch (error) {
            console.error('Erro ao cancelar transação:', error);
            res.status(500).json({ message: 'Erro interno do servidor.' });
        }
    }
    
    // 🔹 Confirmar Recebimento (MODIFICADO - Com Logs de Debug)
    static async confirmReceipt(req, res) {
        try {
            const userId = req.user.user_id;
            const { id } = req.params;
            const transaction_id = parseInt(id);

            console.log(`// <<< DEBUG >>> Usuário ${userId} confirmando recebimento para TX ${transaction_id}`); // <<< DEBUG >>>

            const transaction = await Transaction.selectById({ transaction_id });
            // ... (validações) ...
             if (!transaction) return res.status(404).json({ message: 'Transação não encontrada.' });
             if (transaction.status !== 'aceito') return res.status(400).json({ message: 'Esta transação não está aguardando confirmação.' });
            
             let userRole = (transaction.requester_id === userId) ? 'requester' : (transaction.owner_id === userId) ? 'owner' : null;
             if (!userRole) return res.status(403).json({ message: 'Você não faz parte desta transação.' });

             // Evita confirmar duas vezes
             if ((userRole === 'requester' && transaction.requester_confirmed_receipt) || (userRole === 'owner' && transaction.owner_confirmed_receipt)) {
                  return res.status(400).json({ message: 'Você já confirmou o recebimento para esta transação.' });
             }

            // 1. Atualiza o status de recebimento (e o due_date para empréstimo)
            const updatedTransaction = await Transaction.confirmReceipt({
                transaction_id: transaction_id,
                user_id: userId,
                user_role: userRole,
                transaction_type: transaction.transaction_type
            });

            console.log(`// <<< DEBUG >>> Resultado após confirmReceipt DB Call:`, updatedTransaction); // <<< DEBUG >>>
            
            let finalTransactionState = updatedTransaction; 

             // Verifica se updatedTransaction não é nulo antes de prosseguir
            if (!updatedTransaction) {
                 console.error(`// <<< DEBUG >>> ERRO GRAVE: updatedTransaction veio nulo/undefined após confirmReceipt DB Call para TX ${transaction_id}`);
                 // Retorna o estado ANTES da tentativa de confirmação, ou um erro?
                 // Retornar um erro é mais seguro para indicar que algo falhou.
                  return res.status(500).json({ message: 'Erro ao registrar confirmação no banco de dados.' });
            }

            // 2. Verifica se a TROCA foi concluída (ambos confirmaram)
            if (updatedTransaction.transaction_type === 'troca') { 
                console.log(`// <<< DEBUG >>> É uma troca. Verificando se pode completar...`); 
                const completedTx = await Transaction.checkAndCompleteTransaction({ transaction_id: transaction_id });
                
                console.log(`// <<< DEBUG >>> Resultado de checkAndCompleteTransaction:`, completedTx); 

                if(completedTx) { 
                    console.log(`// <<< DEBUG >>> Troca COMPLETADA! Status agora é concluido.`); 
                    finalTransactionState = completedTx; 
                    await Notification.create(updatedTransaction.requester_id, 'transaction_completed', 'Troca Concluída', `A troca do livro "${updatedTransaction.book_title}" foi finalizada.`);
                    await Notification.create(updatedTransaction.owner_id, 'transaction_completed', 'Troca Concluída', `A troca do livro "${updatedTransaction.book_title}" foi finalizada.`);
                } else {
                    console.log(`// <<< DEBUG >>> Troca AINDA NÃO completa. Notificando outra parte.`); 
                     // Notifica a outra parte que você confirmou
                    const otherPartyId = (userRole === 'requester') ? updatedTransaction.owner_id : updatedTransaction.requester_id;
                    await Notification.create(otherPartyId, 'transaction_update', 'Confirmação Recebida', `O outro usuário confirmou o recebimento do livro "${updatedTransaction.book_title}". Aguardando sua confirmação.`);
                }
            }
            
            // 3. Verifica se o EMPRÉSTIMO foi concluído (dono confirmou devolução)
             else if (updatedTransaction.transaction_type === 'emprestimo' && userRole === 'owner') { 
                 console.log(`// <<< DEBUG >>> É um empréstimo e o dono confirmou. Completando...`); 
                 try {
                     // Tenta atualizar o status para 'concluido'
                     // Idealmente, updateStatus deveria permitir isso sem checar owner_id rigidamente para 'concluido'
                     // Ou teríamos uma função 'completeTransaction'
                     const completedTx = await Transaction.updateStatus({ 
                        transaction_id: transaction_id, 
                        status: 'concluido',
                        // Passando o owner_id real para a checagem no DB (se houver)
                        owner_id: transaction.owner_id 
                     });

                     console.log(`// <<< DEBUG >>> Resultado de updateStatus para concluir empréstimo:`, completedTx); 

                     if (completedTx) {
                        finalTransactionState = completedTx; 
                        await Book.updateAvailability({ book_id: completedTx.book_id, available: true });
                        await Notification.create(updatedTransaction.requester_id, 'transaction_completed', 'Empréstimo Concluído', `O empréstimo do livro "${updatedTransaction.book_title}" foi finalizado.`);
                     } else {
                         console.error(`// <<< DEBUG >>> FALHA ao tentar completar empréstimo ${transaction_id} com updateStatus. A query updateStatus pode exigir status='pendente'?`);
                         // A transação permanece 'aceita' com owner_confirmed_receipt=true
                     }
                 } catch (updateError) {
                      console.error(`// <<< DEBUG >>> ERRO ao tentar completar empréstimo ${transaction_id} com updateStatus:`, updateError);
                      // A transação permanece 'aceita' com owner_confirmed_receipt=true
                 }

            } else if (updatedTransaction.transaction_type === 'emprestimo' && userRole === 'requester') { 
                 console.log(`// <<< DEBUG >>> É um empréstimo e o solicitante confirmou. Notificando dono.`); 
                 await Notification.create(updatedTransaction.owner_id, 'transaction_update', 'Livro Recebido (Empréstimo)', `O solicitante confirmou o recebimento do livro "${updatedTransaction.book_title}". O prazo de devolução é ${new Date(updatedTransaction.due_date).toLocaleDateString('pt-BR')}.`);
            } 


            res.status(200).json({ message: 'Recebimento confirmado com sucesso.', data: finalTransactionState });

        } catch (error) {
            console.error('Erro GERAL ao confirmar recebimento:', error); // <<< DEBUG >>>
            res.status(500).json({ message: 'Erro interno do servidor.' });
        }
    }
}

module.exports = TransactionController;