const Preference = require('../models/preference');

// Adicionar uma nova preferência para o usuário logado
exports.addPreference = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const { type_name, preference_value } = req.body;

        const preferenceData = { user_id, type_name, preference_value };
        const newPreference = await Preference.addPreference(preferenceData);

        res.status(201).json({
            message: 'Preferência adicionada com sucesso.',
            data: newPreference
        });

    } catch (error) {
        console.error('Erro ao adicionar preferência:', error.stack);
        res.status(500).json({ error: 'Erro interno do servidor ao adicionar preferência.' });
    }
};

// Obter todas as preferências do usuário logado
exports.getPreferences = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const preferences = await Preference.getPreferences(user_id);

        res.status(200).json({
            message: 'Preferências obtidas com sucesso.',
            data: preferences
        });

    } catch (error) {
        console.error('Erro ao buscar preferências:', error.stack);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar preferências.' });
    }
};

// Deletar uma preferência
exports.deletePreference = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const user_pref_id = parseInt(req.params.id);
        if (isNaN(user_pref_id)) {
            return res.status(400).json({ error: 'ID da preferência inválido.' });
        }
        const deleted = await Preference.deletePreference(user_id, user_pref_id);
        if (!deleted) {
            return res.status(404).json({ error: 'Preferência não encontrada ou você não tem permissão para apagá-la.' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Erro ao deletar preferência:', error.stack);
        res.status(500).json({ error: 'Erro interno do servidor ao deletar preferência.' });
    }
};