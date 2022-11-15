import validator from "express-validator";
import { Router } from "express";
import { Category } from "../../db/models";
import { auth, error } from "../middleware";

const categoriesRouter = Router();

categoriesRouter.get("/", async (req, res) => {
	const categories = await Category.findAll();
	res.send(categories.map((category) => category.toJSON()));
});

categoriesRouter.post(
	"/",
	auth(),
	[
		validator.body("name").isLength({
			min: 3,
			max: 50,
		}),
		validator.body("description").isLength({
			max: 100,
		}),
		error(400),
	],
	async (req, res) => {
		let body = req.body;
		const values = {
			name: body.name,
			description: body.description,
		};
		try {
			const category = await Category.create(values);
			res.send(category);
		} catch (err) {
			res.send(err);
		}
	}
);

export default categoriesRouter;
