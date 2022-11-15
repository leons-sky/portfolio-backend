import validator from "express-validator";
import error from "./error";

export default function (param_s) {
	let validators = [];
	if (Array.isArray(param_s)) {
		param_s.forEach((param) => {
			validators.push(
				validator.param(param, "Param is not an id").isNumeric()
			);
		});
	} else {
		validators.push(
			validator.param(param_s, "Param is not an id").isNumeric()
		);
	}

	validators.push(error(400));
	return validators;
}
