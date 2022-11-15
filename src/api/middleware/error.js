import validator from "express-validator";

export default function (statusCode) {
	return function (req, res, next) {
		let errors = validator.validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(statusCode).send(errors.array());
		}
		next();
	};
}
