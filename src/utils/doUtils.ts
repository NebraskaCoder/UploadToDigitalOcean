/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
  ListObjectsV2Command,
  ListObjectsV2CommandInput,
  GetObjectCommand,
  GetObjectCommandInput,
} from "@aws-sdk/client-s3";
import { createRequest } from "@aws-sdk/util-create-request";
import { formatUrl } from "@aws-sdk/util-format-url";
import * as fs from "fs";
import * as path from "path";

let s3: S3Client;

export const initClient = () => {
  s3 = new S3Client({
    credentials: {
      accessKeyId: process.env.DO_ACCESS_KEY_ID!,
      secretAccessKey: process.env.DO_SECRET_ACCESS_KEY!,
    },
    endpoint: `https://${process.env.DO_ENDPOINT!}`,
    region: "nyc3", // Set a dummy region
  });
};

export const initClientAndCheck = () => {
  return new Promise((resolve, reject) => {
    try {
      initClient();
    } catch (ex) {
      return reject(ex);
    }

    if (!s3) {
      return reject("S3 not initialized!");
    } else {
      return resolve(true);
    }
  });
};

export const createDestinationFolder = async (folderPath: string) => {
  const params = {
    Bucket: process.env.SPACE_NAME!,
    Key: `${folderPath}/`, // Add a trailing slash to create a folder
    Body: "", // Upload an empty object
  };

  try {
    await s3.send(new PutObjectCommand(params));
    console.log(`Folder created: ${folderPath}\r\n`);
  } catch (error) {
    console.error(`Failed to create folder ${folderPath}`, error);
    throw error;
  }
};

export const uploadFile = async (filePath: string) => {
  const fileName = path.basename(filePath);
  const fileStream = fs.createReadStream(filePath);

  const params: PutObjectCommandInput = {
    Bucket: process.env.SPACE_NAME!,
    Key: `${process.env.SPACE_FOLDER_PATH!}/${fileName}`,
    Body: fileStream,
    ACL: "public-read",
  };

  try {
    console.log(`Uploading ${filePath}`);
    await s3.send(new PutObjectCommand(params));

    // Generate the public URL
    const request = await createRequest(s3, new PutObjectCommand(params));
    const publicUrl = formatUrl(request);

    return publicUrl;
  } catch (error) {
    console.log(`Failed to upload file at ${filePath}`, error);
  }
};

export const expectFolderToExist = (sourceFolder: string) => {
  if (
    !fs.existsSync(sourceFolder) ||
    !fs.statSync(sourceFolder).isDirectory()
  ) {
    throw Error(`Folder does not exist or is not a folder ${sourceFolder}`);
  }
};

export const logFolderFiles = (sourceFolder: string) => {
  expectFolderToExist(sourceFolder);

  const fileNames = fs.readdirSync(sourceFolder);
  console.log("Files in directory", fileNames);

  return fileNames;
};

export const uploadFolder = async (
  sourceFolder: string,
  destinationFolder: string
) => {
  await createDestinationFolder(destinationFolder);

  const fileNames = logFolderFiles(sourceFolder);

  console.log("\r\n");

  const publicUrls: string[] = [];

  for (const fileName of fileNames) {
    const filePath = path.join(sourceFolder, fileName);
    const fileStat = fs.statSync(filePath);

    if (fileStat.isFile()) {
      const publicUrl = await uploadFile(filePath);
      if (publicUrl) {
        publicUrls.push(publicUrl);
      }
    } else {
      console.log("Skipping File", fileName);
    }
  }

  return publicUrls;
};

export const listObjectsFromSpace = async (folderPath: string) => {
  const params: ListObjectsV2CommandInput = {
    Bucket: process.env.SPACE_NAME!,
    Prefix: folderPath,
  };

  try {
    const response = await s3.send(new ListObjectsV2Command(params));
    return response.Contents ?? [];
  } catch (error) {
    console.error(`Failed to list objects from ${folderPath}`, error);
    throw error;
  }
};

export const downloadObject = async (
  objectKey: string,
  destinationPath: string
) => {
  // If the objectKey ends with a '/', it indicates a "folder" object in Spaces
  if (objectKey.endsWith("/")) {
    // Ensure the directory exists on the local filesystem
    if (!fs.existsSync(destinationPath)) {
      fs.mkdirSync(destinationPath, { recursive: true });
    }
  } else {
    const params: GetObjectCommandInput = {
      Bucket: process.env.SPACE_NAME!,
      Key: objectKey,
    };

    try {
      const response = await s3.send(new GetObjectCommand(params));
      const fileStream = response.Body as NodeJS.ReadableStream;
      if (fileStream) {
        return new Promise((resolve, reject) => {
          const writeStream = fs.createWriteStream(destinationPath);
          fileStream.on("error", reject);
          writeStream.on("error", reject);
          writeStream.on("finish", resolve);
          fileStream.pipe(writeStream);
        });
      }
      console.log(`Downloaded ${objectKey} to ${destinationPath}`);
    } catch (error) {
      console.error(`Failed to download object ${objectKey}`, error);
      throw error;
    }
  }
};

export const downloadAllFromSpace = async (
  sourcePath: string,
  localDestinationPath: string
) => {
  const objects = await listObjectsFromSpace(sourcePath);

  for (const obj of objects) {
    if (obj.Key) {
      const objectPath = obj.Key.replace(sourcePath, "").slice(1); // Remove source path and leading slash
      const destinationPath = path.join(localDestinationPath, objectPath);

      // Ensure directory exists
      const dir = path.dirname(destinationPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      await downloadObject(obj.Key, destinationPath);
    }
  }
};
