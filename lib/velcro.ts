import yargs from 'yargs/yargs'
import {hideBin} from 'yargs/helpers'

yargs(hideBin(process.argv))
    .command({
        command: 'strap',
        aliases: ['bootstrap', 'init'],
        describe: 'initialize index mappings',
        handler: async () => {
            const h = await import('./strap')
            await h.strap()
        },
    })
    .argv
