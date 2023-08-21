import "dotenv/config";
import { spawn } from "child_process";
import fs from "node:fs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import cron from "node-cron";
import config from "./config.js";

function createBackupFile() {
  createBackupDirectory();
  const backupFilePath = `tmp/${formatDateToCustomString(new Date()).string
    }.zip`;
  return new Promise((resolve, reject) => {
    try {
      const mongodump = spawn("mongodump.exe", [
        `--uri=${config.mongoDBUri}`,
        `--archive=${backupFilePath}`,
        "--gzip",
      ]);
      mongodump.on("close", (code) => {
        if (code === 0) {
          console.log("mongodump closed successfully.");
          const fileBuffer = fs.readFileSync(backupFilePath);
          // fs.unlinkSync(backupFilePath)
          resolve(fileBuffer);
        } else {
          reject(new Error(`mongodump exited with code ${code}`));
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

function createBackupDirectory() {
  const backupDirectory = "./tmp";
  if (!fs.existsSync(backupDirectory)) {
    fs.mkdirSync(backupDirectory);
  }
}

function formatDateToCustomString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return {
    year,
    month,
    day,
    hours,
    minutes,
    string: `${year}-${month}-${day}-${hours}-${minutes}`, // 2021-07-01--12-00
  };
}

async function backupMongoDBToS3() {
  const { s3AccessKeyId, s3Region, s3Endpoint, s3SecretAccessKey } = config;
  const client = new S3Client({
    region: s3Region,
    endpoint: s3Endpoint,
    credentials: {
      accessKeyId: s3AccessKeyId,
      secretAccessKey: s3SecretAccessKey,
    },
  });

  const backupFileBuffer = await createBackupFile();

  const formatDate = formatDateToCustomString(new Date());

  const uploadParams = {
    Bucket: config.s3BucketName,
    Key: `backups/${formatDate.year}/${formatDate.month}/${formatDate.day}/${formatDate.string}.zip`,
    Body: backupFileBuffer,
  };

  await client.send(new PutObjectCommand(uploadParams));

}


const backupCron = config.backupCron || "0 */12 * * *";
cron.schedule(backupCron, () => {
  backupMongoDBToS3().catch((error) => {
    console.error("An error occurred:", error);
  });
}, {
  runOnInit: true,
});
