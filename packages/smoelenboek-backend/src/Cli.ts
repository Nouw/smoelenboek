import yargs from "yargs";

yargs(process.argv.slice(2))
  .commandDir('Commands', { extensions: ['ts']})
  .demandCommand()
  .help()
  .argv
