import { Router } from 'express'
import { METHODS } from "node:http"
const router = Router();
const methods = METHODS.map(m => m.toLowerCase())

const abcd = [];

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
    return obj;
}


const sR = SuperRouter();
sR.get("/", () => { })
sR.post("/hello", () => { })
console.log(abcd)