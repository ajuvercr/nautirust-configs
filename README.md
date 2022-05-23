# nautirust-configs

This is an example pipeline powered by Nautirust.

Usage

```
git submodule init
git submodule update

cd runners/js-runner
npm i
npm run build

cd ../..


nautirust --config ./orchestrator.toml generate -o run.json steps/js-processors/1_csvrdfstep.json steps/2_bucketstep.json

## Enter information as wanted

- location: "input.csv"
- propertyPath: "http://example.org/ns#x"
- savePath: "save.json"


# Execute pipelin
nautirust --config ./orchestrator.toml run run.json
```

The `file` channel type is the easiest to use, because the user can add data to the channel by hand.
The start of the sds metadata can be found in `data/metadataIn.ttl`. This has metadata about the csv reading process. So it is recommended to use this file as the metadata channel.

The bucketization step requires a metadata channel and adds new sds metadata, 
if configured to use `data/metadataOut.ttl` the user can see the newly created metadata there.

The code that changes this metadata is located at `steps/js-processors/src/core.ts` and `steps/js-processors/metadatatransforms.ts`. If looks for a sds stream that is not used, this is the latest sds stream.
Then a process is added that uses this sds stream.


