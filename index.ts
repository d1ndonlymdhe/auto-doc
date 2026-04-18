import { Router } from 'express'
import { METHODS } from "node:http"
const router = Router();
const methods = METHODS.map(m => m.toLowerCase())

const routeTree = {}


const r2 = Router()

router.use("/abcd",r2)

type Args = Parameters<typeof Router>

function SuperRouter() {
    const router = Router();
    let obj = {};
    const prototype = Object.getPrototypeOf(router);
    const proto = Object.getPrototypeOf(prototype)
    const keys = Object.keys(proto)
    for (const key of keys) {
        if (methods.includes(key)) {
            obj[key] = (...args) => {
                abcd.push({ method: key, path: args[0] })
            }
        }
    }

    obj["use"] = (...args)=>{
        let path = args[0]
        if (typeof path === "string") {
            
            routeTree[path] = {}
        }
    }

    return obj;
}


const sR = SuperRouter();
sR.get("/", () => { })
sR.post("/hello", () => { })
console.log(abcd)