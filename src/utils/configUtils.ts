import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

export const checkIsHeadless = () =>
  process.env.HEADLESS && process.env.HEADLESS.trim().length > 0
    ? process.env.HEADLESS.toLowerCase() === "y" ||
      process.env.HEADLESS.toLowerCase() === "yes" ||
      process.env.HEADLESS.toLowerCase() === "1" ||
      process.env.HEADLESS.toLowerCase() === "t" ||
      process.env.HEADLESS.toLowerCase() === "true"
    : false;

export const checkRequiredEnvVars = () => {
  const isHeadless = checkIsHeadless();

  if (isHeadless && !process.env.SOURCE_DIR) {
    console.log(
      "Because this is running headless, you must provide the source directory 'SOURCE_DIR' env variable."
    );

    return false;
  }

  if (isHeadless && !process.env.SPACE_FOLDER_PATH) {
    console.log(
      "Because this is running headless, you must provide the Digital Ocean folder path 'SPACE_FOLDER_PATH' env variable."
    );

    return false;
  }

  if (!process.env.SPACE_NAME) {
    console.log(
      "You must provide the Digital Ocean 'SPACE_NAME' env variable."
    );

    return false;
  }

  if (!process.env.SPACE_FOLDER_PATH) {
    console.log(
      "You must provide the Digital Ocean 'SPACE_FOLDER_PATH' env variable."
    );

    return false;
  }

  if (!process.env.DO_ENDPOINT) {
    console.log(
      "You must provide the Digital Ocean 'DO_ENDPOINT' env variable."
    );

    return false;
  }

  if (!process.env.DO_ACCESS_KEY_ID) {
    console.log(
      "You must provide the Digital Ocean 'DO_ACCESS_KEY_ID' env variable."
    );

    return false;
  }

  if (!process.env.DO_SECRET_ACCESS_KEY) {
    console.log(
      "You must provide the Digital Ocean 'DO_SECRET_ACCESS_KEY' env variable."
    );

    return false;
  }

  return true;
};

export const getSourceFolderPath = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (process.env.SOURCE_DIR) {
      return resolve(process.env.SOURCE_DIR);
    }

    rl.question("Please enter the source folder path: ", (input) => {
      if (!input || input.trim().length < 1) {
        return reject("No Source Path");
      } else {
        return resolve(input);
      }
    });
  });
};

export const getDestinationFolderPath = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (process.env.SPACE_FOLDER_PATH) {
      return resolve(process.env.SPACE_FOLDER_PATH);
    }

    rl.question("Please enter the destination folder path: ", (input) => {
      if (!input || input.trim().length < 1) {
        return reject("No Destination Path");
      } else {
        return resolve(input);
      }
    });
  });
};

export const getConfirmation = () => {
  return new Promise((resolve, reject) => {
    if (checkIsHeadless()) {
      console.log("Running headless. Continuing automatically...");
      return resolve("yes");
    }

    rl.question("To continue, enter Y/YES: ", (input) => {
      if (
        !input ||
        input.trim().length < 1 ||
        (input.toLowerCase() !== "y" && input.toLowerCase() !== "yes")
      ) {
        return reject("Aborted!");
      } else {
        return resolve(input);
      }
    });
  });
};

export const clearConsoleScreen = () =>
  process.stdout.write(
    process.platform === "win32" ? "\x1Bc" : "\x1B[2J\x1B[3J\x1B[H"
  );
