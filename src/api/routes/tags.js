import validator from "express-validator";
import { Router } from "express";
import { Tag } from "../../db/models";
import { auth, error } from "../middleware";

const tagsRouter = Router();

tagsRouter.get("/", async (req, res) => {
	const tags = await Tag.findAll();
	res.send(tags.map((tag) => tag.toJSON()));
});

tagsRouter.post(
	"/",
	auth(),
	[
		validator.body("name").isLength({
			min: 2,
			max: 32,
		}),
		validator.body("description").isLength({
			max: 100,
		}),
		validator.body("color").optional().isHexColor(),
		error(400),
	],
	async (req, res) => {
		let body = req.body;
		const values = {
			name: body.name,
			description: body.description,
			color: body.color,
		};
		try {
			const tag = await Tag.create(values);
			res.send(tag);
		} catch (err) {
			res.send(err);
		}
	}
);

export default tagsRouter;
