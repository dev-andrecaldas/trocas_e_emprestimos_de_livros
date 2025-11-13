const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Auth = require('../models/auth'); // Importa a classe Auth do seu modelo

// 1. Função de Registro (Sem alterações)
exports.register = async (req, res) => {
    try {
        const { username, email, password, full_name } = req.body;
        const userData = { username, email, password, full_name };

        const validationErrors = Auth.validateRegisterData(userData);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                error: 'Dados inválidos',
                details: validationErrors
            });
        }

        const existingUsers = await Auth.checkExisting({ email, username });
        if (existingUsers.length > 0) {
            return res.status(409).json({
                error: 'Email ou nome de usuário já cadastrado'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        userData.password = hashedPassword;

        const newUser = await Auth.register(userData);

        const token = jwt.sign(
            { user_id: newUser.user_id, username: newUser.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Usuário criado com sucesso',
            user: newUser,
            token
        });

    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// 2. Função de Login (CORRIGIDA)
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: 'Dados inválidos',
                details: ['Email e senha são obrigatórios.']
            });
        }

        const user = await Auth.findByEmail({ email });
        
        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        
        const token = jwt.sign(
            { user_id: user.user_id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // --- [INÍCIO DA CORREÇÃO] ---
        // O frontend precisa do objeto 'user' no login.
        // Criamos um objeto limpo, sem a senha, assim como você faz no getProfile.
        const userForFrontend = {
            user_id: user.user_id,
            username: user.username,
            email: user.email,
            full_name: user.full_name
            // Adicione outros campos se o frontend precisar (ex: avatar)
        };

        res.json({
            message: 'Login realizado com sucesso',
            token: token,
            user: userForFrontend // <-- Objeto 'user' ADICIONADO AQUI
        });
        // --- [FIM DA CORREÇÃO] ---

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// 3. Função para obter perfil do usuário logado (Sem alterações)
exports.getProfile = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const user = await Auth.findById({ user_id });

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const userProfile = {
            user_id: user.user_id,
            username: user.username,
            email: user.email,
            full_name: user.full_name,
            avatar: user.profile_picture_url, 
            bio: user.bio,
            city: user.city,
            state: user.state,
            preferences: user.preferences || [], 
            books: user.books || [] 
        };
        
        res.json(userProfile);

    } catch (error) {
        console.error('Erro ao obter perfil:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// 4. Função para atualizar perfil do usuário logado (Sem alterações)
exports.updateProfile = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        
        const { full_name, username, bio, city, state, preferences, avatar } = req.body;

        const updateData = {
            full_name,
            username,
            bio,
            city,
            state,
            preferences,
            profile_picture_url: avatar
        };

        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

        await Auth.updateProfile(user_id, updateData);

        const updatedUserRaw = await Auth.findById({ user_id });
        if (!updatedUserRaw) {
            return res.status(404).json({ error: 'Usuário não encontrado após atualização.' });
        }

        const userProfile = {
            user_id: updatedUserRaw.user_id,
            username: updatedUserRaw.username,
            email: updatedUserRaw.email,
            full_name: updatedUserRaw.full_name,
            avatar: updatedUserRaw.profile_picture_url,
            bio: updatedUserRaw.bio,
            city: updatedUserRaw.city,
            state: updatedUserRaw.state,
            preferences: updatedUserRaw.preferences || [],
            books: updatedUserRaw.books || []
        };
        
        res.status(200).json(userProfile);

    } catch (error) {
        console.error('Erro ao atualizar perfil:', error.stack);
        res.status(500).json({ error: 'Erro interno do servidor ao atualizar perfil.' });
    }
};

// 5. Função para atualizar senha (Sem alterações)
exports.changePassword = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const { old_password, new_password } = req.body;

        if (!user_id) {
            return res.status(401).json({ error: 'Usuário não autenticado.' });
        }

        const updatedUser = await Auth.changePassword(user_id, old_password, new_password);

        res.status(200).json({
            message: 'Senha atualizada com sucesso',
            user: {
                user_id: updatedUser.user_id,
                username: updatedUser.username,
                email: updatedUser.email
            }
        });

    } catch (error) {
        if (error.message.includes('Senha antiga incorreta')) {
            return res.status(401).json({ error: 'Senha antiga incorreta.' });
        }
        if (error.message.includes('Senha deve ter pelo menos 8 caracteres') ||
            error.message.includes('Nova senha não pode ser igual') ||
            error.message.includes('obrigatória')) {
            return res.status(400).json({ error: 'Dados inválidos para atualização de senha', details: error.message.split(', ') });
        }
        console.error('Erro ao mudar senha:', error.stack);
        res.status(500).json({ error: 'Erro interno do servidor ao mudar senha.' });
    }
};

// 6. Função para deletar a conta (Sem alterações)
exports.deleteAccount = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const { password } = req.body;

        const deleted = await Auth.deleteAccount(user_id, password);

        if (!deleted) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        res.status(204).send();

    } catch (error) {
        if (error.message === 'Senha incorreta.') {
            return res.status(401).json({ error: error.message });
        }
        if (error.message.includes('senha é necessária')) {
            return res.status(400).json({ error: 'Senha é necessária para confirmar.' });
        }
        console.error('Erro ao deletar conta:', error.stack);
        res.status(500).json({ error: 'Erro interno do servidor ao deletar conta.' });
    }
};