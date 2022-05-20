import { parse } from "csv-parse";
import { createReadStream } from "fs";
import { Quad } from "n3";
import { SW } from "./core";

type Data = { data: Quad[] };

export function readCsvFile(location: string, sw: SW<Data>): Promise<void> {
    let headers: string[] = ["x", "y"];
    const things: any[] = [];

    setTimeout(() => {
        setInterval(() => {
            const thing = things.shift()
            if (thing) {
                console.log("pushing things and stuff")
                console.log(thing)
                sw.data.push(thing);
            }

        }, 1000)
    }, 8000);

    return new Promise(res => {
        createReadStream(location)
            .pipe(parse({ delimiter: ",", fromLine: 2 }))
            .on('headers', (newHeaders) => {
                console.log("headers", headers)
                headers = newHeaders;
            }).on("data", (data: any[]) => {
                console.log("data", data);

                const out: any = {};

                for (let i = 0; i < Math.min(data.length, headers.length); i++) {
                    out[headers[i]] = data[i];
                }

                things.push(out);
            })
            .on("close", () => {
                res(undefined);
            })
    })
}