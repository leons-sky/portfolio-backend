import { Sequelize } from "sequelize";

// export default new Sequelize({
// 	dialect: "mysql",
// 	database: "portfolio",
// 	host: process.env.DB_HOST,
// 	username: process.env.DB_USER,
// 	password: process.env.DB_PASS,
// 	logging: false,
// });

export default new Sequelize(process.env.DB_URI, {
	dialect: "mysql",
	logging: false,
});
