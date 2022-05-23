import { BasicBucketizer, GeospatialBucketizer, SubjectPageBucketizer, SubstringBucketizer } from "@treecg/bucketizers";
import { BucketizerOptions } from "@treecg/types";
import { writeFileSync } from "fs";
import { readFile } from "fs/promises";
import { BlankNode, NamedNode, Quad, Store, Term } from "n3";
import { createNSThing, createProperty, defaultGraph, literal, NBNode, SR, SW, transformMetadata, ty } from "./core";
import { Cleanup } from './exitHandler';


interface Bucketizer {
    bucketize: (quads: Quad[], memberId: string) => void;
    exportState: () => any;
    importState: (state: any) => void;
}

type Data = { "data": Quad[], "metadata": Quad[] };

type BucketTypes = "basic" | "geo" | "substring" | "subject";
function createBucketizer(type: BucketTypes, options: BucketizerOptions, state?: any): Promise<Bucketizer> {
    switch (type) {
        case "basic": return BasicBucketizer.build(options, state);
        case "geo": return GeospatialBucketizer.build(options, 2, state);
        case "subject": return SubjectPageBucketizer.build(options, state);
        case "substring": return SubstringBucketizer.build(options, state);
    }
    throw "no bucketetizer with type " + type
}

async function readState(path: string): Promise<any | undefined> {
    try {
        const str = await readFile(path, { "encoding": "utf-8" });
        return JSON.parse(str);
    } catch (e) {
        return
    }
}

async function writeState(path: string, content: any): Promise<void> {
    const str = JSON.stringify(content);
    writeFileSync(path, str, { encoding: "utf-8" })
}

function shapeTransform(id: Term | undefined, store: Store): BlankNode | NamedNode {
    const newId = store.createBlankNode();
    if (id) {
        const intTerm = createNSThing("integer", "http://www.w3.org/2001/XMLSchema#");
        const p1 = createProperty(store, createNSThing("bucket", "https://w3id.org/ldes#"), intTerm, 1, 1);
        const quads = store.getQuads(id, null, null, defaultGraph);

        for (let quad of quads) {
            store.addQuad(newId, quad.predicate, quad.object);
        }

        store.addQuad(newId, createNSThing("property", "http://www.w3.org/ns/shacl#"), p1);
        store.addQuads(quads);
        return newId
    } else {
        throw "no shape transform"

    }
}

function addProcess(id: NBNode | undefined, store: Store): NBNode {
    const newId = store.createBlankNode();
    const time = new Date().getTime();

    store.addQuad(newId, ty, createNSThing("Activity", "http://purl.org/net/p-plan#"));
    store.addQuad(newId, ty, createNSThing("Bucketization", "https://w3id.org/ldes#"));
    if (id)
        store.addQuad(newId, createNSThing("used", "http://www.w3.org/ns/prov#"), id);
    store.addQuad(newId, createNSThing("startedAtTime", "http://www.w3.org/ns/prov#"), literal(time));
    store.addQuad(newId, createNSThing("path", "https://w3id.org/ldes#"), createNSThing("bucket", "https://w3id.org/ldes#"));
    store.addQuad(newId, createNSThing("bucketType", "https://w3id.org/ldes#"), literal("basic"));
    store.addQuad(newId, createNSThing("propertyPath", "https://w3id.org/ldes#"), createNSThing("x", "http://example.org/ns#"));

    return newId;
}

export async function doTheBucketization(sr: SR<Data>, sw: SW<Data>, propertyPath: string, savePath: string) {
    const options = { pageSize: 2, propertyPath };

    const state = await readState(savePath);
    const bucketizer = await createBucketizer("basic", options, state);

    Cleanup(async () => {
        const state = bucketizer.exportState()
        await writeState(savePath, state);
    })

    sr.data.data(async (t) => {
        if (!t.length) return;

        const sub = t[0].subject;

        bucketizer.bucketize(t, sub.value);

        console.log("Pushing thing bucketized!")
        await sw.data.push(t);
    });

    const f = transformMetadata(shapeTransform, addProcess, "sds:Member");

    sr.metadata.data(
        quads => sw.metadata.push(f(quads))
    );
}