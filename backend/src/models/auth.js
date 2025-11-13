const AuthDb = require('../db/authDb');
const bcrypt = require('bcryptjs');

class Auth {

    // Registrar novo usuário
    static register(model) {
        return AuthDb.insert(model);
    }

    // Buscar usuário por email (para o login do controller)
    static findByEmail(model) {
        return AuthDb.findByEmail(model);
    }

    // Buscar usuário por email ou username (para login)
    static findByLogin(login) {
        return AuthDb.findByEmailOrUsername({ login });
    }

    // Buscar usuário por ID
    static findById(model) {
        return AuthDb.findById(model);
    }

    // Verificar se usuário já existe (email ou username)
    static checkExisting(model) {
        return AuthDb.checkExisting(model);
    }

    // Validar dados de registro
    static validateRegisterData(model) {
        const errors = [];

        if (!model.username || model.username.trim().length < 4) {
            errors.push('Username deve ter pelo menos 4 caracteres');
        }

        if (!model.email || !this.isValidEmail(model.email)) {
            errors.push('Email inválido');
        }

        if (!model.password || model.password.length < 8 ||
            !/[A-Z]/.test(model.password) ||
            !/[0-9]/.test(model.password) ||
            !/[^a-zA-Z0-9\s]/.test(model.password)) {
            errors.push('Senha deve ter pelo menos 8 caracteres, uma letra maiúscula, um número e um caractere especial');
        }

        return errors;
    }

    // Validar dados de login
    static validateLoginData(model) {
        const errors = [];

        if (!model.login || model.login.trim().length < 3) {
            errors.push('Login inválido (username ou email)');
        }

        if (!model.password) {
            errors.push('Senha é obrigatória');
        }

        return errors;
    }

    // Validar email
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validar atualização de perfil
    static validateProfileUpdateData(model) {
        const errors = [];
        if (model.full_name && model.full_name.length > 255) errors.push('Nome completo muito longo');
        if (model.bio && model.bio.length > 1000) errors.push('Biografia muito longa');
        if (model.city && model.city.length > 100) errors.push('Cidade muito longa');
        if (model.state && model.state.length > 100) errors.push('Estado muito longo');

        // Avatar agora só precisa ser uma string (nome do arquivo)
        if (model.avatar && typeof model.avatar !== 'string') {
            errors.push('Avatar inválido');
        }

        return errors;
    }

    static async updateProfile(user_id, updateData) {
        const model = { ...updateData, user_id };
        const validationErrors = Auth.validateProfileUpdateData(model);
        if (validationErrors.length > 0) throw new Error(validationErrors.join(', '));
        return AuthDb.updateProfile(model);
    }

    static validatePasswordUpdateData(model) {
        const errors = [];
        if (!model.old_password) errors.push('Senha antiga é obrigatória.');
        if (!model.new_password) errors.push('Nova senha é obrigatória.');
        else if (model.new_password.length < 8 ||
                 !/[A-Z]/.test(model.new_password) ||
                 !/[0-9]/.test(model.new_password) ||
                 !/[^a-zA-Z0-9\s]/.test(model.new_password)) {
            errors.push('Nova senha deve ter pelo menos 8 caracteres, uma letra maiúscula, um número e um caractere especial.');
        }
        if (model.old_password === model.new_password) errors.push('A nova senha não pode ser igual à senha antiga.');
        return errors;
    }

    static async changePassword(user_id, oldPassword, newPassword) {
        const validationErrors = Auth.validatePasswordUpdateData({ old_password: oldPassword, new_password: newPassword });
        if (validationErrors.length > 0) throw new Error(validationErrors.join(', '));

        const user = await AuthDb.findById({ user_id });
        if (!user) throw new Error('Usuário não encontrado.');

        const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isOldPasswordValid) throw new Error('Senha antiga incorreta.');

        const newHashedPassword = await bcrypt.hash(newPassword, 10);
        return AuthDb.updatePassword({ user_id, new_hashed_password: newHashedPassword });
    }

    static async deleteAccount(user_id, password) {
        if (!password) throw new Error('A senha é necessária para confirmar a exclusão da conta.');

        const user = await AuthDb.findById({ user_id });
        if (!user) throw new Error('Usuário não encontrado.');

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) throw new Error('Senha incorreta.');

        return AuthDb.deleteUser({ user_id });
    }
}

module.exports = Auth;
