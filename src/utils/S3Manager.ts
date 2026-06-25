import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import fs from 'fs'
import { Logger } from './LoggerWrapper'
import { S3_CONSTANTS } from './constants'
import { PathManager } from './PathManager'

enum S3UploadStates {
    NOT_STARTED = 'NOT_STARTED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

export enum S3FileType {
    BUNDLE = 'BUNDLE',
    PATCH = 'PATCH',
}

export interface S3FileUpload {
    s3FileName: string
    localPath: string
    state?: S3UploadStates
    s3FileUrl?: string
    size?: number
    type: S3FileType
    bundleVersion?: number
    hash?: string
}

export class S3Manager {
    static shared = new S3Manager()

    readonly bucketName: string = S3_CONSTANTS.BUCKET_NAME()
    readonly region: string = S3_CONSTANTS.REGION()
    private s3Client: S3Client
    private uploadQueue: S3FileUpload[] = []

    private constructor() {
        this.s3Client = new S3Client({
            region: this.region,
        })
    }

    queueFileToUpload(file: S3FileUpload) {
        this.uploadQueue.push({ ...file, state: S3UploadStates.NOT_STARTED, s3FileUrl: this.getS3Url(file.s3FileName) })
    }

    getS3BasePath(fileName: string): string {
        return PathManager.joinPath(PathManager.s3BasePath, fileName)
    }

    getS3Url(fileName: string): string {
        return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${this.getS3BasePath(fileName)}`
    }

    private uploadFile(file: S3FileUpload): Promise<S3FileUpload> {
        return new Promise<S3FileUpload>((resolve, reject) => {
            const putCommand: PutObjectCommand = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: this.getS3BasePath(file.s3FileName),
                Body: fs.readFileSync(file.localPath),
            })

            Logger.info(
                'Upload started S3 path:',
                this.getS3BasePath(file.s3FileName),
                file.localPath,
                this.bucketName,
                this.region,
            )

            this.s3Client
                .send(putCommand)
                .then((response) => {
                    resolve({ ...file, state: S3UploadStates.COMPLETED })
                    Logger.log('Upload success', response)
                })
                .catch((err) => {
                    reject({ ...file, state: S3UploadStates.FAILED })
                    const e = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
                    Logger.log('Upload error:', e)
                })
        })
    }

    async uploadQueuedFiles(): Promise<S3FileUpload[]> {
        Logger.info('Uploading queued files')
        Logger.log('Uploading queued files', this.uploadQueue)
        const uploadPromises = this.uploadQueue.map((file) => {
            return this.uploadFile(file)
        })
        this.uploadQueue = []

        const filesUploaded = await Promise.all(uploadPromises)

        return new Promise<S3FileUpload[]>((resolve, reject) => {
            const allFilesDownloaded = !(
                filesUploaded.filter((file) => file.state === S3UploadStates.FAILED).length > 0
            )
            if (allFilesDownloaded) {
                resolve(filesUploaded)
            } else {
                reject(null)
            }
        })
    }
}
