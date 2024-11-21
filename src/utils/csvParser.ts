import Papa from "papaparse";
import { GameData } from "../types/types";

export const parseCSV = (file: string): Promise<GameData[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        resolve(results.data as GameData[]);
      },
      error: (error: Error) => {
        reject(error);
      },
    });
  });
};
