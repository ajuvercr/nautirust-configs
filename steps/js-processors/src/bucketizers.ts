import { BasicBucketizer, createBucketizerLD } from "@treecg/bucketizers";
import { writeFileSync } from "fs";
import { readFile } from "fs/promises";
import { BlankNode, NamedNode, Parser, Quad, Store, Term } from "n3";
import { createNSThing, createProperty, defaultGraph, literal, NBNode, SR, SW, transformMetadata, ty } from "./core";
import { Cleanup } from './exitHandler';

type Data = { "data": Quad[], "metadata": Quad[] };


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

function shapeTransform(id: Term | undefined, store: Store, property: NBNode): BlankNode | NamedNode {
    console.log("transforming shape")
    const newId = store.createBlankNode();
    if (id) {
        const p1 = createProperty(store, property, undefined, undefined, 1, 1);
        const quads = store.getQuads(id, null, null, defaultGraph);

        for (let quad of quads) {
            store.addQuad(newId, quad.predicate, quad.object);
        }

        store.addQuad(newId, createNSThing("http://www.w3.org/ns/shacl#", "property"), p1);
        store.addQuads(quads);
        return newId
    } else {
        throw "no shape transform"

    }
}

function addProcess(id: NBNode | undefined, store: Store, strategyId: NBNode, bucketizeConfig: Quad[]): NBNode {
    const newId = store.createBlankNode();
    const time = new Date().getTime();

    store.addQuad(newId, ty, createNSThing("http://purl.org/net/p-plan#", "Activity"));
    store.addQuad(newId, ty, createNSThing("https://w3id.org/ldes#", "Bucketization"));

    store.addQuads(bucketizeConfig);

    store.addQuad(newId, createNSThing("http://www.w3.org/ns/prov#", "startedAtTime"), literal(time));
    store.addQuad(newId, createNSThing("http://www.w3.org/ns/prov#", "used"), strategyId);
    if (id)
        store.addQuad(newId, createNSThing("http://www.w3.org/ns/prov#", "used"), id);

    return newId;
}

export async function doTheBucketization(sr: SR<Data>, sw: SW<Data>, location: string, savePath: string) {
    const content = await readFile(location, { encoding: "utf-8" });
    const quads = new Parser().parse(content);


    const quadMemberId = <NBNode>quads.find(quad =>
        quad.predicate.equals(ty) && quad.object.equals(createNSThing("https://w3id.org/ldes#", "BucketizeStrategy"))
    )!.subject;

    const bucketProperty = <NBNode>(quads.find(quad =>
        quad.subject.equals(quadMemberId) && quad.predicate.equals(createNSThing("https://w3id.org/ldes#", "bucketProperty"))
    )?.object || createNSThing("https://w3id.org/ldes#", "bucket"));


    const f = transformMetadata((x, y) => shapeTransform(x, y, bucketProperty), (x, y) => addProcess(x, y, quadMemberId, quads), "sds:Member");
    sr.metadata.data(
        quads => sw.metadata.push(f(quads))
    );
    if(sr.metadata.lastElement) {
        sw.metadata.push(f(sr.metadata.lastElement));
    }


    const state = await readState(savePath);
    const bucketizer = await createBucketizerLD(quads);
    if (state)
        bucketizer.importState(state);

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
}
