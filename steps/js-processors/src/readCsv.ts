import { parse } from "csv-parse";
import { createReadStream } from "fs";
import { Quad } from "n3";
import { blankNode, literal, namedNode, SW } from "./core";

type Data = { data: Quad[] };

function createTimedOutPusher(things: any[], sw: SW<Data>) {
    return setTimeout(() => {
        setInterval(() => {
            const thing = things.shift()
            if (thing) {
                sw.data.push(thing);
            }

        }, 1000)
    }, 2000);
}

function readCsv(location: string, handler: (item: any[]) => void): Promise<void> {
    return new Promise(res => {
        createReadStream(location)
            .pipe(parse({ delimiter: ",", fromLine: 2 }))
            .on("data", handler)
            .on("close", () => {
                res(undefined);
            })
    });
}

export function readCsvAsRDF(location: string, sw: SW<Data>): Promise<void> {
    let headers: string[] = ["x", "y"];
    const things: any[] = [];

    createTimedOutPusher(things, sw);

    const handler = (data: any[]) => {
        const out: Quad[] = [];
        const id = blankNode();

        for (let i = 0; i < Math.min(data.length, headers.length); i++) {
            out.push(new Quad(id, namedNode("http://example.org/ns#" + headers[i]), literal(data[i])))
        }

        things.push(out);
    };

    return readCsv(location, handler);
}

export function readCsvFile(location: string, sw: SW<Data>): Promise<void> {
    let headers: string[] = ["x", "y"];
    const things: any[] = [];

    createTimedOutPusher(things, sw);
    const handler = (data: any[]) => {
        const out: any = {};

        for (let i = 0; i < Math.min(data.length, headers.length); i++) {
            out[headers[i]] = data[i];
        }

        things.push(out);
    };

    return readCsv(location, handler);
}