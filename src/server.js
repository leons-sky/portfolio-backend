import "./env";

import db from "./db/db";
import app from "./api/app";
import { Category, Tag } from "./db/models";
import categories from "./db/data/categories.json" assert { type: "json" };
import tags from "./db/data/tags.json" assert { type: "json" };

async function sync(force) {
	force = Boolean(force);

	await db.sync({
		force: force,
	});

	if (force) {
		await Category.bulkCreate(categories);
		await Tag.bulkCreate(tags);
	}
}

db.authenticate()
	.then(async () => {
		console.log("Connected to mysql database.");

		await sync();

		app.listen(process.env.PORT, () => {
			console.log(`Successfully listening on port ${process.env.PORT}`);
		});
	})
	.catch((err) => {
		console.error("Unable to connect to database:", err);
	});
