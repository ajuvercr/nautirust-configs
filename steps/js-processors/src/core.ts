import { Stream, Writer } from "@treecg/connector-types";
import { BlankNode, DataFactory, DefaultGraph, NamedNode, Parser, Quad, Store, Term } from "n3";


export const { namedNode, blankNode, literal } = DataFactory;


export type NS = "http://www.w3.org/ns/shacl#"
    | "http://semweb.mmlab.be/ns/sds#"
    | "http://www.w3.org/ns/prov#"
    | "http://purl.org/net/p-plan#"
    | "http://example.org/ns#"
    | "http://www.w3.org/2001/XMLSchema#"
    | "https://w3id.org/ldes#";

export type NBNode = NamedNode | BlankNode;

export function createNSThing(ns: NS, thing: string): NamedNode {
    return namedNode(ns + thing)
}

export type ShapeTransform = (id: NBNode | undefined, store: Store) => NBNode;
export type AddProcess = (used: NBNode | undefined, store: Store) => NBNode;
export type DatasetTransform = (used: NBNode | undefined, store: Store) => NBNode;

export type QuadsTransform = (quads: Quad[]) => Quad[];

export const ty = namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type");
export const defaultGraph = new DefaultGraph();

function getLatestStream(store: Store): NBNode | undefined {
    const streams = store.getSubjects(ty, createNSThing("http://semweb.mmlab.be/ns/sds#", "Stream"), null)
        .filter(sub => store.getQuads(null, createNSThing("http://www.w3.org/ns/prov#", "used"), sub, null).length === 0);

    if (streams.length != 1) {
        console.error(`Couldn't determine previous stream, extected one got ${streams.length}`);
        return undefined;
    }

    return <NBNode>streams[0];
}

function getLatestShape(streamId: Term, store: Store): NBNode | undefined {
    const shapes = store.getObjects(streamId, createNSThing("http://semweb.mmlab.be/ns/sds#", "carries"), defaultGraph);

    if (shapes.length !== 1) {
        console.error(`A sds:stream should carry one type of members, not ${shapes.length}`)
        if (shapes.length == 0) return
    }

    const shapeIds = shapes.flatMap(id =>
        store.getObjects(id, createNSThing("http://semweb.mmlab.be/ns/sds#", "Shape"), defaultGraph)
    );

    if (shapeIds.length !== 1) {
        console.error(`A sds:stream can only carry one specified shape, not ${shapeIds.length}`)
        return
    }

    return <NBNode>shapeIds[0]
}

function getLatestDataset(streamId: Term, store: Store): NBNode | undefined {
    const datasets = store.getObjects(streamId, createNSThing("http://semweb.mmlab.be/ns/sds#", "dataset"), defaultGraph);

    if (datasets.length !== 1) {
        console.error(`A sds:stream should be derived from one dataset, not ${datasets.length}`)
        if (datasets.length == 0) return
    }

    return <NBNode>datasets[0];
}

export function transformMetadata(shT: ShapeTransform, gp: AddProcess, itemType: string, datasetT?: DatasetTransform): QuadsTransform {
    return (quads: Quad[]) => {
        const store = new Store();
        store.addQuads(quads);

        const latest = getLatestStream(store);
        const latestShape = !!latest ? getLatestShape(latest, store) : undefined;

        const activityId = gp(latest, store);

        const newShape = shT(latestShape, store);

        let datasetId = !!latest ? getLatestDataset(latest, store) : undefined;
        if (datasetId && datasetT) {
            datasetId = datasetT(datasetId, store);
        }


        const blank = store.createBlankNode();
        const streamId = store.createBlankNode();

        store.addQuad(streamId, ty, createNSThing("http://semweb.mmlab.be/ns/sds#", "Stream"));
        if (datasetId) {
            store.addQuad(streamId, createNSThing("http://semweb.mmlab.be/ns/sds#", "dataset"), datasetId);
        }
        store.addQuad(streamId, createNSThing("http://semweb.mmlab.be/ns/sds#", "carries"), blank);
        store.addQuad(streamId, createNSThing("http://www.w3.org/ns/prov#", "wasGeneratedBy"), activityId);

        store.addQuad(blank, ty, namedNode(itemType));
        store.addQuad(blank, createNSThing("http://semweb.mmlab.be/ns/sds#", "shape"), newShape);


        const out: Quad[] = [];
        for (let q of store) out.push(<any>q);

        return out;
    }
}

export function createProperty(store: Store, path: NBNode, dataType?: NBNode, nodeKind?: NBNode, minCount?: number, maxCount?: number): BlankNode | NamedNode {
    const newId = store.createBlankNode();

    store.addQuad(newId, createNSThing("http://www.w3.org/ns/shacl#", "path"), path)
    if (dataType)
        store.addQuad(newId, createNSThing("http://www.w3.org/ns/shacl#", "datatype"), dataType)

    if (nodeKind)
        store.addQuad(newId, createNSThing("http://www.w3.org/ns/shacl#", "nodeKind"), nodeKind)

    if (minCount !== undefined)
        store.addQuad(newId, createNSThing("http://www.w3.org/ns/shacl#", "minCount"), literal(minCount))
    if (maxCount !== undefined)
        store.addQuad(newId, createNSThing("http://www.w3.org/ns/shacl#", "maxCount"), literal(maxCount))

    return newId;
}

export type SR<T> = {
    [P in keyof T]: Stream<T[P]>;
}

export type SW<T> = {
    [P in keyof T]: Writer<T[P]>;
}
