import { BlankNode, NamedNode, Parser, Quad, Store, Term } from "n3";
import { createNSThing, createProperty, defaultGraph, literal, NBNode, SR, SW, transformMetadata, ty } from "./core";


function shapeTransform(id: Term | undefined, store: Store): BlankNode | NamedNode {
    const newId = store.createBlankNode();
    if (id) {
        const quads = store.getQuads(id, null, null, defaultGraph);
        store.addQuads(quads);
        return newId
    }

    const intTerm = createNSThing("integer", "http://www.w3.org/2001/XMLSchema#");

    const p1 = createProperty(store, createNSThing("x", "http://example.org/ns#"), intTerm, 1, 1);
    const p2 = createProperty(store, createNSThing("y", "http://example.org/ns#"), intTerm, 1, 1);

    store.addQuad(newId, ty, createNSThing("NodeShape", "http://www.w3.org/ns/shacl#"))
    store.addQuad(newId, createNSThing("targetClass", "http://www.w3.org/ns/shacl#"), createNSThing("Point", "http://example.org/ns#"));

    store.addQuad(newId, createNSThing("property", "http://www.w3.org/ns/shacl#"), p1);
    store.addQuad(newId, createNSThing("property", "http://www.w3.org/ns/shacl#"), p2);

    return newId;
}

function addProcess(id: NBNode | undefined, store: Store): NBNode {
    const newId = store.createBlankNode();
    const time = new Date().getTime();

    store.addQuad(newId, ty, createNSThing("Activity", "http://purl.org/net/p-plan#"));
    if (id)
        store.addQuad(newId, createNSThing("used", "http://www.w3.org/ns/prov#"), id);
    store.addQuad(newId, createNSThing("startedAtTime", "http://www.w3.org/ns/prov#"), literal(time));

    return newId;
}

type Data = {"metadata": Quad[]};
export function updateMetadata(sr: SR<Data>, sw: SW<Data>) {
    const f = transformMetadata(shapeTransform, addProcess, "sds:Member");

    sr.metadata.data(
        quads => sw.metadata.push(f(quads))
    );
}