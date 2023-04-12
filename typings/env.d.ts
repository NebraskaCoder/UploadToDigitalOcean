declare namespace NodeJS {
  interface ProcessEnv {
    HEADLESS?: string;
    SOURCE_DIR?: string;
    SPACE_NAME?: string;
    SPACE_FOLDER_PATH?: string;
    DO_ENDPOINT?: string;
    DO_ACCESS_KEY_ID?: string;
    DO_SECRET_ACCESS_KEY?: string;
  }
}
