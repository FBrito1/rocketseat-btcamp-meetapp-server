import * as Yup from 'yup';
import User from '../models/User';

class UserController {
  async index(req, res) {
    const { userId } = req.params;

    if (userId !== String(req.userId)) {
      return res.status(400).json({
        error: 'Invalid Token',
      });
    }

    const user = await User.findAll(userId);

    if (!user) {
      return res.status(400).json({
        error: 'User not found',
      });
    }

    const { name, email } = user;

    return res.json({
      name,
      email,
    });
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
      password: Yup.string().min(6),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const userExists = await User.findOne({ where: { email: req.body.email } });

    if (userExists) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const { name, email, password } = await User.create(req.body);

    return res.json({ name, email, password });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      oldPassword: Yup.string().min(6),
      password: Yup.string()
        .min(6)
        .when('oldPassword', (oldPassword, field) =>
          oldPassword ? field.required() : field
        ),
      confirmPassword: Yup.string().when('password', (password, field) =>
        password ? field.required().oneOf([Yup.ref('password')]) : field
      ),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { email, oldPassword } = req.body;

    const user = await User.findAll(req.userId);

    if (email !== user.email) {
      const userExists = await User.findOne({
        where: { email },
      });

      if (userExists) {
        return res.status(400).json({ error: 'User already exists' });
      }
    }

    if (oldPassword && !(await user.checkPassword(oldPassword))) {
      return res.status(401).json({ error: 'Password does not match' });
    }

    const { id, name } = await user.update(req.body);

    return res.json({ id, name, email });
  }

  async delete(req, res) {
    const { userId } = req.params;

    if (userId !== String(req.userId)) {
      return res.status(400).json({
        error: 'Invalid Token',
      });
    }

    const user = await User.findAll(userId);

    if (!user) {
      return res.status(400).json({
        error: 'User not found',
      });
    }

    await User.destroy({ where: { id: userId } });

    return res.json({
      message: 'user deleted',
    });
  }
}

export default new UserController();
