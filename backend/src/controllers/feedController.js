const Feed = require('../models/feed');

// Criar um novo post no feed
exports.createPost = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const { content, post_type, related_book_id } = req.body;

        const postData = { user_id, content, post_type, related_book_id };
        const newPost = await Feed.createPost(postData);

        res.status(201).json({
            message: 'Post criado com sucesso.',
            data: newPost
        });
    } catch (error) {
        console.error('Erro ao criar post:', error.stack);
        res.status(500).json({ error: error.message || 'Erro interno do servidor ao criar post.' });
    }
};

// Obter todos os posts do feed
exports.getAllPosts = async (req, res) => {
    try {
        const posts = await Feed.getAllPosts();
        res.status(200).json({
            message: 'Posts obtidos com sucesso.',
            data: posts
        });
    } catch (error) {
        console.error('Erro ao obter posts:', error.stack);
        res.status(500).json({ error: 'Erro interno do servidor ao obter posts.' });
    }
};

// Obter um post por ID
exports.getPostById = async (req, res) => {
    try {
        const post_id = parseInt(req.params.id);
        if (isNaN(post_id)) {
            return res.status(400).json({ error: 'ID do post inválido.' });
        }
        const post = await Feed.getPostById(post_id);
        if (!post) {
            return res.status(404).json({ error: 'Post não encontrado.' });
        }
        res.status(200).json({
            message: 'Post obtido com sucesso.',
            data: post
        });
    } catch (error) {
        console.error('Erro ao obter post:', error.stack);
        res.status(500).json({ error: 'Erro interno do servidor ao obter post.' });
    }
};

// Atualizar um post
exports.updatePost = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const post_id = parseInt(req.params.id);
        if (isNaN(post_id)) {
            return res.status(400).json({ error: 'ID do post inválido.' });
        }
        const updateData = req.body;
        const updatedPost = await Feed.updatePost(user_id, post_id, updateData);
        if (!updatedPost) {
            return res.status(404).json({ error: 'Post não encontrado ou não atualizado.' });
        }
        res.status(200).json({
            message: 'Post atualizado com sucesso.',
            data: updatedPost
        });
    } catch (error) {
        console.error('Erro ao atualizar post:', error.stack);
        res.status(500).json({ error: error.message || 'Erro interno do servidor ao atualizar post.' });
    }
};

// Deletar um post
exports.deletePost = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const post_id = parseInt(req.params.id);
        if (isNaN(post_id)) {
            return res.status(400).json({ error: 'ID do post inválido.' });
        }
        const deleted = await Feed.deletePost(user_id, post_id);
        if (!deleted) {
            return res.status(404).json({ error: 'Post não encontrado ou não deletado.' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Erro ao deletar post:', error.stack);
        res.status(500).json({ error: error.message || 'Erro interno do servidor ao deletar post.' });
    }
};

// Curtir ou descurtir um post
exports.toggleLike = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const post_id = parseInt(req.params.id);
        if (isNaN(post_id)) {
            return res.status(400).json({ error: 'ID do post inválido.' });
        }
        const result = await Feed.toggleLike(post_id, user_id);
        res.status(200).json({ message: `Post ${result.action} com sucesso.`, data: result });
    } catch (error) {
        console.error('Erro ao curtir/descurtir post:', error.stack);
        res.status(500).json({ error: 'Erro interno do servidor ao curtir/descurtir post.' });
    }
};

// Adicionar um comentário
exports.addComment = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const post_id = parseInt(req.params.id);
        if (isNaN(post_id)) {
            return res.status(400).json({ error: 'ID do post inválido.' });
        }
        const { content } = req.body;
        const newComment = await Feed.addComment(post_id, user_id, content);
        res.status(201).json({ message: 'Comentário adicionado com sucesso.', data: newComment });
    } catch (error) {
        console.error('Erro ao adicionar comentário:', error.stack);
        res.status(500).json({ error: error.message || 'Erro interno do servidor ao adicionar comentário.' });
    }
};

// Listar comentários de um post
exports.getComments = async (req, res) => {
    try {
        const post_id = parseInt(req.params.id);
        if (isNaN(post_id)) {
            return res.status(400).json({ error: 'ID do post inválido.' });
        }
        const comments = await Feed.getComments(post_id);
        res.status(200).json({ message: 'Comentários obtidos com sucesso.', data: comments });
    } catch (error) {
        console.error('Erro ao listar comentários:', error.stack);
        res.status(500).json({ error: 'Erro interno do servidor ao listar comentários.' });
    }
};