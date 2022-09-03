import yargs from 'yargs/yargs'
import {hideBin} from 'yargs/helpers'

yargs(hideBin(process.argv))
    .command({
        command: 'strap',
        aliases: ['bootstrap', 'init'],
        describe: 'initialize index mappings',
        builder: (y) => y.options({
            environment: {alias: 'env', describe: 'init env target'},
        }),
        handler: async (args) => {
            const h = await import('./strap')
            await h.strap({
                environment: args.environment as string
            })
        },
    })
    .argv
