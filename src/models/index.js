const User = require("./User");
const email = require("./emailCode");

email.belongsTo(User)
User.hasMany(email)