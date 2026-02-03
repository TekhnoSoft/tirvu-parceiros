const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Partner } = require('../models');

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, uf, city, role } = req.body;

    // Check if user exists
    let user = await User.findOne({ where: { email } });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User
    user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'partner' // Default to partner
    });

    // If partner, create Partner profile
    if (user.role === 'partner') {
      await Partner.create({
        userId: user.id,
        phone,
        uf,
        city,
        status: 'pending' // Default status
      });
    }

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create Token
    const payload = {
      id: user.id,
      role: user.role,
      name: user.name
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({ token, user: payload });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: req.user.role === 'partner' ? [{ model: Partner }] : []
    });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
