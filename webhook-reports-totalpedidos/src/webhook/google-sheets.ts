import {
  GoogleSpreadsheet,
  GoogleSpreadsheetWorksheet,
} from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import * as dotenv from 'dotenv';

dotenv.config();

export class GoogleSheet {
  public doc: GoogleSpreadsheet;

  constructor(spreadsheetUrl: string) {
    this.initializeDoc(spreadsheetUrl);
  }

  private async initializeDoc(spreadsheetUrl: string): Promise<void> {
    try {
      const match = spreadsheetUrl.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      const spreadsheetId = match ? match[1] : null;

      const jwtClient = new JWT({
        email: process.env.GOOGLE_SERVICE_CLIENT_EMAIL,
        key: process.env.GOOGLE_SERVICE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      this.doc = new GoogleSpreadsheet(spreadsheetId, jwtClient);
      await this.doc.loadInfo();
    } catch (error) {
      console.error('Error al inicializar el documento:', error.message);
      throw new Error(`Error al inicializar documento: ${error.message}`);
    }
  }

  async addSheet(
    title: string,
    headers: string[],
  ): Promise<GoogleSpreadsheetWorksheet> {
    try {
      const newSheet = await this.doc.addSheet({ title, index: 0 });
      await newSheet.setHeaderRow(headers);

      await newSheet.loadHeaderRow();
      if (newSheet.headerValues.length === 0) {
        throw new Error(
          'No se pudo establecer el encabezado en la nueva hoja.',
        );
      }

      return newSheet;
    } catch (error) {
      console.error('Error al añadir una nueva hoja:', error.message);
      throw new Error(`Error al añadir hoja: ${error.message}`);
    }
  }

  async sheetsPost(data: any, sheetPage = 0): Promise<any> {
    try {
      let sheet = this.doc.sheetsByIndex[sheetPage];
      try {
        return await sheet.addRow(data);
      } catch (error) {
        console.error('Error al añadir una fila re intentando:', error.message);
        if (error.message.includes('Unable to parse range')) {
          const sheetId = sheet.sheetId;
          const title = sheet.a1SheetName;
          const headers = sheet.headerValues;

          const existingSheet = this.doc.sheetsById[sheetId];
          if (existingSheet) {
            await sheet.delete();
          }

          sheet = await this.doc.addSheet({ title, index: sheetPage });
          await sheet.setHeaderRow(headers);

          return await sheet.addRow(data);
        } else {
          throw new Error(
            `Error inesperado al añadir fila: ${error.response?.data || error.message}`,
          );
        }
      }
    } catch (error) {
      console.error('Error general en sheetsPost:', error.message);
      throw new Error(`Error en sheetsPost: ${error.message}`);
    }
  }

  async sheetsGet(sheetPage = 0): Promise<{ [key: string]: any }[]> {
    try {
      const sheet = this.doc.sheetsByIndex[sheetPage];
      const rows = await sheet.getRows();
      return rows.map((row) => {
        const object = {};
        sheet.headerValues.forEach((header) => {
          object[header] = row.get(header);
        });
        return object;
      });
    } catch (error) {
      console.error('Error al obtener datos de la hoja:', error.message);
      throw new Error(
        `Error al obtener datos: ${error.response?.data || error.message}`,
      );
    }
  }

  async getSheetIndexByName(sheetName: string): Promise<number> {
    try {
      const sheet = this.doc.sheetsByTitle[sheetName];
      return sheet ? sheet.index : -1;
    } catch (error) {
      console.error(
        'Error al obtener el índice de la hoja por nombre:',
        error.message,
      );
      throw new Error(`Error al obtener índice de la hoja: ${error.message}`);
    }
  }

  async sheetsCreateMassive(data: any, sheetPage = 0): Promise<any> {
    try {
      const sheet = this.doc.sheetsByIndex[sheetPage];
      await sheet.clearRows();
      await sheet.addRows(data);
    } catch (error) {
      console.error('Error al crear filas masivas:', error.message);
      throw new Error(`Error al crear filas masivas: ${error.message}`);
    }
  }

  async createColumns(columnNames: string[], sheetPage = 0): Promise<void> {
    try {
      const sheet = this.doc.sheetsByIndex[sheetPage];
      let existingHeaders = [];
      try {
        await sheet.loadHeaderRow();
        existingHeaders = sheet.headerValues || [];
      } catch {
        existingHeaders = [];
      }

      if (existingHeaders.length === 0) {
        await sheet.setHeaderRow(columnNames);
      } else {
        const updatedHeaders = [
          ...new Set([...existingHeaders, ...columnNames]),
        ];
        await sheet.setHeaderRow(updatedHeaders);
      }
    } catch (error) {
      console.error('Error al crear nuevas columnas:', error.message);
      throw new Error(`Error al crear columnas: ${error.message}`);
    }
  }
  async clearSheet(sheetPage = 0): Promise<void> {
    const sheet = this.doc.sheetsByIndex[sheetPage];
    await sheet.clear();
  }
}
