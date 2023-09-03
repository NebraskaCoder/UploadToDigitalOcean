import dotenv from "dotenv";
import {
  checkRequiredEnvVars,
  getDownloadSourcePath,
  getDownloadDestinationPath,
  clearConsoleScreen,
  getConfirmation,
} from "./utils/configUtils";

import { initClientAndCheck, downloadAllFromSpace } from "./utils/doUtils";

dotenv.config();

const mainDownload = async () => {
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

  const sourceFolderPath = await getDownloadSourcePath();
  const destinationFolderPath = await getDownloadDestinationPath();

  clearConsoleScreen();

  console.log("Does this look right?\r\n\r\n");
  console.log(`     Source Folder in Spaces: ${sourceFolderPath}`);
  console.log(`Local Destination Folder: ${destinationFolderPath}\r\n`);

  await getConfirmation();

  clearConsoleScreen();

  await downloadAllFromSpace(sourceFolderPath, destinationFolderPath);

  console.log("\r\n\r\nDownload completed!\r\n\r\n");
};

mainDownload().catch((err) => {
  console.log("Cannot continue because of error: ", err);
});
