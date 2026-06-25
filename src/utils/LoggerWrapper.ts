import chalk from 'chalk'

class Logger {
    static preMessage = '' //'------------------------------'
    static postMessage = '' //'------------------------------'

    static error(...args: string[]) {
        console.log(chalk.red(...args))
    }

    static info(...args: string[]) {
        console.log(chalk.blue(...args))
    }

    static success(...args: string[]) {
        console.log(chalk.green(...args))
    }

    static log(...args: any[]) {
        console.log(...args)
    }
}

export { Logger }
