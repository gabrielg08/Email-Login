const catchError = require("../utils/catchError");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../utils/sendEmail");
const EmailCode = require("../models/emailCode");
const { where } = require("sequelize");


const getAll = catchError(async (req, res) => {
  const results = await User.findAll();
  delete req.body.password;

  return res.json(results);
});

const create = catchError(async (req, res) => {
  const { password, email, firstName, frontBaseUrl } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const body = { ...req.body, password: hashedPassword };
  const user = await User.create(body);

  const code = require('crypto').randomBytes(64).toString('hex')
  
  await EmailCode.create({
    code: code,
    userId: user.id
  })

  sendEmail({
    to: email,
    subject: "Nueva Cuenta",
    html: `
    <div style="max-width: 500px; margin: 50px auto; background-color: #F8FAFC; padding: 30px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); font-family: 'Arial', sans-serif; color: #333333;">
      <h1 style="color: #007BFF; font-size: 28px; text-align: center; margin-bottom: 20px;">¡Hola ${firstName.toUpperCase()} 👋🏼!</h1>
      <p style="font-size: 18px; line-height: 1.6; margin-bottom: 25px; text-align: center;">Gracias por registrarte en nuestra aplicación. Para verificar su cuenta, haga clic en el siguiente enlace:</p>
      <div style="text-align: center;">
          <a href="${frontBaseUrl}/verify_email/${code}" style="display: inline-block; background-color: #007BFF; color: #FFFFFF; text-align: center; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 18px;">¡Verificar cuenta!</a>
      </div>
    </div>
`,
  });
  return res.status(201).json(user);
});

const getOne = catchError(async (req, res) => {
  const { id } = req.params;
  const user = await User.findByPk(id);

  if (!user) res.send("User not found. 🔍").status(404);
  return res.json(user);
});

const destroy = catchError(async (req, res) => {
  const { id } = req.params;
  const user = await User.destroy({ where: { id } });

  if (!user) res.sendStatus(404);
  return res.send("User Deleted. 🗑️").status(204);
});

const update = catchError(async (req, res) => {
  const { id } = req.params;
  delete req.body.email;

  const { password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const body = { ...req.body, password: hashedPassword };

  const user = await User.findByPk(id);
  if (!user) return res.sendStatus(404);

  const userUpdate = await User.update(body, {
    where: { id },
    returning: true,
  });
  return res.json(userUpdate);
});

const login = catchError(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });

  if (!user) return res.status(401).json({ error: "Invalid Credetianls X" });

  //Password
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return res.status(401).json({ error: "Invalid Credetianls X" });

  const token = jwt.sign(
    { user },
    process.env.TOKEN_SECRET,
    {expiresIn: "1d"}
  )

  return res.json({user, token});
});

const verifyUser = catchError(async (req, res) => {
  const {code} = req.params
  const userCode = await EmailCode.findOne({where: {code}})

  if(!userCode) return res.Status(401).json({error: 'User not found'})

  const user = await User.findByPk(userCode.userId)
  await user.update(
    {
      isVerifed: true
    }
  )

  await userCode.destroy()
  return res.json(user)

})
const logged = catchError(async (req, res) => {
  const user = req.user
  return res.json(user)
})
module.exports = {
  getAll,
  create,
  getOne,
  destroy,
  update,
  login,
  verifyUser,
  logged
};
