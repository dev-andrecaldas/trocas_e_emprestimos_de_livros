const Message = require('../models/message');

// Enviar uma nova mensagem
exports.sendMessage = async (req, res) => {
    try {
        const sender_id = req.user.user_id;
        const { receiver_id, content, transaction_id } = req.body;

        const messageData = { sender_id, receiver_id, content, transaction_id };

        const newMessage = await Message.sendMessage(messageData);

        res.status(201).json({
            message: 'Mensagem enviada com sucesso',
            data: newMessage
        });

    } catch (error) {
        console.error('Erro ao enviar mensagem:', error.stack);
        res.status(500).json({ error: 'Erro interno do servidor ao enviar mensagem.' });
    }
};

// Buscar a conversa entre dois usuários
exports.getConversation = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const receiver_id = parseInt(req.params.receiverId);

        if (isNaN(receiver_id)) {
            return res.status(400).json({ error: 'ID do destinatário inválido.' });
        }

        const conversation = await Message.getConversation({ user_id, receiver_id });

        res.status(200).json({
            message: 'Conversa obtida com sucesso',
            data: conversation
        });

    } catch (error) {
        console.error('Erro ao buscar conversa:', error.stack);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar conversa.' });
    }
};

// Deletar uma mensagem
exports.deleteMessage = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const message_id = parseInt(req.params.id);
        if (isNaN(message_id)) {
            return res.status(400).json({ error: 'ID da mensagem inválido.' });
        }
        const deleted = await Message.deleteMessage(user_id, message_id);
        if (!deleted) {
            return res.status(404).json({ error: 'Mensagem não encontrada ou você não tem permissão para apagá-la.' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Erro ao deletar mensagem:', error.stack);
        res.status(500).json({ error: error.message || 'Erro interno do servidor ao deletar mensagem.' });
    }
};