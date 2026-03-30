import { validateFileDisputePayload } from "./file.dispute.schema.js";
import { fileClientDispute } from "./file.dispute.service.js";

export const fileDisputeController = async (req, res) => {
  try {
    const { valid, message, data } = validateFileDisputePayload(req.body);

    if (!valid) {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    const saved = await fileClientDispute(data);

    return res.status(201).json({
      success: true,
      message: "Dispute filed successfully",
      data: saved,
    });
  } catch (error) {
    console.error("File Dispute Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while filing dispute",
    });
  }
};
