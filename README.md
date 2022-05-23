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


nautirust --config ./orchestrator.toml generate -o run.json steps/js-processors/1_csvstep.json steps/rmlstep.json

## Enter information as wanted
### mapping file is "mapping.ttl"
### csv source is "input.csv"


# Execute pipelin
nautirust --config ./orchestrator.toml run run.json
```
