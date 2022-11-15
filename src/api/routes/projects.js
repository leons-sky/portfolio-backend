import validator from "express-validator";

import _isImageURL from "image-url-validator";
const isImageURL = _isImageURL.default;

import { Router } from "express";
import sequelize, { Op } from "sequelize";
import { Category, Project, Tag } from "../../db/models";
import { getProject, getRepo, error, auth } from "../middleware";

const projectsRouter = Router();

function getCategory(category) {
	return Category.findOne({
		where: {
			name: sequelize.where(
				sequelize.fn("LOWER", sequelize.col("name")),
				Op.eq,
				category.toLowerCase()
			),
		},
	});
}

function getTags(tagNames) {
	tagNames = tagNames.map((tag) => tag.toLowerCase());
	return Tag.findAll({
		where: {
			name: sequelize.where(
				sequelize.fn("LOWER", sequelize.col("name")),
				Op.in,
				tagNames
			),
		},
	});
}

function findUnknownValues(truthyArray, unknownArray, test) {
	const unknownValues = [];
	for (let unknown of unknownArray) {
		let exists = false;
		for (let item of truthyArray) {
			if ((test && test(item, unknown)) || (!test && item == unknown)) {
				exists = true;
				break;
			}
		}
		if (!exists) {
			unknownValues.push(unknown);
		}
	}
	return unknownValues;
}

projectsRouter.get("/", async (req, res) => {
	const where = {};
	if (req.query.category) {
		const category = await getCategory(req.query.category);

		if (!category) {
			return res
				.status(400)
				.send(`No such category '${req.query.category}'`);
		}

		where["$category.name$"] = category.getDataValue("name");
	}
	if (req.query.tags) {
		const tagNames = req.query.tags.split(",").map((tag) => tag.trim());
		const tags = await getTags(tagNames);

		const nonExistantTags = findUnknownValues(
			tags.map((tag) => tag.getDataValue("name").toLowerCase()),
			tagNames
		);
		if (nonExistantTags.length > 0) {
			return res.status(400).send(`No such tags ${nonExistantTags}`);
		}

		where["$tags.name$"] = {
			[Op.in]: tags.map((tag) => tag.getDataValue("name")),
		};
	}

	const projects = await Project.findAll({
		attributes: {
			exclude: ["updatedAt", "createdAt"],
		},
		where: where,
		include: [Tag, Category],
	});

	res.send(projects.map((project) => project.toJSON()));
});

projectsRouter.post(
	"/",
	auth(),
	getRepo.body({
		allowPrivate: false,
	}),
	[
		validator.body("title").isLength({
			min: 1,
			max: 127,
		}),
		validator.body("description").optional().isLength({
			min: 1,
			max: 255,
		}),
		validator
			.body("image")
			.optional()
			.isURL()
			.custom(async (value) => {
				let isImage = await isImageURL(value);
				if (!isImage) {
					return Promise.reject("Provided resource is not an image");
				}
			}),
		validator.body("category").optional().isString(),
		error(400),
	],
	async (req, res) => {
		const body = req.body;

		if (!body.description && !req.repo.description) {
			return res
				.status(400)
				.send(
					"Repository does not have a description and a description was not provided."
				);
		}

		let category;
		if (body.category) {
			category = await getCategory(body.category);
			if (!category) {
				return res
					.status(400)
					.send(`No such category '${req.query.category}'`);
			}
		} else {
			category = await Category.findByPk("Default");
		}

		const values = {
			title: body.title,
			description: body.description,
			image: body.image,
			repository_name: req.repo.name,
			repository_owner: req.repo.owner.login,
			repository_url: req.repo.html_url,
			use_repository_description: !body.description,
		};
		try {
			const project = await Project.create(values);
			project.setCategory(category);
			res.send(project);
		} catch (err) {
			if (err.name && err.name.includes("Sequelize")) {
				// if (err.errors.filter(e => e.message == "PRIMARY must be unique").length > 0) {
				// 	return res.status(400).send("A category with that name already exists")
				// }
				return res
					.status(500)
					.send(`Sequelize error (${err.name}): ${err.errors}`);
			}
			res.status(500).send(err);
		}
	}
);

projectsRouter.get(
	"/:projectId",
	getProject({
		noTimestamps: true,
		include: [Tag, Category],
	}),
	async (req, res) => {
		res.send(req.project.toJSON());
	}
);

projectsRouter.get(
	"/:projectId/tags",
	getProject({
		noTimestamps: true,
		include: [Tag],
	}),
	async (req, res) => {
		res.send(req.project.toJSON().tags);
	}
);

projectsRouter.get(
	"/:projectId/category",
	getProject({
		noTimestamps: true,
		include: [Category],
	}),
	async (req, res) => {
		res.send(req.project.toJSON().category);
	}
);

projectsRouter.patch(
	"/:projectId/edit",
	auth(),
	getProject(),
	getRepo.custom(
		(req) => {
			const project = req.project;
			return [
				project.getDataValue("repository_owner"),
				project.getDataValue("repository_name"),
			];
		},
		{
			allowPrivate: false,
		}
	),
	[error(400)],
	async (req, res) => {
		console.log(req.repo);
		// let body = req.body ?? {};

		// if (body.tags?.add) {
		// 	const tags = await Tag.findAll({
		// 		where: {
		// 			name: {
		// 				[Op.in]: body.tags?.add,
		// 			},
		// 		},
		// 	});
		// 	if (tags.length > 0) {
		// 		req.project.addTags(tags);
		// 	}
		// }
		// if (body.tags?.remove) {
		// 	const tags = await Tag.findAll({
		// 		where: {
		// 			name: {
		// 				[Op.in]: body.tags?.remove,
		// 			},
		// 		},
		// 	});
		// 	if (tags.length > 0) {
		// 		req.project.removeTags(tags);
		// 	}
		// }

		res.sendStatus(200);
	}
);

export default projectsRouter;
