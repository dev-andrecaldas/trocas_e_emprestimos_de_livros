const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const TransactionController = require('../controllers/transactionController');

// 🔐 Todas as rotas exigem autenticação
router.use(authenticateToken);

// 📦 Criar uma nova transação (solicitação de livro)
router.post('/', TransactionController.createTransaction);

// 📋 Listar todas as transações do usuário logado
router.get('/', TransactionController.getUserTransactions);

// ✅ Aceitar uma transação
router.put('/:id/accept', TransactionController.acceptTransaction);

// ❌ Recusar uma transação
router.put('/:id/reject', TransactionController.rejectTransaction);

// 🔄 Cancelar uma transação
router.delete('/:id/cancel', TransactionController.cancelTransaction);

// 🏁 NOVO: Confirmar o recebimento de um livro
router.put('/:id/confirm-receipt', TransactionController.confirmReceipt);

module.exports = router;