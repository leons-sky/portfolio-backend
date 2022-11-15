import { DataTypes } from "sequelize";
import db from "../db";

export default db.define("project", {
	title: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	description: {
		type: DataTypes.STRING,
	},
	image: {
		type: DataTypes.STRING,
	},
	repository_name: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	repository_owner: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	repository_url: {
		type: DataTypes.STRING,
		allowNull: false,
		unique: true,
	},
	use_repository_description: {
		type: DataTypes.BOOLEAN,
		defaultValue: true,
		allowNull: false,
	},
});
