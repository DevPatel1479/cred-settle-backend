import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import queryRoutes from "./modules/queries/query.routes.js";
import fileDisputeRoutes from "./modules/filedispute/file.dispute.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.use(errorMiddleware);
app.use("/api/queries", queryRoutes);
app.use("/api", fileDisputeRoutes);
app.use("/api/auth", authRoutes);


app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "credsettle-backend" });
});



export default app;




