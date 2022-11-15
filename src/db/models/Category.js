import { DataTypes } from "sequelize";
import db from "../db";

export default db.define(
	"category",
	{
		name: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
			primaryKey: true,
		},
		description: {
			type: DataTypes.STRING,
			allowNull: false,
		},
	},
	{
		timestamps: false,
	}
);
