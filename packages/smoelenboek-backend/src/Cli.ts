import yargs from "yargs";
import { hideBin } from "yargs/helpers";

yargs(process.argv.slice(2))
  .commandDir('Commands', { extensions: ['ts']})
  .demandCommand()
  .help()
  .argv
