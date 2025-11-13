const PreferenceDb = require('../db/preferenceDb');

class Preference {
    // Adicionar uma nova preferência para um usuário
    static async addPreference(model) {
        const { user_id, type_name, preference_value } = model;

        // 1. Obter o type_id pelo nome
        const typeResult = await PreferenceDb.getTypeId({ type_name });
        if (!typeResult) {
            throw new Error('Tipo de preferência não encontrado.');
        }
        const type_id = typeResult.type_id;

        // 2. Inserir a preferência na base de dados
        return PreferenceDb.insertUserPreference({ user_id, type_id, preference_value });
    }

    // Obter todas as preferências de um usuário
    static async getPreferences(user_id) {
        return PreferenceDb.getByUser({ user_id });
    }

    // Deletar uma preferência
    static async deletePreference(user_id, user_pref_id) {
        return PreferenceDb.deletePreference({ user_id, user_pref_id });
 
    }
}

module.exports = Preference;