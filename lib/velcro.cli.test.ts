import {VelcroCLI, VelcroCommands} from './velcro.cli'
import type {StrapOptions} from './velcro.strap'
import {ConsoleLogger} from './logger'

describe('VelcroCLI', () => {

    async function executeAndExpect(args: string): Promise<VelcroCommands> {
        const commands = {
            defaultCommand: jest.fn(),
            strapCommand: jest.fn(() => Promise.resolve()),
        }
        await new VelcroCLI(commands).yargs.parseAsync(args)
        return commands
    }

    describe('no subcommand', () => {

        it('executes when no subcommand parsed', async () => {
            const commands = await executeAndExpect('')
            expect(commands.defaultCommand).toHaveBeenCalled()
            expect(commands.strapCommand).not.toHaveBeenCalled()
        })
    })

    describe('strap', () => {

        async function strapExecuteAndExpect(args: string, expected: StrapOptions): Promise<void> {
            const commands = await executeAndExpect(args)
            expect(commands.defaultCommand).not.toHaveBeenCalled()
            expect(commands.strapCommand).toHaveBeenCalled()
            const options: StrapOptions = ((commands.strapCommand as any).mock.calls[0] as any)[0]
            expect(options.environment).toStrictEqual(expected.environment)
            expect(options.elasticsearch).toStrictEqual(expected.elasticsearch)
            expect(options.configFile).toStrictEqual(expected.configFile)
            expect(options.logger instanceof ConsoleLogger).toStrictEqual(true)
        }

        it('parses --environment', async () => {
            await strapExecuteAndExpect('strap --environment test', {
                configFile: 'velcro.yaml',
                elasticsearch: {
                    address: undefined,
                    auth: undefined,
                    tls: {insecure: false},
                },
                environment: 'test',
                logger: new ConsoleLogger(),
            })
        })

        it('parses --node-address', async () => {
            await strapExecuteAndExpect('strap --node-address https://big-data.startup', {
                configFile: 'velcro.yaml',
                elasticsearch: {
                    address: 'https://big-data.startup',
                    auth: undefined,
                    tls: {insecure: false},
                },
                environment: undefined,
                logger: new ConsoleLogger(),
            })
        })

        it('parses --skip-tls-verify', async () => {
            await strapExecuteAndExpect('strap --skip-tls-verify', {
                configFile: 'velcro.yaml',
                elasticsearch: {
                    address: undefined,
                    auth: undefined,
                    tls: {insecure: true},
                },
                environment: undefined,
                logger: new ConsoleLogger(),
            })
        })

        it('parses --use-api-key-auth', async () => {
            await strapExecuteAndExpect('strap --use-api-key-auth', {
                configFile: 'velcro.yaml',
                elasticsearch: {
                    address: undefined,
                    auth: 'apiKey',
                    tls: {insecure: false},
                },
                environment: undefined,
                logger: new ConsoleLogger(),
            })
        })

        it('parses --use-basic-auth', async () => {
            await strapExecuteAndExpect('strap --use-basic-auth', {
                configFile: 'velcro.yaml',
                elasticsearch: {
                    address: undefined,
                    auth: 'basic',
                    tls: {insecure: false},
                },
                environment: undefined,
                logger: new ConsoleLogger(),
            })
        })

        it('parses --use-token-auth', async () => {
            await strapExecuteAndExpect('strap --use-token-auth', {
                configFile: 'velcro.yaml',
                elasticsearch: {
                    address: undefined,
                    auth: 'token',
                    tls: {insecure: false},
                },
                environment: undefined,
                logger: new ConsoleLogger(),
            })
        })
    })
})
