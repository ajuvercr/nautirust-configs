import { BlankNode, NamedNode, Parser, Quad, Store, Term } from "n3";
import { createNSThing, createProperty, defaultGraph, literal, NBNode, SR, SW, transformMetadata, ty } from "./core";


function shapeTransform(id: Term | undefined, store: Store): BlankNode | NamedNode {
    const newId = store.createBlankNode();
    if (id) {
        const quads = store.getQuads(id, null, null, defaultGraph);
        store.addQuads(quads);
        return newId
    }

    const intTerm = createNSThing("http://www.w3.org/2001/XMLSchema#", "integer");

    const p1 = createProperty(store, createNSThing("http://example.org/ns#", "x"), intTerm, undefined, 1, 1);
    const p2 = createProperty(store, createNSThing("http://example.org/ns#", "y"), intTerm, undefined, 1, 1);

    store.addQuad(newId, ty, createNSThing("http://www.w3.org/ns/shacl#", "NodeShape"))
    store.addQuad(newId, createNSThing("http://www.w3.org/ns/shacl#", "targetClass"), createNSThing("http://example.org/ns#", "Point"));

    store.addQuad(newId, createNSThing("http://www.w3.org/ns/shacl#", "property"), p1);
    store.addQuad(newId, createNSThing("http://www.w3.org/ns/shacl#", "property"), p2);

    return newId;
}

function addProcess(id: NBNode | undefined, store: Store): NBNode {
    const newId = store.createBlankNode();
    const time = new Date().getTime();

    store.addQuad(newId, ty, createNSThing("http://purl.org/net/p-plan#", "Activity"));
    if (id)
        store.addQuad(newId, createNSThing("http://www.w3.org/ns/prov#", "used"), id);
    store.addQuad(newId, createNSThing("http://www.w3.org/ns/prov#", "startedAtTime"), literal(time));

    return newId;
}

type Data = { "metadata": Quad[] };
export function updateMetadata(sr: SR<Data>, sw: SW<Data>) {
    const f = transformMetadata(shapeTransform, addProcess, "sds:Member");

    sr.metadata.data(
        quads => sw.metadata.push(f(quads))
    );
}
