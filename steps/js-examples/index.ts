import { Stream, Writer } from "@treecg/connector-types";

export function sayHello(to: string) {
    console.log("hello", to);
}

// define Stream Type
type Data = { someField: {[label: string]: any} };

export type StreamWriter<T> = {
    [P in keyof T]: Writer<T[P]>;
}

export type StreamReader<T> = {
    [P in keyof T]: Stream<T[P]>;
}

// Just pass data
export function passData(streamReader: StreamReader<Data>, streamWriter: StreamWriter<Data>) {
    streamReader.someField.data((data: any) => {
        console.log("data passing through", data);
        streamWriter.someField.push(data);
    });
}


export function ingestData(streamReader: StreamReader<Data>) {
    streamReader.someField.data(data => {
        console.log("ingestion", data);
    });
}
