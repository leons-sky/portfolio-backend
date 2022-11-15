import validator from "express-validator";
import error from "./error";

export default function getRecord(param, model, options) {
	const key = model.name;

	options = options ?? {};

	if (options.noTimestamps) {
		options.attributes = {
			exclude: ["updatedAt", "createdAt"],
		};
		delete options.noTimestamps;
	}

	return [
		validator.param(param).custom(async (id, { req }) => {
			const record = await model.findByPk(id, options);
			req[key] = record;

			if (!record) {
				return Promise.reject(
					`A ${key} with that ${param} does not exist`
				);
			}
		}),
		error(404),
	];
}
