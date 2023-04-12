import dotenv from "dotenv";

import {
  checkRequiredEnvVars,
  getSourceFolderPath,
  getDestinationFolderPath,
  clearConsoleScreen,
  getConfirmation,
} from "./utils/configUtils";

import { initClientAndCheck, uploadFolder } from "./utils/doUtils";

dotenv.config();

const main = async () => {
  if (!checkRequiredEnvVars()) {
    console.log("Please fix the error(s) and rerun this script.");
    return;
  }

  try {
    await initClientAndCheck();
  } catch (ex) {
    console.log("Error initializing the AWS S3 client.", ex);
    return;
  }

  const sourceFolderPath = await getSourceFolderPath();
  const destinationFolderPath = await getDestinationFolderPath();

  clearConsoleScreen();

  console.log("Does this look right?\r\n\r\n");
  console.log(`     Source Folder: ${sourceFolderPath}`);
  console.log(`Destination Folder: ${destinationFolderPath}\r\n`);

  await getConfirmation();

  clearConsoleScreen();

  const publicUrls = await uploadFolder(
    sourceFolderPath,
    destinationFolderPath
  );

  console.log("\r\n\r\nUrls:\r\n\r\n");

  publicUrls.forEach((url) => {
    console.log(url);
  });
};

main();
