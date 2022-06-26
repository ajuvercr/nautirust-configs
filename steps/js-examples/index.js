"use strict";
exports.__esModule = true;
exports.ingestData = exports.passData = exports.sayHello = void 0;
function sayHello(to) {
    console.log("hello", to);
}
exports.sayHello = sayHello;
// Just pass data
function passData(streamReader, streamWriter) {
    streamReader.someField.data(function (data) {
        console.log("data passing through", data);
        streamWriter.someField.push(data);
    });
}
exports.passData = passData;
function ingestData(streamReader) {
    streamReader.someField.data(function (data) {
        console.log("ingestion", data);
    });
}
exports.ingestData = ingestData;
