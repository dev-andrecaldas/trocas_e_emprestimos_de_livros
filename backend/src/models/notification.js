const NotificationDb = require('../db/notificationDb');

class Notification {
    constructor(notification_id, user_id, type, title, message, related_id, created_at, updated_at, read) {
        this.notification_id = notification_id;
        this.user_id = user_id;
        this.type = type;
        this.title = title;
        this.message = message;
        this.related_id = related_id;
        this.created_at = created_at;
        this.updated_at = updated_at;
        this.read = read;
    }

    // 🔹 Criar nova notificação
    static async create(user_id, type, title, message, related_id) {
        const model = { user_id, type, title, message, related_id };
        return NotificationDb.insert(model);
    }

    // 🔹 Buscar todas notificações de um usuário
    static async findByUser(user_id) {
        return NotificationDb.findByUser(user_id);
    }

    // 🔹 Marcar notificação como lida
    static async markAsRead(notification_id, user_id) {
        return NotificationDb.markAsRead(notification_id, user_id);
    }
}

module.exports = Notification;
