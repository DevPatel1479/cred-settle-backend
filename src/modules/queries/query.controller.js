import { raiseQuerySchema, resolveQuerySchema } from "./query.schema.js";
import { createClientQuery,resolveClientQueryById } from "./query.service.js";
import { apiResponse } from "../../utils/response.js";

export const raiseQuery = async (req, res, next) => {
  try {
    const payload = raiseQuerySchema.parse(req.body);

    const result = await createClientQuery(payload);

    res.status(201).json(
      apiResponse({
        success: true,
        message: "Query raised successfully",
        data: result,
      })
    );
  } catch (err) {
    next(err);
  }
};



export const resolveQuery = async (req, res, next) => {
  try {
    const payload = resolveQuerySchema.parse(req.body);

    const result = await resolveClientQueryById(payload);

    if (result?.error === "NOT_FOUND") {
      return res.status(404).json(
        apiResponse({
          success: false,
          message: "Query not found",
        })
      );
    }

    if (result?.error === "ALREADY_RESOLVED") {
      return res.status(400).json(
        apiResponse({
          success: false,
          message: "Query already resolved",
        })
      );
    }

    res.status(200).json(
      apiResponse({
        success: true,
        message: "Query resolved successfully",
        data: result,
      })
    );
  } catch (err) {
    next(err);
  }
};