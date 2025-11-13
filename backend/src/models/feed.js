const FeedDb = require('../db/feedDb');

class Feed {
    // Criar um novo post
    static async createPost(model) {
        if (!model.content || model.content.trim() === '') {
            throw new Error('O conteúdo do post não pode ser vazio.');
        }
        if (model.post_type && !['oferta_troca', 'pedido_livro', 'geral'].includes(model.post_type)) {
            throw new Error('Tipo de post inválido.');
        }
        return FeedDb.insertPost(model);
    }

    // Obter todos os posts
    static async getAllPosts() {
        return FeedDb.getAll();
    }

    // Obter um post por ID
    static async getPostById(post_id) {
        return FeedDb.getById({ post_id });
    }

    // Atualizar um post
    static async updatePost(user_id, post_id, updateData) {
        const isOwner = await FeedDb.checkPostOwnership({ user_id, post_id });
        if (!isOwner) {
            throw new Error('Você não tem permissão para editar este post.');
        }

        const model = { ...updateData, post_id, user_id };
        return FeedDb.updatePost(model);
    }

    // Deletar um post
    static async deletePost(user_id, post_id) {
        const isOwner = await FeedDb.checkPostOwnership({ user_id, post_id });
        if (!isOwner) {
            throw new Error('Você não tem permissão para deletar este post.');
        }
        return FeedDb.deletePost({ user_id, post_id });
    }

    // Curtir ou descurtir um post
    static async toggleLike(post_id, user_id) {
        const model = { post_id, user_id };
        const alreadyLiked = await FeedDb.hasLiked(model);
        if (alreadyLiked) {
        await FeedDb.deleteLike(model);
        return { action: 'unliked', liked: false };
        } else {
        await FeedDb.insertLike(model);
        return { action: 'liked', liked: true };
    }
}

    // Adicionar um comentário
    static async addComment(post_id, user_id, content) {
        if (!content || content.trim() === '') {
        throw new Error('O conteúdo do comentário não pode ser vazio.');
    }
        const model = { post_id, user_id, content };
        return FeedDb.insertComment(model);
}

    // Obter comentários de um post
    static async getComments(post_id) {
        return FeedDb.getCommentsByPostId({ post_id });
    }
}

module.exports = Feed;