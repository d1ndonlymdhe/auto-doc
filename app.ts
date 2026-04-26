import express from "express"
import cors from "cors"
import { flattenRoutes } from "./lib/TypedRouter";
import rootRouter from "./routes/rootRoutes";

const app = express();
app.use(express.json())
app.use(cors())

app.use("/", rootRouter.router())
app.get("/routes", (req, res) => {
    const routes = rootRouter.__meta__.routes.map((route) => flattenRoutes(route, "")).flat()
    res.json(routes)
})

app.listen(3000)