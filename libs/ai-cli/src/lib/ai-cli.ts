import { Command } from 'commander';

export function createAiCli(version = '1.0.0'): Command {
  const program = new Command();

  program
    .name('ai-cli')
    .description('Developer CLI for the Enterprise AI Workspace')
    .version(version);

  program
    .command('ping')
    .description('Verify the CLI is installed and runnable')
    .action(() => {
      console.log('ai-cli is ready');
    });

  program
    .command('gateway-url')
    .description('Print the default gateway dispatch endpoint')
    .action(() => {
      console.log('http://localhost:3000/api/v1/gateway/agent/dispatch');
    });

  return program;
}

export function runAiCli(argv: string[] = process.argv): void {
  createAiCli().parse(argv);
}
