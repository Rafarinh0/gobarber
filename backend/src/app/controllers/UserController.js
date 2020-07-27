import User from '../models/User';

class UserController {
    async store(request, response) {
        const userExists = await User.findOne({ where: { email: request.body.email } });

        if (userExists) {
            return response.status(400).json({ error: 'User already exists!' });
        }

        const { id, name, email, provider } = await User.create(request.body);

        return response.json({
            id,
            name,
            email,
            provider,
        });
    }

    async update(req, res) {
        const { email, oldPassword } = req.body;
        const user = await User.findByPk(req.userId);
        if (email !== user.email) {
            const userExists = await User.findOne({
                where: { email },
            });
            if (userExists) {
                return res.status(400).json({ error: 'User already exists.' });
            }
        }
        // só faço isso se ele informou a senha antiga, isto é, quer alterar a senha
        if (oldPassword && !(await user.checkPassword(oldPassword))) {
            return res.status(401).json({ error: 'Password does not match.' });
        }

        const { id, name, provider } = await user.update(req.body);

        return res.json({ id, name, email, provider });
    }
}

export default new UserController();