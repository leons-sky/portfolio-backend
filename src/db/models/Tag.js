import { DataTypes } from "sequelize";
import db from "../db";

export default db.define(
	"tag",
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
		color: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: "#9e9e9e",
		},
	},
	{
		timestamps: false,
	}
);
