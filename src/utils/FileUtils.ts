import {
    cpSync,
    createReadStream,
    createWriteStream,
    existsSync,
    mkdirSync,
    renameSync,
    rmSync,
    rmdirSync,
    statSync,
} from 'node:fs'
import { Logger } from './LoggerWrapper'
import { createHash } from 'node:crypto'
import { Readable, finished } from 'node:stream'
import AdmZip from 'adm-zip'
import { FILE_CONSTANTS } from './constants'
import { Bundle, BundleDownloadStates } from '../models/Bundle'
import { PathManager } from './PathManager'

export class FileUtils {
    static createDirectoryIfNotExists(path: string) {
        if (!existsSync(path)) {
            this.createDirectory(path)
        } else {
            Logger.info(`Directory ${path} already exists`)
        }
    }

    static createDirectory(path: string) {
        Logger.info(`Creating directory ${path}`)
        mkdirSync(path, { recursive: true })
        Logger.info(`Directory at ${path} created`)
    }

    static deleteDirectoryIfExists(path: string) {
        if (existsSync(path)) {
            this.deleteDirectory(path)
        }
    }

    static deleteDirectory(path: string) {
        Logger.info(`Deleting directory ${path}`)
        rmdirSync(path, { recursive: true })
        Logger.info(`Directory at ${path} deleted`)
    }

    static deleteFileIfExists(path: string) {
        if (existsSync(path)) {
            this.deleteFile(path)
        }
    }

    static deleteFile(path: string) {
        Logger.info(`Deleting file ${path}`)
        rmSync(path)
        Logger.info(`File at ${path} deleted`)
    }

    static createZipFile(dirPath: string, contentsPath: string, filterFn?: (filename: string) => boolean) {
        Logger.info(`Creating zip file at ${dirPath} with contents ${contentsPath}`)
        const zip = new AdmZip()

        const zipFileName = contentsPath.split('/').pop()! + '.zip'
        const zipFilePath = PathManager.joinPath(dirPath, zipFileName)

        zip.addLocalFolder(contentsPath, '', filterFn)
        zip.writeZip(zipFilePath)

        Logger.info(`Zip file at ${dirPath} created`)
    }

    static unzipFile(zipFilePath: string) {
        Logger.info(`Unzipping file at ${zipFilePath}`)

        const zipFilePathComponents = zipFilePath.split('.')
        zipFilePathComponents.pop()

        const unzipPath = zipFilePathComponents.join('.')

        const unzip = new AdmZip(zipFilePath)
        unzip.extractAllTo(unzipPath, true)

        Logger.info(`${unzipPath} unzipped`)

        return unzipPath
    }

    static createMd5Hash(path: string) {
        return new Promise<string>((resolve) => {
            const hash = createHash('md5')

            const input = createReadStream(path)
            input.on('readable', () => {
                const data = input.read()
                if (data) {
                    hash.update(data)
                } else {
                    resolve(hash.digest('hex'))
                }
            })
        })
    }

    static downloadBundle(bundle: Bundle) {
        const remoteUrl = bundle.url
        const localFileDir = PathManager.joinPath(PathManager.currentJsVersionDirectory, bundle.releaseVersion)

        Logger.info(`Downloading file at ${remoteUrl}`)

        this.createDirectoryIfNotExists(localFileDir)
        //Clean this up
        return new Promise<Bundle>((resolve, reject) => {
            const remoteFileName = remoteUrl.split('/').pop()!
            const localFilePath = PathManager.joinPath(localFileDir, remoteFileName)
            const file = createWriteStream(localFilePath)

            Logger.info(`Writing file at ${localFilePath}`)

            fetch(remoteUrl).then((response) => {
                if (response.ok) {
                    finished(Readable.fromWeb(response.body!).pipe(file), (err) => {
                        if (err) {
                            reject({ ...bundle, downloadState: BundleDownloadStates.FAILED })
                            Logger.log(err)
                        } else {
                            const extension = remoteFileName.split('.').pop()
                            if (extension == 'zip') {
                                const unzipPath = this.unzipFile(localFilePath)
                                resolve({
                                    ...bundle,
                                    downloadState: BundleDownloadStates.COMPLETED,
                                    localPath: PathManager.joinPath(unzipPath, FILE_CONSTANTS.BUNDLE()),
                                })
                            } else {
                                reject({
                                    ...bundle,
                                    downloadState: BundleDownloadStates.FAILED,
                                })
                                Logger.error('Bundle downloaded is not in zip file format')
                            }

                            Logger.log('Unzip succeded', PathManager.joinPath(localFileDir, FILE_CONSTANTS.BUNDLE()))
                        }
                    })
                } else {
                    reject({ ...bundle, downloadState: BundleDownloadStates.FAILED })
                    Logger.error('File download failed')
                }
            })
        })
    }

    static async downloadMultipleBundles(bundles: Bundle[]): Promise<Bundle[]> {
        const downloadPromises = bundles.map((bundle) => {
            return this.downloadBundle(bundle)
        })

        const downloadedBundles = await Promise.all(downloadPromises)

        return new Promise<Bundle[]>((resolve, reject) => {
            const downloadSuccess =
                downloadedBundles.filter((bundle) => bundle.downloadState === BundleDownloadStates.FAILED).length == 0

            if (downloadSuccess) {
                resolve(downloadedBundles)
            } else {
                reject(null)
            }
        })
    }

    static copyContentsToFolder(
        src: string,
        dest: string,
        filterFunc?: (source: string, destination: string) => boolean,
    ) {
        Logger.info(`Moving contents of ${src} to ${dest}`)
        cpSync(src, dest, { recursive: true, filter: filterFunc })
        Logger.info(`Moved contents of ${src} to ${dest}`)
    }

    static moveFile(src: string, dest: string) {
        Logger.info(`Moving file from ${src} to ${dest}`)
        renameSync(src, dest)
        Logger.info(`Moved file from ${src} to ${dest}`)
    }

    static getFileSize(filePath: string): number {
        const stats = statSync(filePath)

        return stats.size
    }
}
