# nautirust-configs

This repository contains useful nautirust runners, channels and some examples.

## Install

Install latest version of nautirust from [releases](https://github.com/ajuvercr/nautirust/releases/).
```
git submodule init
git submodule update
```

## Example usage

### Hello world

Inside steps/js-example there is a small ts example. After building it, it is ready to go (`tsc index.ts`).

To execute the hello world function with nautirust, we first need to generate a pipeline configuration.
```
nautirust generate -o say_hello.json steps/js-example/step_say_hello.json
```
Nautirust will ask who to greet, input anything.
Now nautirust saved the pipeline configuration as `say\_hello.json` and we can run this pipeline.
```
nautirust prepare say_hello.json  # installs the jsRunner
nautirust run say_hello.json
```
Success!


### Example with connectors 

Next to hello world there two other functions defined: `passData` and `ingestData`. `passData` forwards some data from a StreamReader to a StreamWriter.
`ingestData` just prints the incoming data to the console.

We can configure this pipeline with nautirust.
```
nautirust generate -o example.json steps/js-examples/step_pass_data.json steps/js-examples/step_ingest_data.json
```
Now nautirust will ask multiple questions.
- First a data input channel is asked, let's chose 'other' because there are no streamWriters defined prior in the pipeline.
- The file channel type is easy to interact with as a human, let's choose that one.
- Next some file configurations are presented, the one with "data/dataIn.json" looks good.
- Next the expected serialization is asked, here choose either json or plain.

All configuration for passData is done, next let's configure ingestData.
- Ingest data needs a channel to read from, nautirust suggest to connect ingestData with passData which we want!
- Next the channel type is required, choose either file or ws, it doens't matter.
- The configuration also doesn't matter.
- The serialization should be the same as the one you choose before.

Everything is set up and is ready to go!

```
nautirust run example.json
```

Now you can edit text in data/dataIn.json and you should see some messages in your console.


